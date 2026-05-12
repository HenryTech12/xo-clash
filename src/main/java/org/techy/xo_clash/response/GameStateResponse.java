package org.techy.xo_clash.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class GameStateResponse {
    private String sessionId;
    private String[][] board; // 3x3 array
    private List<String> players;
    private String currentPlayer;
    private boolean gameOver;
    private String winner;
    private List<Map<String, Object>> possibleMoves;
    private List<String> availablePowerUps;
}