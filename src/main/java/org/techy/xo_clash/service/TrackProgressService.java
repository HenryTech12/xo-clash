package org.techy.xo_clash.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.techy.xo_clash.dto.PlaysDTO;
import org.techy.xo_clash.dto.UserDTO;
import org.techy.xo_clash.events.PlayerRank;
import org.techy.xo_clash.events.PowerUp;
import org.techy.xo_clash.handler.UserNotFoundException;
import org.techy.xo_clash.mapper.PlaysMapper;
import org.techy.xo_clash.model.Leaderboard;
import org.techy.xo_clash.model.Plays;
import org.techy.xo_clash.model.User;
import org.techy.xo_clash.repository.LeaderboardRepository;
import org.techy.xo_clash.repository.PlayerPowerupRepository;
import org.techy.xo_clash.repository.PlaysRepository;
import org.techy.xo_clash.repository.UserRepository;
import org.techy.xo_clash.request.PlayerStatsCount;
import org.techy.xo_clash.response.DashboardResponse;

import java.time.Instant;
import java.util.*;

@Service
public class TrackProgressService {

    @Autowired
    private PlaysRepository playsRepository;
    @Autowired
    private PlaysMapper playsMapper;
    @Autowired
    private UserService userService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private LeaderboardRepository leaderboardRepository;
    @Autowired
    private ProgressionService progressionService;

    @Autowired
    private PlayerPowerupRepository playerPowerupRepository;


    @Cacheable(value = "dashboards", key = "#playerId")
    public DashboardResponse getDashboardData(String playerId) {
        // 1. Single DB hit for all counts
        PlayerStatsCount counts = playsRepository.getCountsForPlayer(playerId);
        userService.updateLastActive(playerId);

        // 2. Calculate rank once
        int rankPoints = progressionService.calculateRankPoint((int) counts.wins(), (int) counts.losses());
        PlayerRank rank = PlayerRank.getRankByWins(rankPoints);

        // 3. Return response
        return new DashboardResponse(
                counts.wins(),
                counts.losses(),
                counts.draws(),
                calculateWinRate(counts),
                rank.name(),
                getPowerUps(playerId) // Helper method
        );
    }

    @Cacheable(value = "counts", key = "#playerId")
    public PlayerStatsCount getPlayersCountDetails(String playerId) {
        return playsRepository.getCountsForPlayer(playerId);
    }

    private float calculateWinRate(PlayerStatsCount counts) {
        return counts.totalGames() > 0 ? ((float) counts.wins() / counts.totalGames()) * 100 : 0;
    }

    @CachePut(value = "plays", key = "#result.playerId")
    public PlaysDTO createProgressTrack(PlaysDTO playsDTO) {
        Plays plays = playsMapper.convertToEntity(playsDTO);
        Plays savedPlays = playsRepository.save(plays);
        return playsMapper.convertToDTO(savedPlays);
    }


    @CachePut(value = "plays", key = "#id")
    public PlaysDTO getProgressTrackById(Long id) {
        Plays plays = playsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Plays not found with id: " + id));
        return playsMapper.convertToDTO(plays);
    }

    @CachePut(value = "powerups", key = "#playerId")
    public List<String> getPowerUps(String playerId) {
        PlayerStatsCount statsCount = getPlayersCountDetails(playerId);
        if(Objects.equals(PlayerRank.BRONZE, PlayerRank.getRankByWins(progressionService.calculateRankPoint((int) statsCount.wins(), (int) statsCount.losses())))) {
            return List.of(PowerUp.HINT.name());
        }
        if(Objects.equals(PlayerRank.SILVER, PlayerRank.getRankByWins(progressionService.calculateRankPoint((int) statsCount.wins(), (int) statsCount.losses())))) {
            return List.of(PowerUp.HINT.name());
        }
        if(Objects.equals(PlayerRank.GOLD, PlayerRank.getRankByWins(progressionService.calculateRankPoint((int) statsCount.wins(), (int) statsCount.losses())))) {
            return List.of(PowerUp.HINT.name(), PowerUp.EXTRA_MOVE.name());
        }
        if(Objects.equals(PlayerRank.PLATINUM, PlayerRank.getRankByWins(progressionService.calculateRankPoint((int) statsCount.wins(), (int) statsCount.losses())))) {
            return List.of(PowerUp.HINT.name(), PowerUp.EXTRA_MOVE.name(), PowerUp.BLOCK_CELL.name());
        }
        if(Objects.equals(PlayerRank.DIAMOND, PlayerRank.getRankByWins(progressionService.calculateRankPoint((int) statsCount.wins(), (int) statsCount.losses())))) {
            return List.of(PowerUp.HINT.name(), PowerUp.EXTRA_MOVE.name(), PowerUp.BLOCK_CELL.name(), PowerUp.UNDO_MOVE.name());
        }
        if(Objects.equals(PlayerRank.MASTER, PlayerRank.getRankByWins(progressionService.calculateRankPoint((int) statsCount.wins(), (int) statsCount.losses())))) {
            return List.of(PowerUp.HINT.name(), PowerUp.EXTRA_MOVE.name(), PowerUp.BLOCK_CELL.name(), PowerUp.UNDO_MOVE.name(), PowerUp.SWAP_CELL.name());
        }
        if(Objects.equals(PlayerRank.GRANDMASTER, PlayerRank.getRankByWins(progressionService.calculateRankPoint((int) statsCount.wins(), (int) statsCount.losses())))) {
            return List.of(PowerUp.HINT.name(), PowerUp.EXTRA_MOVE.name(), PowerUp.BLOCK_CELL.name(), PowerUp.UNDO_MOVE.name(), PowerUp.SWAP_CELL.name(), PowerUp.GHOST_MOVE.name());
        }
        return new ArrayList<>();
    }

