package org.techy.xo_clash.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.techy.xo_clash.model.PowerUpEntity;

import java.util.List;

public interface PowerUpRepository extends JpaRepository<PowerUpEntity, String> {

}
