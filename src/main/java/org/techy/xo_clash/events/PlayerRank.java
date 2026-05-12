package org.techy.xo_clash.events;

public enum PlayerRank {

    BRONZE(0),
    SILVER(200),
    GOLD(380),
    PLATINUM(450),
    DIAMOND(600),
    MASTER(800),
    GRANDMASTER(1000);

    int rank;
    PlayerRank(int rank) {
        this.rank = rank;

    }

    public static PlayerRank getRankByWins(long rankPoint) {
        for (PlayerRank playerRank : PlayerRank.values()) {
            if (rankPoint >= playerRank.rank) {
                return playerRank;
            }
        }
        return BRONZE; // Default rank if no other rank matches
    }

    public static String getBadgeIcon(PlayerRank tier) {
        return switch (tier) {
            case BRONZE      -> "badge-bronze-shield";
            case SILVER      -> "badge-silver-crest";
            case GOLD        -> "badge-gold-star";
            case PLATINUM    -> "badge-platinum-wings";
            case DIAMOND     -> "badge-diamond-gem";
            case MASTER      -> "badge-master-crown";
            case GRANDMASTER -> "badge-grandmaster-flame";
            default          -> "badge-unknown";
        };
    }
}
