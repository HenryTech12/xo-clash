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

@Setter
@Getter
@Service
@Slf4j
public class GameService {

    Map<String,GameSession> gameSessions = new LinkedHashMap<>();
    Map<String,BoardState> boardStates = new LinkedHashMap<>();
    Map<String, int[]> lastMoves = new LinkedHashMap<>(); // To track the last move of each player for undo functionality
    private BoardState state;
    @Autowired
    private RabbitMQProducer rabbitMQProducer;
    @Autowired
    private SimpMessagingTemplate actionsMessagingTemplate;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private TrackProgressService trackProgressService;


    public void initBoard(String sessionId) {
        if(state == null) {
            state = new BoardState();
            state.setBoard(new String[3][3]);
            boardStates.put(sessionId, state);
        }
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

        if(gameSession == null) {
            throw new RuntimeException("Game session not found, Invalid Game");
        }
        BoardState boardState = boardStates.get(gameMoveRequest.getSessionId());
        String gameTurn = gameSession.getPlayers().get(gameMoveRequest.getPlayer());


        if((gameTurn.equalsIgnoreCase("X") || gameTurn.equalsIgnoreCase("O")) && gameMoveRequest.getPlayer().
                equals(gameSession.getCurrentPlayer())) {
            if(boardState == null) {
                initBoard(gameMoveRequest.getSessionId());
                boardState = state;
            }

            if(isSpaceBlocked(boardState.getBoard(), gameMoveRequest.getRow(), gameMoveRequest.getCol())) {
                rabbitMQProducer.handlePowerUp("powerUps.blocked", "Spaces is blocked, choose another box",gameMoveRequest.getPlayer(), PowerUp.BLOCK_CELL.name());
                result.put("sessionId", gameMoveRequest.getSessionId());
                result.put("board", boardState.getBoard());
                result.put("currentPlayer", gameSession.getCurrentPlayer());
                result.put("currentPlayerSymbol", (gameTurn.equalsIgnoreCase("X")) ? "O" : "X");
                result.put("gameOver", gameSession.isGameOver());
                result.put("winner", null);
                result.put("message", "Space is blocked by a power-up, choose another box");
                return result;
            }
            if(isGhostMove(boardState.getBoard(), gameMoveRequest.getRow(), gameMoveRequest.getCol())) {
                rabbitMQProducer.handlePowerUp("powerUps.ghost", "Spaces is haunted, choose another box",gameMoveRequest.getPlayer(), PowerUp.GHOST_MOVE.name());
                result.put("sessionId", gameMoveRequest.getSessionId());
                result.put("board", boardState.getBoard());
                result.put("currentPlayer", gameSession.getCurrentPlayer());
                result.put("currentPlayerSymbol", (gameTurn.equalsIgnoreCase("X")) ? "O" : "X");
                result.put("gameOver", gameSession.isGameOver());
                result.put("winner", null);
                result.put("message", "Space is haunted by a power-up, choose another box");
                return result;
            }
            if(isAllSpacesFilled(boardState.getBoard(), gameMoveRequest.getRow(), gameMoveRequest.getCol())) {
                rabbitMQProducer.handleNotifications("notifications.filled", "Spaces is filled, choose another box",gameMoveRequest.getSessionId());
                actionsMessagingTemplate.convertAndSend("/topic/actions/".concat(gameMoveRequest.getSessionId()), GameAction.SPACE_TAKEN);
            }
            else {

                String[][] board = boardState.getBoard();
                if (!Objects.equals(board[gameMoveRequest.getRow()][gameMoveRequest.getCol()], null)) {
                    rabbitMQProducer.handleNotifications("notifications.unavailable", "Spaces is filled, choose another box",gameMoveRequest.getSessionId());
                } else {
                    board[gameMoveRequest.getRow()][gameMoveRequest.getCol()] = gameTurn;
                    rabbitMQProducer.handleNotifications("notifications.available", "Move Made, Next Player Make your move",gameMoveRequest.getSessionId());
                }
                boardState.setBoard(board);
                boardStates.replace(gameMoveRequest.getSessionId(), boardState);
                gameSession.setCurrentPlayer(getTheOtherPlayer(gameSession.getPlayers(), gameSession.getCurrentPlayer()));

                rabbitMQProducer.handleNotifications("notifications.turn", "Move Made, Player:".concat(gameSession.getCurrentPlayer()).concat(" Make your move..."),gameSession.getSessionId());
                result.put("sessionId", gameMoveRequest.getSessionId());
                result.put("board", boardState.getBoard());
                result.put("currentPlayer", gameSession.getCurrentPlayer());
                result.put("currentPlayerSymbol", (gameTurn.equalsIgnoreCase("X")) ? "O" : "X");
                result.put("gameOver", gameSession.isGameOver());
                result.put("winner", null);
                result.put("message", "Move accepted");
                storeLastMove(gameMoveRequest.getSessionId(), gameMoveRequest.getRow(), gameMoveRequest.getCol());
                actionsMessagingTemplate.convertAndSend("/topic/actions/".concat(gameMoveRequest.getSessionId()), result);
            }
        }
        else {
            rabbitMQProducer.handleNotifications("notifications.turn", "Invalid Game Turn, Player ".concat(gameTurn).concat(" Make your move"),gameMoveRequest.getSessionId());
        }

        gameSessions.replace(gameMoveRequest.getSessionId(),gameSession);
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
        GameSession gameSession = gameSessions.get(leaveGameRequest.sessionId());

        if(gameSession == null) {
            rabbitMQProducer.handleNotifications("notifications.leave", "Invalid Game Session Id",leaveGameRequest.sessionId());
        }
        else {
            gameSessions.remove(leaveGameRequest.sessionId());

            rabbitMQProducer.handleNotifications("notifications.left", "Game has ended, Player: ".concat(leaveGameRequest.playerId()),leaveGameRequest.sessionId());
            actionsMessagingTemplate.convertAndSend("/topic/actions/".concat(leaveGameRequest.sessionId()), GameAction.PLAYER_LEFT);
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

