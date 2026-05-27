package org.techy.xo_clash.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.techy.xo_clash.engine.TicTacToeEngine;
import org.techy.xo_clash.events.GameAction;
import org.techy.xo_clash.events.PowerUp;
import org.techy.xo_clash.events.RabbitMQProducer;
import org.techy.xo_clash.model.BoardState;
import org.techy.xo_clash.model.GameSession;
import org.techy.xo_clash.request.GameMoveRequest;
import org.techy.xo_clash.request.LeaveGameRequest;
import org.techy.xo_clash.response.GameStateResponse;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Setter
@Getter
@Service
@Slf4j
public class GameService {

    Map<String,GameSession> gameSessions = new ConcurrentHashMap<>();
    Map<String,BoardState> boardStates = new ConcurrentHashMap<>();
    Map<String, int[]> lastMoves = new ConcurrentHashMap<>(); // To track the last move of each player for undo functionality
    @Autowired
    private RabbitMQProducer rabbitMQProducer;
    @Autowired
    private SimpMessagingTemplate actionsMessagingTemplate;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private TrackProgressService trackProgressService;


    public BoardState initBoard(String sessionId) {
        BoardState boardState = new BoardState();
        boardState.setBoard(new String[3][3]);
        boardStates.put(sessionId, boardState);
        return boardState;
    }
    public GameSession createGameSession(String opponent, String playerId) {
        GameSession gameSession = new GameSession();
        gameSession.setSessionId(UUID.randomUUID().toString());

        Random random = new Random();

        // 1. Randomly decide symbols
        // Result 0: Opponent is X, Player is O | Result 1: Opponent is O, Player is X
        boolean opponentIsX = random.nextBoolean();
        Map<String, String> players = new HashMap<>();

        if (opponentIsX) {
            players.put(opponent, "X");
            players.put(playerId, "O");
        } else {
            players.put(opponent, "O");
            players.put(playerId, "X");
        }
        gameSession.setPlayers(players);

        // 2. Randomly decide who starts the game (Current Player)
        // This picks one of the two IDs at random
        String[] ids = {opponent, playerId};
        String startingPlayer = ids[random.nextInt(ids.length)];
        gameSession.setCurrentPlayer(startingPlayer);

        // 3. Save and return
        gameSessions.put(gameSession.getSessionId(), gameSession);
        return gameSession;
    }

    public Map<String, Object> handleGameMove(GameMoveRequest gameMoveRequest) {
        GameSession gameSession = gameSessions.get(gameMoveRequest.getSessionId());
        Map<String,Object> result = new HashMap<>();

        if(gameSession == null || gameSession.isGameOver()) {
            throw new RuntimeException("Game session not found or game already over");
        }
        BoardState boardState = boardStates.get(gameMoveRequest.getSessionId());
        String gameTurn = gameSession.getPlayers().get(gameMoveRequest.getPlayer());


        if((gameTurn.equalsIgnoreCase("X") || gameTurn.equalsIgnoreCase("O")) && gameMoveRequest.getPlayer().
                equals(gameSession.getCurrentPlayer())) {
            if(boardState == null) {
                boardState = initBoard(gameMoveRequest.getSessionId());
            }

            if(isSpaceBlocked(boardState.getBoard(), gameMoveRequest.getRow(), gameMoveRequest.getCol())) {
                rabbitMQProducer.handlePowerUp("powerUps.blocked", "Spaces is blocked, choose another box",gameMoveRequest.getPlayer(), PowerUp.BLOCK_CELL.name());
                return invalidMoveResponse(gameMoveRequest, boardState, gameSession, gameTurn, "Space is blocked by a power-up, choose another box");
            }
            if(isGhostMove(boardState.getBoard(), gameMoveRequest.getRow(), gameMoveRequest.getCol())) {
                rabbitMQProducer.handlePowerUp("powerUps.ghost", "Spaces is haunted, choose another box",gameMoveRequest.getPlayer(), PowerUp.GHOST_MOVE.name());
                return invalidMoveResponse(gameMoveRequest, boardState, gameSession, gameTurn, "Space is haunted by a power-up, choose another box");
            }
            
            String[][] board = boardState.getBoard();
            if (!Objects.equals(board[gameMoveRequest.getRow()][gameMoveRequest.getCol()], null) && 
                !board[gameMoveRequest.getRow()][gameMoveRequest.getCol()].isEmpty()) {
                rabbitMQProducer.handleNotifications("notifications.unavailable", "Spaces is filled, choose another box",gameMoveRequest.getSessionId());
                return invalidMoveResponse(gameMoveRequest, boardState, gameSession, gameTurn, "Space is already filled");
            }

            // Valid Move
            board[gameMoveRequest.getRow()][gameMoveRequest.getCol()] = gameTurn;
            boardState.setBoard(board);
            boardStates.replace(gameMoveRequest.getSessionId(), boardState);
            
            String winner = checkWinner(board);
            if (winner != null) {
                gameSession.setGameOver(true);
                result.put("winner", gameMoveRequest.getPlayer());
                result.put("message", "Game Over! Winner: " + gameMoveRequest.getPlayer());
            } else if (isBoardFull(board)) {
                gameSession.setGameOver(true);
                result.put("winner", "DRAW");
                result.put("message", "Game Over! It's a DRAW");
            } else {
                gameSession.setCurrentPlayer(getTheOtherPlayer(gameSession.getPlayers(), gameSession.getCurrentPlayer()));
                rabbitMQProducer.handleNotifications("notifications.turn", "Move Made, Player:".concat(gameSession.getCurrentPlayer()).concat(" Make your move..."),gameSession.getSessionId());
                result.put("winner", null);
                result.put("message", "Move accepted");
            }

            result.put("sessionId", gameMoveRequest.getSessionId());
            result.put("board", boardState.getBoard());
            result.put("currentPlayer", gameSession.getCurrentPlayer());
            result.put("currentPlayerSymbol", (gameTurn.equalsIgnoreCase("X")) ? "O" : "X");
            result.put("gameOver", gameSession.isGameOver());
            
            storeLastMove(gameMoveRequest.getSessionId(), gameMoveRequest.getRow(), gameMoveRequest.getCol());
            actionsMessagingTemplate.convertAndSend("/topic/actions/".concat(gameMoveRequest.getSessionId()), result);
        }
        else {
            rabbitMQProducer.handleNotifications("notifications.turn", "Invalid Game Turn, Player ".concat(gameTurn).concat(" Make your move"),gameMoveRequest.getSessionId());
        }

        gameSessions.replace(gameMoveRequest.getSessionId(),gameSession);
        return result;
    }

