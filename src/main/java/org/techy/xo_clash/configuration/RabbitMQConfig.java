package org.techy.xo_clash.configuration;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.techy.xo_clash.events.Events;

@Configuration
public class RabbitMQConfig {

    @Bean
    public Queue mappingQueue() {
        return new Queue("queue_mapper", true);
    }
    @Bean
    public Queue notificationQueue() {
        return new Queue("queue_notify", true);
    }

    @Bean
    public Queue powerUpQueue() {return new Queue("queue_powerup", true);}

    @Bean
    public Queue voiceQueue() {return new Queue("queue_voice", true);}


    @Bean
    public TopicExchange topicExchangeMapper() {
        return new TopicExchange("exchange_mapper");
    }

    @Bean
    public TopicExchange topicExchangeNotification() {
        return new TopicExchange("exchange_notify");
    }

    @Bean
    public TopicExchange topicExchangePowerUp() {
        return new TopicExchange("exchange_powerup");
    }

    @Bean
    public TopicExchange topicExchangeVoice() {
        return new TopicExchange("exchange_voice");
    }

    @Bean
    public Binding notificationBinding() {
        return BindingBuilder.bind(notificationQueue())
                .to(topicExchangeNotification())
                .with("notifications.#");
    }

    @Bean
    public Binding mappersBinding() {
        return BindingBuilder.bind(mappingQueue())
                .to(topicExchangeMapper())
                .with("mappers.#");
    }

    @Bean
    public Binding powerUpBinding() {
        return BindingBuilder.bind(powerUpQueue())
                .to(topicExchangePowerUp())
                .with("powerups.#");
    }

    @Bean
    public Binding voiceBinding() {
        return BindingBuilder.bind(voiceQueue())
                .to(topicExchangeVoice())
                .with("voice.#");
    }



}
