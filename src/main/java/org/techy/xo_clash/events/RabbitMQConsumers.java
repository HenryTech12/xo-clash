package org.techy.xo_clash.events;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class RabbitMQConsumers {

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    @RabbitListener(queues = "#{mappingQueue.name}")
    public void consumeMatchMakingMessage(String message) {
        if (message == null || !message.contains(":")) {
            System.err.println("Invalid matchmaking message: " + message);
            return;
        }
        String[] parts = message.split(":", 2);
        String sessionId = parts[0];
        String dataMessage = parts[1];
        System.out.println("Consuming matchmaking message: " + dataMessage);
        simpMessagingTemplate.convertAndSend("/topic/matchmaking/".concat(sessionId), dataMessage);
    }

    @RabbitListener(queues = "#{notificationQueue.name}")
    public void consumeNotificationMessage(String message) {
        if (message == null || !message.contains(":")) {
            System.err.println("Invalid notification message: " + message);
            return;
        }
        String[] parts = message.split(":", 2);
        String sessionId = parts[0];
        String dataMessage = parts[1];
        simpMessagingTemplate.convertAndSend("/topic/notifications/".concat(sessionId), dataMessage);
    }

    @RabbitListener(queues = "#{powerUpQueue.name}")
    public void consumeGameStateMessage(String message) {
        if (message == null) return;
        String[] parts = message.split(":");
        if (parts.length < 3) {
            System.err.println("Invalid power-up message: " + message);
            return;
        }
        String playerId = parts[0];
        String dataMessage = parts[1];
        String powerUpType = parts[2];
        simpMessagingTemplate.convertAndSend("/topic/powerups/".concat(playerId)+"/activate", dataMessage+" "+powerUpType);
    }


}
