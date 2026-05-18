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
        PlayerRank[] ranks = PlayerRank.values();
        // Loop backward from GRANDMASTER (length - 1) down to BRONZE (0)
        for (int i = ranks.length - 1; i >= 0; i--) {
            if (rankPoint >= ranks[i].rank) {
                return ranks[i];
            }
        }
        return BRONZE;
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
