package org.techy.xo_clash.events;

public enum Events {

    MAPPED_QUEUE_NAME("queue_mapper"),
    MAPPED_EXCHANGE_NAME("exchange_mapper"),
    MAPPED_ROUTING_KEY("mappers.#"),

    NOTIFICATION_QUEUE_NAME("queue_notify"),
    NOTIFICATION_EXCHANGE_NAME("exchange_notify"),
    NOTIFICATION_ROUTING_KEY("notifications.#");

    Events(String data) {

    }
}
