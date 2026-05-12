package org.techy.xo_clash.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String username;
    private String email;
    private String fullName;
    private String password;
    private LocalDateTime lastActive;
    private LocalDateTime joined;
    private String role;

    @PrePersist
    public void setDate() {
        lastActive = LocalDateTime.now();
        joined = LocalDateTime.now();
    }
}
