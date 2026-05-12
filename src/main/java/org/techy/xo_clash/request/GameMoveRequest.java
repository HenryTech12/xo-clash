package org.techy.xo_clash.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GameMoveRequest {
    private String sessionId;
    private int row;
    private int col;
    private String player;
}
