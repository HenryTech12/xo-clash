package org.techy.xo_clash.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GameMoveRequest {
    @NotBlank
    private String sessionId;
    
    @Min(0) @Max(2)
    private int row;
    
    @Min(0) @Max(2)
    private int col;
    
    @NotBlank
    private String player;
}
