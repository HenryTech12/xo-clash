package org.techy.xo_clash.request;

import lombok.Data;

@Data
public class UsePowerUpsRequest {
    private String sessionId;
    private String playerId;
    private String powerUpType; // "EXTRA_MOVE", "UNDO_MOVE", etc.
    private Integer targetRow;  // (Optional depending on the power up)
    private Integer targetCol;  // (Optional depending on the power up)
}