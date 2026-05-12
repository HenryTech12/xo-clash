package org.techy.xo_clash.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlaysDTO {
    private String playerId;
    private String sessionId;
    private String againstPlayerId;

    @JsonProperty("win")
    private boolean win;
    @JsonProperty("draw")
    private boolean draw;
}
