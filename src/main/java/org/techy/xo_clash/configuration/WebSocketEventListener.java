package org.techy.xo_clash.configuration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.techy.xo_clash.request.LeaveGameRequest;
import org.techy.xo_clash.service.GameService;
import org.techy.xo_clash.service.MatchMakingService;

import java.security.Principal;
import java.util.Map;

@Component
@Slf4j
public class WebSocketEventListener {

    @Autowired
    private MatchMakingService matchMakingService;

    @Autowired
    private GameService gameService;

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        Principal principal = event.getUser();
        if (principal != null) {
            String username = principal.getName();
            log.info("Player {} disconnected", username);

            // 1. Remove from matchmaking queue
            matchMakingService.leaveQueue(username);

            // 2. If in active game, handle leave
            Map<String, String> activeGame = matchMakingService.getActiveGameForPlayer(username);
            if (activeGame != null) {
                String sessionId = activeGame.get("sessionId");
                String opponent = activeGame.get("opponent");
                
                log.info("Ending game session {} for player {}", sessionId, username);
                gameService.leaveGame(new LeaveGameRequest(sessionId, username));
                
                matchMakingService.removeActivePlayers(username);
                if (opponent != null) {
                    matchMakingService.removeActivePlayers(opponent);
                }
            }
        }
    }
}
