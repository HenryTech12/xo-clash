package org.techy.xo_clash.events;

import org.springframework.amqp.rabbit.core.RabbitMessagingTemplate;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.techy.xo_clash.response.GameStateResponse;

@Service
public class RabbitMQProducer {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void produceMappingForGameBetweenUsers(String routingKey, String message,String sessionId) {
        String newMessage = sessionId + ":" + message;
        rabbitTemplate.convertAndSend("exchange_mapper",
                routingKey, newMessage);
    }

    public void handleNotifications(String routingKey, String message, String sessionId) {
        String newMessage = sessionId + ":" + message;
        rabbitTemplate.convertAndSend("exchange_notify",
                routingKey, newMessage);
    }

    public void handlePowerUp(String routingKey, String message, String playerId, String powerUpType) {
        String newMessage = playerId + ":" + message + ":" + powerUpType;
        rabbitTemplate.convertAndSend("exchange_powerup",
                routingKey, newMessage);
    }

}
