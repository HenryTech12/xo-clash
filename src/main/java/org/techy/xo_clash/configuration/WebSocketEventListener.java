package org.techy.xo_clash.configuration;

import jakarta.annotation.PreDestroy;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.techy.xo_clash.request.LeaveGameRequest;
import org.techy.xo_clash.service.GameService;
import org.techy.xo_clash.service.MatchMakingService;

import java.security.Principal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

@Component
@Slf4j
@Setter
public class WebSocketEventListener {

    // A page refresh tears down the socket the same way quitting does, so an
    // in-progress match gets this long to reconnect before it's treated as a
    // real departure - the opponent isn't notified and the session isn't torn
    // down until the window elapses with no reconnect.
    @Value("${game.reconnect.grace-seconds:18}")
    private long reconnectGraceSeconds;

    @Autowired
    private MatchMakingService matchMakingService;

    @Autowired
    private GameService gameService;

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    private final Map<String, ScheduledFuture<?>> pendingDisconnects = new ConcurrentHashMap<>();

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        Principal principal = event.getUser();
        if (principal == null) return;

        String username = principal.getName();
        ScheduledFuture<?> pending = pendingDisconnects.remove(username);
        if (pending != null) {
            pending.cancel(false);
            log.info("Player {} reconnected within the grace window, session kept alive", username);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        Principal principal = event.getUser();
        if (principal == null) return;

        String username = principal.getName();
        log.info("Player {} disconnected", username);

        // 1. Remove from matchmaking queue (no-op if they weren't queued)
        matchMakingService.leaveQueue(username);

        // 2. If in an active game, don't tear it down immediately - give the
        // player a grace window to reconnect (e.g. a page refresh) first.
        Map<String, String> activeGame = matchMakingService.getActiveGameForPlayer(username);
        if (activeGame == null) return;

        ScheduledFuture<?> future = scheduler.schedule(
                () -> endSessionAfterGracePeriod(username, activeGame),
                reconnectGraceSeconds,
                TimeUnit.SECONDS
        );

        ScheduledFuture<?> previous = pendingDisconnects.put(username, future);
        if (previous != null) {
            previous.cancel(false);
        }
    }

    private void endSessionAfterGracePeriod(String username, Map<String, String> activeGame) {
        pendingDisconnects.remove(username);
        String sessionId = activeGame.get("sessionId");
        String opponent = activeGame.get("opponent");

        log.info("Reconnect grace window elapsed, ending game session {} for player {}", sessionId, username);
        gameService.leaveGame(new LeaveGameRequest(sessionId, username));

        matchMakingService.removeActivePlayers(username);
        if (opponent != null) {
            matchMakingService.removeActivePlayers(opponent);
        }
    }

    @PreDestroy
    public void shutdown() {
        scheduler.shutdownNow();
    }
}