    public Map<String, Object> getPlayerStats(String playerUsername) {

        PlayerStatsCount playerStatsCount = getPlayersCountDetails(playerUsername);

        System.out.println("Total wins: "+playerStatsCount.wins());
        UserDTO user = userService.getUserByUsername(playerUsername);
        PlayerRank playerRank = PlayerRank.getRankByWins(progressionService.calculateRankPoint((int) playerStatsCount.wins(), (int) playerStatsCount.losses()));
        int totalPowerUpsUsed = playerPowerupRepository.sumTotalUsedByPlayerName(playerUsername).orElse(0);

        // Use a HashMap instead of Map.of() to allow null values
        Map<String, Object> stats = new HashMap<>();
        stats.put("username", playerUsername);
        stats.put("totalWins", playerStatsCount.wins());
        stats.put("totalLosses", playerStatsCount.losses());
        stats.put("totalDraws", playerStatsCount.draws());
        stats.put("rank", playerRank != null ? playerRank.name() : "UNRANKED");
        stats.put("rankPoints", progressionService.calculateRankPoint((int) playerStatsCount.wins(), (int) playerStatsCount.losses()));
        stats.put("experience", progressionService.calculateMatchXP((int) playerStatsCount.wins(), totalPowerUpsUsed));
        stats.put("lastActive", user.getLastActive()); // Now safe even if null
        stats.put("joinedDate", user.getJoined());     // Now safe even if null

        return stats;
    }

    // Helper to avoid repeating logic and bugs
    private PlayerRank getRank(PlayerStatsCount stats) {
        int points = progressionService.calculateRankPoint((int) stats.wins(), (int) stats.losses());
        return PlayerRank.getRankByWins(points);
    }

    public void createAndUpdateLeaderboard(String playerUsername) {
        Leaderboard dbLeaderboard = leaderboardRepository.findByUsername(playerUsername)
                .orElse(new Leaderboard());

        PlayerStatsCount stats = getPlayersCountDetails(playerUsername);
        PlayerRank rank = getRank(stats); // Use the helper!

        dbLeaderboard.setWinRate(calculateWinRate(stats));
        dbLeaderboard.setWins((int) stats.wins());
        dbLeaderboard.setLosses((int) stats.losses());
        dbLeaderboard.setDraws((int) stats.draws());
        dbLeaderboard.setUsername(playerUsername);

        if(dbLeaderboard.getJoinedDate() == null) {
            dbLeaderboard.setJoinedDate(Instant.now());
        }

        dbLeaderboard.setRank(rank.name());
        dbLeaderboard.setRankPoints(progressionService.calculateRankPoint((int) stats.wins(), (int) stats.losses()));
        dbLeaderboard.setBadge(PlayerRank.getBadgeIcon(rank)); // Fixed bug here

        leaderboardRepository.save(dbLeaderboard);
    }

    @Transactional
    @CacheEvict(value = {"counts", "dashboards"}, key = "#playerUsername")
    public void handleWins(String playerUsername ,PlaysDTO playsDTO) {
        createProgressTrack(playsDTO);
        createAndUpdateLeaderboard(playerUsername);
    }

    public Map<String,Object> fetchLeaderboard(int limit) {
        Map<String,Object> response = new HashMap<>();
        List<Leaderboard> leaderboards = leaderboardRepository.findAll()
                .stream().limit(limit).toList();
        response.put("rankings", leaderboards);
        response.put("totalPlayers",leaderboards.size());
        response.put("generatedAt", Instant.now());
        return response;
    }
}
