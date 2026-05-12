package org.techy.xo_clash.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.techy.xo_clash.model.PlayerPowerUps;
import org.techy.xo_clash.repository.PlayerPowerupRepository;

import java.util.List;
import java.util.stream.Stream;

@Service
public class ProgressionService {
    // XP Constants
    private static final int XP_PER_MATCH_PLAYED = 50;
    private static final int XP_PER_WIN_BONUS = 30;
    private static final int XP_PER_POWERUP_USED = 10;

    public int calculateMatchXP(int totalWins, int powerupsUsed) {
        int earnedXP = XP_PER_MATCH_PLAYED;
        if(totalWins > 0) {
            earnedXP += XP_PER_WIN_BONUS * totalWins;
        }
        if(powerupsUsed > 0) {
            earnedXP += (powerupsUsed * XP_PER_POWERUP_USED);
        }
        return earnedXP;
    }

    public int calculateRankPoint(int wins, int losses) {
        int winPoints = wins * 25;
        int lossPenalty = losses * 10;

        int totalPoints = winPoints - lossPenalty;

        // Ensure rank points never go below 0
        return Math.max(0, totalPoints);
    }

}
