package org.techy.xo_clash.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UsePowerUpsRequest {
    @NotBlank
    private String sessionId;
    @NotBlank
    private String playerId;
    @NotBlank
    private String powerUpType; // "EXTRA_MOVE", "UNDO_MOVE", etc.
    private Integer targetRow;  // (Optional depending on the power up)
    private Integer targetCol;  // (Optional depending on the power up)
}