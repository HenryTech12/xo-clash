package org.techy.xo_clash.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlaysDTO {
    @NotBlank
    private String playerId;
    @NotBlank
    private String sessionId;
    @NotBlank
    private String againstPlayerId;

    @JsonProperty("win")
    private boolean win;
    @JsonProperty("draw")
    private boolean draw;
}
