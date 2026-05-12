package org.techy.xo_clash.dto;

import lombok.Data;

import java.time.Instant;

@Data
public class LeaderboardDTO {

    private int rank;
    private String username;
    private int wins;
    private int losses;
    private int rankPoints;
    private double winRate;
    private String badge;
    private String avatar;
    private Instant joinedDate;
}
