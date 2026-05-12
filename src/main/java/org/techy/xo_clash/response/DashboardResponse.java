package org.techy.xo_clash.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@Builder
@NoArgsConstructor
@Data
public class DashboardResponse {

    private long numOfWins;
    private long numOfLosses;
    private long numOfDraws;
    private float winRate;
    private String rank;
    private List<String> powerUps;
}
