package org.techy.xo_clash.model;

import lombok.Data;

import java.util.Map;

@Data
public class GameSession {

    private String sessionId;
    private Map<String,String> players;
    private String currentPlayer;
    private boolean gameOver;
}
