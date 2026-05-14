package org.techy.xo_clash.request;

public record PlayerStatsCount(
        Long wins,
        Long losses,
        Long draws,
        Long totalGames
) {}