package org.techy.xo_clash.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
public class PlayerPowerUps {

    @Id
    private String powerupId;
    private String powerupName;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String playerName;
    private int count;
    private LocalDateTime lastUsed;
    private int totalUsed;

}
