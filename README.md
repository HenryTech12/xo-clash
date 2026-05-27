# XO-Clash 🎮

XO-Clash is a modernized, real-time Tic-Tac-Toe battleground featuring **Voice Commands**, **AI Integration**, and **Strategic Power-ups**. Built with Spring Boot 3, it's designed for low-latency multiplayer performance.

## ✨ Features

- **Distributed Architecture**: Built following distributed patterns to ensure scalability and high availability.
- **Data Consistency**: Leverages **Redis** to maintain consistent global state across service instances.
- **Asynchronous Processing**: Fully non-blocking event-driven architecture.
- **Real-time Multiplayer**: Uses **WebSockets (STOMP)** for low-latency synchronization between players.
- **Messaging Pipeline**: Utilizes **RabbitMQ** for reliable cross-player message delivery and notification broadcasting.
- **Voice-to-Move**: Input your moves using natural language (e.g., "Put my mark in the center").
- **AI Engine**: Integrated with Spring AI for intelligent move parsing.
- **Power-ups**: Strategic advantages like `UNDO_MOVE`, `SWAP_CELL`, and `BLOCK_CELL`.
- **Leaderboard**: Global player rankings with optimized caching.
- **Security**: Stateless JWT authentication with persistent secrets.

## �️ How the Game Works

The game orchestrates a complex flow between real-time messaging, asynchronous event processing, and AI-driven logic to provide a seamless experience:

1.  **Matchmaking**: When a player joins, the `MatchMakingService` uses a `LinkedBlockingQueue` to pair them with an available opponent. A unique `UUID` session is created and tracked in **Redis**.
2.  **State Management**: Each game move is validated on the server. The `BoardState` is isolated per session within `ConcurrentHashMap` collections to ensure thread safety in high-concurrency environments.
3.  **Real-time synchronization**:
    *   **WebSockets**: All moves, turn switches, and win/draw notifications are pushed instantly to players via the `/topic/actions/{sessionId}` channel.
    *   **RabbitMQ**: Secondary notifications and metadata are distributed through RabbitMQ exchanges to maintain consistency across distributed backend instances.
4.  **Voice Interaction**: Players can send raw text commands. The `AiService` asynchronously processes these using **Spring AI**, extracts the intended coordinates, and injects the move back into the game engine.
5.  **Power-Up Mechanics**: As players rank up, they unlock power-ups. Activating a power-up (e.g., `SWAP_CELL`) triggers an atomic state update that is broadcasted to both players simultaneously.
6.  **Cleanup**: When a player disconnects, a `SessionDisconnectEvent` listener automatically cleans up orphaned game states and notifies the opponent via RabbitMQ.

## �🚀 Tech Stack

- **Backend**: Java 21, Spring Boot 3.4.x, Spring Security, Spring AI.
- **Messaging**: RabbitMQ, WebSockets.
- **Storage**: MySQL (Primary), Redis (Caching).
- **Documentation**: Swagger/OpenAPI.

## 🛠️ Getting Started

### Prerequisites
- JDK 21+
- MySQL & Redis
- RabbitMQ
- OpenAI API Key

### Setup
1. Clone the repository.
2. Copy `.env.example` to `.env`.
3. Fill in your credentials in `.env`.
4. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```

## 📜 API Documentation
Once running, view the interactive Swagger docs at:
`http://localhost:8080/swagger-ui.html`

## � Testing
⚠️ **Note**: Automated test cases for this application have not been written yet. Contributions in this area are highly encouraged!

## �🤝 Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements.

## ⚖️ License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
