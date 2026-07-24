package org.techy.xo_clash.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.web.bind.annotation.RestController;
import org.techy.xo_clash.dto.PlaysDTO;
import org.techy.xo_clash.request.GameMoveRequest;
import org.techy.xo_clash.request.UsePowerUpsRequest;
import org.techy.xo_clash.request.VoiceMoveRequest;
import org.techy.xo_clash.service.*;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
public class WebSocketController {

    @Autowired
    private TrackProgressService trackProgressService;

    @Autowired
    private GameService gameService;

    @Autowired
    private PowerUpsService powerUpsService;

    @Autowired
    private AiService aiService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/{sessionId}/game.end")
    public void handleGameEnd(@Payload Map<String,Object> payload , @DestinationVariable String sessionId) {
        // Logic to update rank_points, wins, and losses in your database
        System.out.println(payload);
        String playerId = payload.get("playerId").toString();
        String againstPlayerId = payload.get("againstPlayerId").toString();
        boolean win = Boolean.parseBoolean(String.valueOf(payload.get("win")));
        boolean draw = Boolean.parseBoolean(String.valueOf(payload.get("draw")));

        PlaysDTO playsDTO = new PlaysDTO(playerId,sessionId,againstPlayerId,win,draw);
        System.out.println(playsDTO);
        if(!gameService.verifySession(sessionId)) {
            throw new RuntimeException("session does not exist");
        } else {
            trackProgressService.handleWins(playerId,playsDTO);
        }
    }

    @MessageMapping("/game/move")
    public CompletableFuture<ResponseEntity<Map<String,Object>>> handleMove(@Payload GameMoveRequest gameMoveRequest) {
        return CompletableFuture.supplyAsync(() -> ResponseEntity.status(HttpStatus.OK).body(gameService.handleGameMove(gameMoveRequest)));
    }

    @MessageMapping("/game/voice-move")
    @Async
    public void handleVoiceMove(@Payload VoiceMoveRequest request) {
        GameMoveRequest move = aiService.processTextToHandleMove(request);

        //web socket errors path
        if (move == null) {
            // Only send error (since gameService won't)
            messagingTemplate.convertAndSend(
                    "/topic/game/" + request.getSessionId(),
                    Map.of("type", "ERROR", "message", "Invalid voice command")
            );
            return;
        }
        // Let this handle ALL game updates
        gameService.handleGameMove(move);
    }

    @MessageMapping("/game/activate")
    @Async
    public void activatePowerUp(@Payload UsePowerUpsRequest request) {
        Map<String,Object> result = powerUpsService.handlePowerUp(request);
        if (result != null) {
            messagingTemplate.convertAndSend("/topic/actions/".concat(request.getSessionId()), result);
        }
    }
}
