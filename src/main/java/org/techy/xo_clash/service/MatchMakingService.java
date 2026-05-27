package org.techy.xo_clash.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.techy.xo_clash.events.RabbitMQProducer;
import org.techy.xo_clash.model.BoardState;
import org.techy.xo_clash.model.GameSession;

import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.LinkedBlockingQueue;

@Service
public class MatchMakingService {

    private Queue<String> waitingPlayers = new LinkedBlockingQueue<>();
    private Map<String,Map<String,String>> activePlayers = new ConcurrentHashMap<>();

    @Autowired
    private GameService gameService;
    @Autowired
    private RabbitMQProducer rabbitMQProducer;

    public synchronized GameSession matchPlayers(String playerId) {
        // 1. Check if player is already in a game
        if (activePlayers.containsKey(playerId)) {
            return gameService.getGameSession(activePlayers.get(playerId).get("sessionId"));
        }

        // 2. Try to match with waiting players
        String opponent = waitingPlayers.poll();
        
        if (opponent == null) {
            waitingPlayers.add(playerId);
            rabbitMQProducer.handleNotifications("notifications.waiting", "Player " + playerId + " is waiting...",playerId);
            return null;
        } else {
            // Prevent matching with self (though poll handles this, if the queue had only self)
            if (opponent.equals(playerId)) {
                waitingPlayers.add(playerId);
                return null;
            }

            // 3. Create Session
            GameSession gameSession = gameService.createGameSession(opponent, playerId);
            String sessionId = gameSession.getSessionId();

            // 4. CRITICAL: Update mapping for BOTH players
            activePlayers.put(playerId, Map.of("opponent", opponent, "sessionId", sessionId));
            activePlayers.put(opponent, Map.of("opponent", playerId, "sessionId", sessionId));

            rabbitMQProducer.produceMappingForGameBetweenUsers("mappers.joined", "MATCH FOUND", playerId);
            rabbitMQProducer.produceMappingForGameBetweenUsers("mappers.joined", "MATCH FOUND", opponent);

            return gameSession;
        }
    }
            activePlayers.put(opponent, Map.of("opponent", playerId, "sessionId", sessionId));

            rabbitMQProducer.produceMappingForGameBetweenUsers("mappers.joined", "MATCH FOUND", playerId);
            rabbitMQProducer.produceMappingForGameBetweenUsers("mappers.joined", "MATCH FOUND", opponent);

            return gameSession;
        }
    }

    public Map<String,String> getActiveGameForPlayer(String playerId) {
        return activePlayers.get(playerId);
    }

    public void leaveQueue(String playerId) {
        waitingPlayers.remove(playerId);
        rabbitMQProducer.handleNotifications("notifications.left","Game Session Expired: Player:".concat(playerId).concat(" Left the game"),playerId);
        rabbitMQProducer.produceMappingForGameBetweenUsers("mappers.left", "Player: ".concat(playerId).concat(" left the game"),playerId);
    }

    public void removeActivePlayers(String playerId) {
        activePlayers.remove(playerId);
    }

}
