package org.techy.xo_clash.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.techy.xo_clash.model.PlayerPowerUps;

import java.util.List;
import java.util.Optional;

public interface PlayerPowerupRepository extends JpaRepository<PlayerPowerUps, String> {
    List<PlayerPowerUps> findByPlayerName(String playerName);
    Optional<PlayerPowerUps> findByPlayerNameAndPowerupName(String playerName, String powerupName);

    @Query("SELECT SUM(p.totalUsed) FROM PlayerPowerUps p WHERE p.playerName = :playerName")
    Optional<Integer> sumTotalUsedByPlayerName(@Param("playerName") String playerName);
}
