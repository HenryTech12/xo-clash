package org.techy.xo_clash.configuration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.techy.xo_clash.request.LeaveGameRequest;
import org.techy.xo_clash.service.GameService;
import org.techy.xo_clash.service.MatchMakingService;

import java.security.Principal;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class WebSocketEventListenerTest {

    private WebSocketEventListener listener;
    private MatchMakingService matchMakingService;
    private GameService gameService;

    @BeforeEach
    void setUp() {
        listener = new WebSocketEventListener();
        matchMakingService = mock(MatchMakingService.class);
        gameService = mock(GameService.class);
        listener.setMatchMakingService(matchMakingService);
        listener.setGameService(gameService);
        // Near-zero so tests don't have to wait out a real production-length window.
        ReflectionTestUtils.setField(listener, "reconnectGraceSeconds", 0L);
    }

    private SessionDisconnectEvent disconnectEventFor(String username) {
        SessionDisconnectEvent event = mock(SessionDisconnectEvent.class);
        Principal principal = mock(Principal.class);
        when(principal.getName()).thenReturn(username);
        when(event.getUser()).thenReturn(principal);
        return event;
    }

    private SessionConnectEvent connectEventFor(String username) {
        SessionConnectEvent event = mock(SessionConnectEvent.class);
        Principal principal = mock(Principal.class);
        when(principal.getName()).thenReturn(username);
        when(event.getUser()).thenReturn(principal);
        return event;
    }

    @Test
    void disconnectDuringActiveGame_doesNotEndSessionImmediately() {
        // Long enough that the scheduled teardown can't race ahead of the
        // assertion below and make this test flaky.
        ReflectionTestUtils.setField(listener, "reconnectGraceSeconds", 5L);
        when(matchMakingService.getActiveGameForPlayer("alice"))
                .thenReturn(Map.of("sessionId", "s1", "opponent", "bob"));

        listener.handleWebSocketDisconnectListener(disconnectEventFor("alice"));

        // The teardown is scheduled onto another thread, not run inline -
        // asserting immediately after the call proves it didn't run synchronously.
        verify(gameService, never()).leaveGame(any());
        verify(matchMakingService, never()).removeActivePlayers(anyString());
    }

    @Test
    void disconnectDuringActiveGame_endsSessionAfterGraceWindowElapses() throws InterruptedException {
        when(matchMakingService.getActiveGameForPlayer("alice"))
                .thenReturn(Map.of("sessionId", "s1", "opponent", "bob"));

        listener.handleWebSocketDisconnectListener(disconnectEventFor("alice"));
        Thread.sleep(400);

        verify(gameService, times(1)).leaveGame(new LeaveGameRequest("s1", "alice"));
        verify(matchMakingService).removeActivePlayers("alice");
        verify(matchMakingService).removeActivePlayers("bob");
    }

    @Test
    void reconnectWithinGraceWindow_cancelsSessionTeardown() throws InterruptedException {
        // A longer window here so the reconnect below has time to land first.
        ReflectionTestUtils.setField(listener, "reconnectGraceSeconds", 5L);
        when(matchMakingService.getActiveGameForPlayer("alice"))
                .thenReturn(Map.of("sessionId", "s1", "opponent", "bob"));

        listener.handleWebSocketDisconnectListener(disconnectEventFor("alice"));
        listener.handleWebSocketConnectListener(connectEventFor("alice"));

        Thread.sleep(200);

        verify(gameService, never()).leaveGame(any());
        verify(matchMakingService, never()).removeActivePlayers(anyString());
    }

    @Test
    void disconnectWhenNotInActiveGame_leavesQueueOnlyAndNeverSchedulesTeardown() throws InterruptedException {
        when(matchMakingService.getActiveGameForPlayer("alice")).thenReturn(null);

        listener.handleWebSocketDisconnectListener(disconnectEventFor("alice"));
        Thread.sleep(200);

        verify(matchMakingService).leaveQueue("alice");
        verifyNoInteractions(gameService);
    }
}
