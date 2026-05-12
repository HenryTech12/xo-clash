package org.techy.xo_clash.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.techy.xo_clash.model.User;

import java.time.LocalDateTime;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
   Optional<User> findByUsername(String username);
   void deleteByUsername(String username);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.lastActive = :lastActive WHERE u.username = :username")
    void updateLastActiveByUsername(@Param("username") String username, @Param("lastActive") LocalDateTime now);
}
