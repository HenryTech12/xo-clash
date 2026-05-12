package org.techy.xo_clash.request;

public record PlayerStatsCount(
        long wins,
        long losses,
        long draws,
        long totalGames
) {}