    private Map<String, Object> invalidMoveResponse(GameMoveRequest request, BoardState boardState, GameSession session, String turn, String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", request.getSessionId());
        result.put("board", boardState.getBoard());
        result.put("currentPlayer", session.getCurrentPlayer());
        result.put("currentPlayerSymbol", turn);
        result.put("gameOver", session.isGameOver());
        result.put("winner", null);
        result.put("message", message);
        return result;
    }

    private String checkWinner(String[][] board) {
        // Rows and Columns
        for (int i = 0; i < 3; i++) {
            if (board[i][0] != null && !board[i][0].isEmpty() && board[i][0].equals(board[i][1]) && board[i][0].equals(board[i][2])) return board[i][0];
            if (board[0][i] != null && !board[0][i].isEmpty() && board[0][i].equals(board[1][i]) && board[0][i].equals(board[2][i])) return board[0][i];
        }
        // Diagonals
        if (board[0][0] != null && !board[0][0].isEmpty() && board[0][0].equals(board[1][1]) && board[0][0].equals(board[2][2])) return board[0][0];
        if (board[0][2] != null && !board[0][2].isEmpty() && board[0][2].equals(board[1][1]) && board[0][2].equals(board[2][0])) return board[0][2];
        return null;
    }

    private boolean isBoardFull(String[][] board) {
        for (int r = 0; r < 3; r++) {
            for (int c = 0; c < 3; c++) {
                if (board[r][c] == null || board[r][c].isEmpty() || board[r][c].equals("G") || board[r][c].equals("B")) return false;
            }
        }
        return true;
    }
        return result;
    }

    public void storeLastMove(String sessionId, int rows, int cols) {
        lastMoves.put(sessionId, new int[]{rows, cols});
    }

    public Map<String,Object> canUndoOpponentMove(String sessionId, String playerId, String powerUpName) {
        GameSession gameSession = gameSessions.get(sessionId);
        if(gameSession == null) {
            throw new RuntimeException("Game session not found, Invalid Game");
        }
        String currentPlayer = gameSession.getCurrentPlayer();
        if(currentPlayer.equals(playerId)) {
               BoardState boardState = boardStates.get(sessionId);
               int[] lastMove = lastMoves.get(sessionId);
               if(lastMove != null) {
                   int lastRow = lastMove[0];
                   int lastCol = lastMove[1];
                   String[][] board = boardState.getBoard();
                   board[lastRow][lastCol] = ""; // Clear the last move
                   boardStates.replace(sessionId, boardState);
                   rabbitMQProducer.handlePowerUp("powerUps.undo", "Opponent's last move has been undone, make your move now!", playerId, PowerUp.UNDO_MOVE.name());
                   return powerUpActivationResponse(gameSession,sessionId, boardState.getBoard(), powerUpName);
           }
        }
        return null;
    }

    public Map<String, Object> canSwapCell(String sessionId, String playerId, int targetRow, int targetCol, String powerUpName) {
        GameSession gameSession = gameSessions.get(sessionId);
        Map<String,Object> result = new LinkedHashMap<>();

        if(gameSession == null) {
            throw new RuntimeException("Game session not found, Invalid Game");
        }
        String currentPlayer = gameSession.getCurrentPlayer();
        if(currentPlayer.equals(playerId)) {
               BoardState boardState = boardStates.get(sessionId);
               String[][] board = boardState.getBoard();
               String currentSymbol = gameSession.getPlayers().get(playerId);
               if(!Objects.equals(board[targetRow][targetCol], null) && !board[targetRow][targetCol].equals(currentSymbol)) {
                   // Swap the cell with the current player's symbol
                   board[targetRow][targetCol] = currentSymbol;
                   boardState.setBoard(board);
                   boardStates.replace(sessionId, boardState);
                   rabbitMQProducer.handlePowerUp("powerUps.swap", "Cell swapped successfully", playerId, PowerUp.SWAP_CELL.name());
                   return powerUpActivationResponse(gameSession,sessionId, boardState.getBoard(), powerUpName);
               }
        }
        return null;
    }

    public boolean verifySession(String sessionId) {
        return gameSessions.containsKey(sessionId);
    }

    public boolean verifyMove(String playerId, String powerUpsName) {
        return trackProgressService.getPowerUps(playerId).contains(powerUpsName);
    }

    public Map<String,Object> powerUpActivationResponse(GameSession gameSession, String sessionId, String[][] boardState, String powerUpName) {
        Map<String,Object> result = new HashMap<>();
        result.put("sessionId", sessionId);
        result.put("board", boardState);
        result.put("currentPlayer", gameSession.getCurrentPlayer());
        result.put("currentPlayerSymbol", gameSession.getPlayers().get(gameSession.getCurrentPlayer()));
        result.put("gameOver", gameSession.isGameOver());
        result.put("winner", null);
        result.put("message", powerUpName.concat(" activated!"));
        rabbitMQProducer.handlePowerUp("powerUps.activate",powerUpName.concat(" ".concat("activated!")),gameSession.getCurrentPlayer(),powerUpName);
        return result;
    }

    public Map<String, Object> canPlayExtraMove(String sessionId, String playerId, String powerUpName) {
        GameSession gameSession = gameSessions.get(sessionId);
        Map<String,Object> result = new LinkedHashMap<>();

        BoardState boardState = boardStates.get(sessionId);
        if(gameSession == null) {
            throw new RuntimeException("Game session not found, Invalid Game");
        }
        String currentPlayer = gameSession.getCurrentPlayer();
        if(currentPlayer.equals(playerId)) {
            gameSession.setCurrentPlayer(playerId); // Keep the same player as the current player for the next turn
            gameSessions.replace(sessionId, gameSession);
            rabbitMQProducer.handlePowerUp("powerUps.extraMove", "Extra move activated, make your move now!", playerId, PowerUp.EXTRA_MOVE.name());
        }
        return powerUpActivationResponse(gameSession,sessionId, boardState.getBoard(), powerUpName);
    }



    public boolean isAllSpacesFilled(String[][] board, int row, int col) {
       return (Objects.equals(board[row][col], "X") || Objects.equals(board[row][col], "O"));
    }

    public Map<String, Object> activateGhostMove(String sessionId, int row, int col, String powerUpName) {
        BoardState boardState = boardStates.get(sessionId);
        GameSession gameSession = gameSessions.get(sessionId);
        String[][] board = boardState.getBoard();
        if(!(Objects.equals(board[row][col], "X") && Objects.equals(board[row][col], "O"))) {
            board[row][col] = "G";
        }
        boardState.setBoard(board);
        boardStates.replace(sessionId,boardState);
        return powerUpActivationResponse(gameSession,sessionId, boardState.getBoard(), powerUpName);
    }

    public Map<String,Object> activateBlockMove(String sessionId, int row, int col, String powerUpName) {
        BoardState boardState = boardStates.get(sessionId);
        GameSession gameSession = gameSessions.get(sessionId);
        String[][] board = boardState.getBoard();
        if(!(Objects.equals(board[row][col], "X") && Objects.equals(board[row][col], "O"))) {
            board[row][col] = "B";
        }
        boardState.setBoard(board);
        boardStates.replace(sessionId,boardState);
        return powerUpActivationResponse(gameSession,sessionId, boardState.getBoard(), powerUpName);
    }


    public boolean isSpaceBlocked(String[][] board, int row, int col) {
        return (Objects.equals(board[row][col], "B"));
    }

    public boolean isGhostMove(String[][] board, int row, int col) {
        return (Objects.equals(board[row][col], "G"));
    }

    public String getTheOtherPlayer(Map<String, String> map, String providedKey) {
        for (String key : map.keySet()) {
            if (!key.equals(providedKey)) {
                return key; // <--- CHANGE THIS: Return the Player ID (the key)
            }
        }
        return null;
    }



    // GAME STATE MANAGEMENT
    public GameSession getGameSession(String sessionId) {
        return gameSessions.get(sessionId);
    }

    public void endSession(String sessionId) {
        GameSession gameSession = gameSessions.get(sessionId);
        if(sessionId == null || gameSession == null) {
            rabbitMQProducer.handleNotifications("notifications.invalid", "Invalid Game Session Id",sessionId);
            return;
        }
        else {
            gameSessions.remove(sessionId);
            boardStates.remove(sessionId);
            state = null;
            rabbitMQProducer.handleNotifications("notifications.ended", "Game Session Ended",sessionId);
            actionsMessagingTemplate.convertAndSend("/topic/actions/".concat(sessionId), GameAction.GAME_ENDED);
        }
    }

    public void leaveGame(LeaveGameRequest leaveGameRequest) {
        String sessionId = leaveGameRequest.sessionId();
        GameSession gameSession = gameSessions.remove(sessionId);
        boardStates.remove(sessionId);
        lastMoves.remove(sessionId);

        if(gameSession == null) {
            rabbitMQProducer.handleNotifications("notifications.leave", "Invalid Game Session Id", sessionId);
        }
        else {
            rabbitMQProducer.handleNotifications("notifications.left", "Game has ended, Player: ".concat(leaveGameRequest.playerId()), sessionId);
            actionsMessagingTemplate.convertAndSend("/topic/actions/".concat(sessionId), GameAction.PLAYER_LEFT);
        }
    }

    public void requestPlayAgain(String sessionId, String requesterUsername) {
        GameSession gameSession = gameSessions.get(sessionId);
        String otherPlayer = getTheOtherPlayer(gameSession.getPlayers(), requesterUsername);
        if(!Objects.isNull(otherPlayer)) {
            actionsMessagingTemplate.convertAndSend("/topic/play-again/".concat(sessionId)+"/"+ otherPlayer, GameAction.PLAY_AGAIN);
        }
    }

    public void rejectPlayAgainRequest(String sessionId, String rejectorUsername) {
        GameSession gameSession = gameSessions.get(sessionId);
        String otherPlayer = getTheOtherPlayer(gameSession.getPlayers(), rejectorUsername);

        if (!Objects.isNull(otherPlayer)) {
            Map<String, Object> rejectMessage = new HashMap<>();
            rejectMessage.put("action", "PLAY_AGAIN_REJECT");
            rejectMessage.put("message", "Play again request rejected");

            try {
                String messageJson = objectMapper.writeValueAsString(rejectMessage);
                actionsMessagingTemplate.convertAndSend("/topic/play-again/".concat(sessionId)+"/"+ otherPlayer, messageJson);
            } catch (Exception e) {
                log.error("Failed to serialize rejection message", e);
            }
        }
    }

    public Map<String, Object> acceptPlayAgainRequest(String sessionId, String acceptorUsername) {
        GameSession gameSession = gameSessions.get(sessionId);
        String otherPlayer = getTheOtherPlayer(gameSession.getPlayers(), acceptorUsername);

        if (!Objects.isNull(otherPlayer)) {
            // Reset Board State
            boardStates.remove(sessionId);
            state = null;
            initBoard(sessionId);
            // Reset Game Session State
            gameSession.setCurrentPlayer(otherPlayer); // Let the other player start
            gameSession.setGameOver(false);
            gameSessions.replace(sessionId, gameSession);
        }

        String gameTurn = gameSession.getPlayers().get(gameSession.getCurrentPlayer());
        BoardState boardState = boardStates.get(sessionId);

        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", gameSession.getSessionId());
        result.put("board", boardState.getBoard());
        result.put("currentPlayer", gameSession.getCurrentPlayer());
        result.put("currentPlayerSymbol", gameTurn);
        result.put("gameOver", gameSession.isGameOver());
        result.put("winner", null);
        result.put("action", "PLAY_AGAIN_ACCEPT");
        result.put("message", "Play again request accepted");

        // Send the complete game state to the requester (other player)
        if (!Objects.isNull(otherPlayer)) {
            try {
                String messageJson = objectMapper.writeValueAsString(result);
                actionsMessagingTemplate.convertAndSend("/topic/play-again/".concat(sessionId)+"/"+ otherPlayer, messageJson);
            } catch (Exception e) {
                log.error("Failed to serialize game state", e);
            }
        }

        rabbitMQProducer.handleNotifications("notifications.play-again", "Play Again Request Accepted, Starting new game...",gameSession.getSessionId());
        return result;
    }

}

