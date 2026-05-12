package org.techy.xo_clash.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    @NotNull
    private String username;
    @Email
    private String email;
    @NotNull
    private String fullName;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @NotNull
    private String password;
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime lastActive;
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime joined;
}
