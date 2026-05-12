package org.techy.xo_clash.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class PowerUpEntity {

    @Id
    private String id;
    private String name;
    private String description;
    private String icon;
    private String type;
    private String rarity;
    private int attackBoost;
    private int defenseBoost;
    private int duration;
    private int cooldown;
    private String potential;
    private String unlockRank;
}