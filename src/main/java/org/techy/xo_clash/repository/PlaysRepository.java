package org.techy.xo_clash.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.techy.xo_clash.model.Plays;
import org.techy.xo_clash.request.PlayerStatsCount;

import java.util.Optional;

@Repository
public interface PlaysRepository extends JpaRepository<Plays,Long> {
    @Query("SELECT new org.techy.xo_clash.request.PlayerStatsCount(" +
            "SUM(CASE WHEN p.win = true THEN 1L ELSE 0L END), " +
            "SUM(CASE WHEN p.win = false AND p.draw = false THEN 1L ELSE 0L END), " +
            "SUM(CASE WHEN p.draw = true THEN 1L ELSE 0L END), " +
            "COUNT(p)) " +
            "FROM Plays p WHERE p.playerId = :playerId")
    PlayerStatsCount getCountsForPlayer(String playerId);
}
