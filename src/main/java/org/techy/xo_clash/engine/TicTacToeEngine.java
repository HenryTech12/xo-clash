package org.techy.xo_clash.engine;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class TicTacToeEngine {
    
    // Mapping coordinates to human-friendly "Semantic Aliases" for the AI
    private static final String[][] ALIASES = {
        {"top left", "top middle", "top right"},
        {"center left", "center", "center right"},
        {"bottom left", "bottom middle", "bottom right"}
    };

    public static List<Map<String, Object>> getValidMoves(String[][] board) {
        List<Map<String, Object>> moves = new ArrayList<>();
        
        for (int r = 0; r < 3; r++) {
            for (int c = 0; c < 3; c++) {
                // If the cell is null or empty, it's a valid move
                if (board[r][c] == null || board[r][c].isEmpty()) {
                    Map<String, Object> move = new HashMap<>();
                    move.put("row", r);
                    move.put("col", c);
                    move.put("alias", ALIASES[r][c]);
                    moves.add(move);
                }
            }
        }
        return moves;
    }
}