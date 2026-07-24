package org.techy.xo_clash.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.techy.xo_clash.events.RabbitMQProducer;
import org.techy.xo_clash.model.BoardState;
import org.techy.xo_clash.model.GameSession;
import org.techy.xo_clash.request.GameMoveRequest;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class GameServiceTest {

    private GameService gameService;
    private final String sessionId = UUID.randomUUID().toString();

    @BeforeEach
    void setUp() {
        gameService = new GameService();
        gameService.setRabbitMQProducer(mock(RabbitMQProducer.class));
        gameService.setActionsMessagingTemplate(mock(SimpMessagingTemplate.class));
        gameService.setObjectMapper(new ObjectMapper());
        gameService.setTrackProgressService(mock(TrackProgressService.class));
    }

    private GameSession newSession(String playerX, String playerO, String currentPlayer) {
        GameSession session = new GameSession();
        session.setSessionId(sessionId);
        Map<String, String> players = new HashMap<>();
        players.put(playerX, "X");
        players.put(playerO, "O");
        session.setPlayers(players);
        session.setCurrentPlayer(currentPlayer);
        gameService.getGameSessions().put(sessionId, session);
        return session;
    }

    @Test
    void handleGameMove_rejectsPlayerNotInSession() {
        newSession("alice", "bob", "alice");
        GameMoveRequest move = new GameMoveRequest(sessionId, 0, 0, "mallory");

        assertThrows(RuntimeException.class, () -> gameService.handleGameMove(move));
    }

    @Test
    void handleGameMove_rejectsOutOfBoundsCoordinates() {
        newSession("alice", "bob", "alice");
        GameMoveRequest move = new GameMoveRequest(sessionId, 9, 9, "alice");

        assertThrows(RuntimeException.class, () -> gameService.handleGameMove(move));
    }

    @Test
    void handleGameMove_wrongTurnReturnsPopulatedResponseNotEmptyMap() {
        newSession("alice", "bob", "alice");
        GameMoveRequest move = new GameMoveRequest(sessionId, 0, 0, "bob");

        Map<String, Object> result = gameService.handleGameMove(move);

        assertEquals(sessionId, result.get("sessionId"));
        assertEquals("It's not your turn", result.get("message"));
    }

    @Test
    void activateGhostMove_doesNotOverwriteOccupiedCell() {
        newSession("alice", "bob", "alice");
        BoardState board = gameService.initBoard(sessionId);
        board.getBoard()[0][0] = "X";

        Map<String, Object> result = gameService.activateGhostMove(sessionId, 0, 0, "GHOST_MOVE");

        String[][] resultBoard = (String[][]) result.get("board");
        assertEquals("X", resultBoard[0][0], "Ghost move must not overwrite an existing mark");
    }

    @Test
    void activateBlockMove_doesNotOverwriteOccupiedCell() {
        newSession("alice", "bob", "alice");
        BoardState board = gameService.initBoard(sessionId);
        board.getBoard()[1][1] = "O";

        Map<String, Object> result = gameService.activateBlockMove(sessionId, 1, 1, "BLOCK_CELL");

        String[][] resultBoard = (String[][]) result.get("board");
        assertEquals("O", resultBoard[1][1], "Block move must not overwrite an existing mark");
    }

    @Test
    void canPlayExtraMove_beforeAnyMoveMade_doesNotThrow() {
        // No initBoard() call here: simulates a power-up used before either
        // player has made a first move on this session.
        newSession("alice", "bob", "alice");

        Map<String, Object> result = gameService.canPlayExtraMove(sessionId, "alice", "EXTRA_MOVE");

        assertNotNull(result.get("board"));
    }

    @Test
    void canSwapCell_beforeAnyMoveMade_doesNotThrow() {
        newSession("alice", "bob", "alice");

        assertDoesNotThrow(() -> gameService.canSwapCell(sessionId, "alice", 0, 0, "SWAP_CELL"));
    }

    @Test
    void activateGhostMove_beforeAnyMoveMade_doesNotThrow() {
        newSession("alice", "bob", "alice");

        Map<String, Object> result = gameService.activateGhostMove(sessionId, 0, 0, "GHOST_MOVE");

        assertNotNull(result.get("board"));
    }

    @Test
    void activateBlockMove_beforeAnyMoveMade_doesNotThrow() {
        newSession("alice", "bob", "alice");

        Map<String, Object> result = gameService.activateBlockMove(sessionId, 0, 0, "BLOCK_CELL");

        assertNotNull(result.get("board"));
    }

    @Test
    void requestPlayAgain_unknownSession_throwsInsteadOfNpe() {
        assertThrows(RuntimeException.class, () -> gameService.requestPlayAgain("no-such-session", "alice"));
    }

    @Test
    void acceptPlayAgainRequest_unknownSession_throwsInsteadOfNpe() {
        assertThrows(RuntimeException.class, () -> gameService.acceptPlayAgainRequest("no-such-session", "alice"));
    }

    @Test
    void canSwapCell_detectsWinAfterSwap() {
        newSession("alice", "bob", "alice");
        BoardState board = gameService.initBoard(sessionId);
        // alice is "X": two X's already placed, swapping the third cell completes the row
        String[][] cells = board.getBoard();
        cells[0][0] = "X";
        cells[0][1] = "X";
        cells[0][2] = "O"; // occupied by opponent symbol so swap is allowed

        Map<String, Object> result = gameService.canSwapCell(sessionId, "alice", 0, 2, "SWAP_CELL");

        assertEquals("alice", result.get("winner"));
        assertEquals(true, result.get("gameOver"));
    }
}
