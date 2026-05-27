package org.techy.xo_clash.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.techy.xo_clash.model.Leaderboard;

import java.util.*;

@Repository
public interface LeaderboardRepository extends JpaRepository<Leaderboard,Long> {

    Optional<Leaderboard> findByUsername(String username);

    List<Leaderboard> findTop10ByOrderByRankPointsDesc();
}
