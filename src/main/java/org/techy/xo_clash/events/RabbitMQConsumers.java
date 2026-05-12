package org.techy.xo_clash.events;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.techy.xo_clash.response.GameStateResponse;

@Service
public class RabbitMQConsumers {

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    @RabbitListener(queues = "#{mappingQueue.name}")
    public void consumeMatchMakingMessage(String message) {
        String sessionId = message.split(":")[0];
        String dataMessage = message.split(":")[1];
        System.out.println("Consuming matchmaking message: " + dataMessage);
        simpMessagingTemplate.convertAndSend("/topic/matchmaking/".concat(sessionId), dataMessage);
    }

    @RabbitListener(queues = "#{notificationQueue.name}")
    public void consumeNotificationMessage(String message) {
        String sessionId = message.split(":")[0];
        String dataMessage = message.split(":")[1];
        simpMessagingTemplate.convertAndSend("/topic/notifications/".concat(sessionId), dataMessage);
    }

    @RabbitListener(queues = "#{powerUpQueue.name}")
    public void consumeGameStateMessage(String message) {
        String playerId = message.split(":")[0];
        String dataMessage = message.split(":")[1];
        String powerUpType = message.split(":")[2];
        simpMessagingTemplate.convertAndSend("/topic/powerups/".concat(playerId)+"/activate", dataMessage+" "+powerUpType);
    }


}
