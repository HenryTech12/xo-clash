package org.techy.xo_clash.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.techy.xo_clash.handlers.InvalidateTokenException;
import org.techy.xo_clash.model.GameSession;
import org.techy.xo_clash.request.GameMoveRequest;
import org.techy.xo_clash.request.LeaveGameRequest;
import org.techy.xo_clash.request.UsePowerUpsRequest;
import org.techy.xo_clash.service.GameService;
import org.techy.xo_clash.service.MatchMakingService;
import org.techy.xo_clash.service.PowerUpsService;
import org.techy.xo_clash.service.security.JwtService;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;

@Slf4j
@RestController
@RequestMapping("/api/v1/game")
public class GameController {

    @Autowired
    private JwtService jwtService;
    @Autowired
    private MatchMakingService matchMakingService;
    @Autowired
    private GameService gameService;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private SimpMessagingTemplate actionsMessagingTemplate;
    @Autowired
    private PowerUpsService powerUpsService;

    @GetMapping("/join")
    public ResponseEntity<GameSession> joinGame(HttpServletRequest request) {

        String token =  AuthController.extractToken(request);
        if(jwtService.isTokenInvalidated(token) && jwtService.isTokenInvalidated(token)) {
            throw new InvalidateTokenException("Invalid Token...");
        }
        String username = jwtService.extractUsername(token);
        System.out.println("Username extracted from token: " + username);
        return new ResponseEntity<>(matchMakingService.matchPlayers(username), HttpStatus.OK);
    }



    @PostMapping("/end")
    public ResponseEntity<Map<String,Object>> endGame(@RequestBody Map<String,String> payload, HttpServletRequest request) throws JsonProcessingException {
        String sessionId = payload.get("sessionId");
        String token = AuthController.extractToken(request);
        String playerId = jwtService.extractUsername(token);

        Map<String,String> sessionDetails = matchMakingService.getActiveGameForPlayer(playerId);
        String opponent = sessionDetails.get("opponent");
        String sessionIdFromMapping = sessionDetails.get("sessionId");
        List<String> players = List.of(playerId, opponent);

        if(!Objects.equals(sessionId, sessionIdFromMapping)) {
            throw new RuntimeException("Invalid session details provided");
        }
        // Notify the other player that session is being ended
        for (String player : players) {
            matchMakingService.leaveQueue(player);
            actionsMessagingTemplate.convertAndSend("/topic/play-again/".concat(sessionId)+"/"+ player,
                        objectMapper.writeValueAsString(Map.of(
                                "action", "SESSION_ENDED",
                                "message", "Game session has been ended"
                        ))
            );
            matchMakingService.removeActivePlayers(player);
        }
        gameService.endSession(sessionId);
        return new ResponseEntity<>(Map.of("message", "Game Ended"), HttpStatus.OK);
    }

    @PostMapping("/play-again/request")
    public ResponseEntity<Map<String,Object>> requestPlayAgain(@RequestBody Map<String,String> payload) {
        String sessionId = payload.get("sessionId");
        String requesterUsername = payload.get("requesterUsername");
        gameService.requestPlayAgain(sessionId, requesterUsername);
        return new ResponseEntity<>(Map.of("message", "Play Again Request Sent"), HttpStatus.OK);
    }

    @PostMapping("/play-again/reject")
    public ResponseEntity<Map<String,Object>> rejectPlayAgain(@RequestBody Map<String,String> payload) {
        String sessionId = payload.get("sessionId");
        String rejectorUsername = payload.get("rejectorUsername");
        gameService.rejectPlayAgainRequest(sessionId, rejectorUsername);
        return new ResponseEntity<>(Map.of("message", "Play Again Request Rejected"), HttpStatus.OK);
    }

    @PostMapping("/play-again/accept")
    public ResponseEntity<Map<String,Object>> acceptPlayAgain(@RequestBody Map<String,String> payload) {
        String sessionId = payload.get("sessionId");
        String acceptorUsername = payload.get("acceptorUsername");
        return new ResponseEntity<>(gameService.acceptPlayAgainRequest(sessionId, acceptorUsername), HttpStatus.OK);
    }

    @GetMapping("/leave")
    public ResponseEntity<Map<String,Object>> leaveGame(HttpServletRequest request, @RequestBody LeaveGameRequest leaveGameRequest) {
        String token = AuthController.extractToken(request);
        if(jwtService.isTokenInvalidated(token) && jwtService.isTokenInvalidated(token)) {
            throw new InvalidateTokenException("Invalid Token...");
        }
        String username = jwtService.extractUsername(token);
        if(!username.equals(leaveGameRequest.playerId())) {
            throw new RuntimeException("Invalid User details");
        }
        gameService.leaveGame(leaveGameRequest);
        matchMakingService.leaveQueue(username);
        matchMakingService.removeActivePlayers(username);

        log.info("Player with id: {} left the game",leaveGameRequest.playerId());
        return new ResponseEntity<>(Map.of("message", "Player: ".concat(leaveGameRequest.playerId()).concat("left the game")), HttpStatus.OK);
    }


}
