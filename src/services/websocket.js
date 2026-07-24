import { Client } from "@stomp/stompjs";

class WebSocketService {
    constructor() {
        this.client = null;
        this.subscriptions = [];
    }

    connect(onConnect, onError) {
        const baseUrl =
            import.meta.env.VITE_API_URL ||
            "https://xo-clash-8ysf.onrender.com";
        const brokerURL = `${baseUrl.replace(/^http/, "ws")}/ws-game/websocket`;
        const token = localStorage.getItem("token");

        this.client = new Client({
            brokerURL,
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            reconnectDelay: 5000,
            debug: (str) => {
                if (import.meta.env.MODE !== "production") {
                    console.log(str);
                }
            },
            onConnect: (frame) => {
                console.log("Connected: " + frame);
                onConnect(frame);
            },
            onStompError: (frame) => {
                console.error(
                    "Broker reported error: " + frame.headers["message"]
                );
                console.error("Additional details: " + frame.body);
                onError(frame);
            },
        });

        this.client.activate();
    }

    subscribe(topic, callback) {
        if (this.client && this.client.connected) {
            const sub = this.client.subscribe(topic, (message) => {
                let parsedBody = message.body;
                try {
                    parsedBody = JSON.parse(message.body);
                } catch (e) {
                    // Let it remain a string
                }
                callback(parsedBody);
            });
            this.subscriptions.push(sub);

            // Return an unsubscribe function
            return () => {
                try {
                    sub.unsubscribe();
                    this.subscriptions = this.subscriptions.filter(
                        (s) => s.id !== sub.id
                    );
                } catch (e) {
                    console.log("Error unsubscribing:", e);
                }
            };
        }

        // Return a dummy function if not connected yet to prevent "is not a function" errors
        return () =>
            console.log(
                `Cannot unsubscribe from ${topic} - was never subscribed`
            );
    }

    send(destination, body) {
        console.log(`[WS SEND] ${destination}`, body);
        if (this.client && this.client.connected) {
            this.client.publish({
                destination,
                body: JSON.stringify(body),
            });
        } else {
            console.warn(
                `[WS SEND FAIL] Client not connected. Status: ${this.client?.state}`
            );
        }
    }

    disconnect() {
        this.unsubscribeAll();
        if (this.client) {
            this.client.deactivate();
        }
    }

    unsubscribeAll() {
        this.subscriptions.forEach((sub) => {
            try {
                sub.unsubscribe();
            } catch (e) {
                // Ignore if already unsubscribed
            }
        });
        this.subscriptions = [];
    }
}

const webSocketService = new WebSocketService();
export default webSocketService;
