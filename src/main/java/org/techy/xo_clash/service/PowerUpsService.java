package org.techy.xo_clash.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.techy.xo_clash.events.PowerUp;
import org.techy.xo_clash.events.RabbitMQProducer;
import org.techy.xo_clash.model.PlayerPowerUps;
import org.techy.xo_clash.model.PowerUpEntity;
import org.techy.xo_clash.repository.PlayerPowerupRepository;
import org.techy.xo_clash.repository.PlaysRepository;
import org.techy.xo_clash.repository.PowerUpRepository;
import org.techy.xo_clash.request.UpdatePowerUpRequest;
import org.techy.xo_clash.request.UsePowerUpsRequest;

import java.time.LocalDateTime;
import java.util.*;

import static java.util.Map.entry;


@Service
public class PowerUpsService {

    @Autowired
    private GameService gameService;
    @Autowired
    private TrackProgressService trackProgressService;
    @Autowired
    private RabbitMQProducer rabbitMQProducer;
    @Autowired
    private PowerUpRepository powerUpRepository;
    @Autowired
    private PlaysRepository playsRepository;
    @Autowired
    private PlayerPowerupRepository playerPowerupRepository;

    public Map<String,Object> handlePowerUp(UsePowerUpsRequest usePowerUpsRequest) {
        if(gameService.verifyMove(usePowerUpsRequest.getPlayerId(), usePowerUpsRequest.getPowerUpType())) {
            if (Objects.equals(usePowerUpsRequest.getPowerUpType(), PowerUp.UNDO_MOVE.name()) && verifyActivation(usePowerUpsRequest.getPlayerId(), usePowerUpsRequest.getPowerUpType())) {
                updatePlayerPowerUps(usePowerUpsRequest.getPlayerId(), usePowerUpsRequest.getPowerUpType());
                return gameService.canUndoOpponentMove(usePowerUpsRequest.getSessionId(), usePowerUpsRequest.getPlayerId(), PowerUp.UNDO_MOVE.name());
            }

            if (Objects.equals(usePowerUpsRequest.getPowerUpType(), PowerUp.EXTRA_MOVE.name()) && verifyActivation(usePowerUpsRequest.getPlayerId(), usePowerUpsRequest.getPowerUpType())) {
                updatePlayerPowerUps(usePowerUpsRequest.getPlayerId(), usePowerUpsRequest.getPowerUpType());
                return gameService.canPlayExtraMove(usePowerUpsRequest.getSessionId(), usePowerUpsRequest.getPlayerId(), PowerUp.EXTRA_MOVE.name());
            }

            if (Objects.equals(usePowerUpsRequest.getPowerUpType(), PowerUp.SWAP_CELL.name()) && verifyActivation(usePowerUpsRequest.getPlayerId(), usePowerUpsRequest.getPowerUpType())) {
                return gameService.canSwapCell(usePowerUpsRequest.getSessionId(), usePowerUpsRequest.getPlayerId(), usePowerUpsRequest.getTargetRow(), usePowerUpsRequest.getTargetCol(), PowerUp.SWAP_CELL.name());
            }

            if (Objects.equals(usePowerUpsRequest.getPowerUpType(), PowerUp.GHOST_MOVE.name()) && verifyActivation(usePowerUpsRequest.getPlayerId(), usePowerUpsRequest.getPowerUpType())) {
                updatePlayerPowerUps(usePowerUpsRequest.getPlayerId(), usePowerUpsRequest.getPowerUpType());
                return gameService.activateGhostMove(usePowerUpsRequest.getSessionId(), usePowerUpsRequest.getTargetRow(), usePowerUpsRequest.getTargetRow(), PowerUp.GHOST_MOVE.name()
                );
            }
            if (Objects.equals(usePowerUpsRequest.getPowerUpType(), PowerUp.BLOCK_CELL.name()) && verifyActivation(usePowerUpsRequest.getPlayerId(), usePowerUpsRequest.getPowerUpType())) {
                updatePlayerPowerUps(usePowerUpsRequest.getPlayerId(), usePowerUpsRequest.getPowerUpType());
                return gameService.activateBlockMove(usePowerUpsRequest.getSessionId(), usePowerUpsRequest.getTargetRow(), usePowerUpsRequest.getTargetCol(), PowerUp.BLOCK_CELL.name());
            }
        }
        return null;
    }


    @Cacheable(value = "powerups")
    public List<PowerUpEntity> fetchAvailablePowerUps() {
       return powerUpRepository.findAll();
    }


    public List<PlayerPowerUps> fetchPlayerPowerUps(String username) {
        return playerPowerupRepository.findByPlayerName(username);
    }

    public boolean verifyActivation(String playerUsername, String powerUpName) {
        PlayerPowerUps playerPowerUps = playerPowerupRepository.findByPlayerNameAndPowerupName(playerUsername,powerUpName)
                .orElseThrow(() -> new RuntimeException("Player power up not found"));
        return playerPowerUps.getCount() > 0;
    }


    public void createPlayerPowerUps(String playerUsername) {
        List<String> playerPowerUps = trackProgressService.getPowerUps(playerUsername);
        System.out.println("Player powerups created ".concat(""+playerPowerUps.size()));
        if(playerPowerupRepository.count() != playerPowerUps.size()) {
            System.out.println("Yo Mehn");
            for(String playerPowers : playerPowerUps) {
                PlayerPowerUps powerUps = new PlayerPowerUps();
                powerUps.setPlayerName(playerUsername);
                powerUps.setPowerupId(playerPowers);
                powerUps.setPowerupName(playerPowers);
                powerUps.setCount(1);
                playerPowerupRepository.save(powerUps);
            }
        }
    }

    @Transactional
    public void updatePlayerPowerUps(String playerUsername, String powerUp) {
        //rabbitMQProducer.handleVoiceMode("voice.action",configureGameStateResponse(gameSession,boardState));
        PlayerPowerUps playerPowerUps = playerPowerupRepository.findByPlayerNameAndPowerupName(playerUsername, powerUp)
                .orElseThrow(() -> new RuntimeException("Player power up not found"));

        playerPowerUps.setLastUsed(LocalDateTime.now());

        // Use += 1 or ++prefix to ensure the value actually increases
        playerPowerUps.setTotalUsed(playerPowerUps.getTotalUsed() + 1);

        // Ensure count doesn't go below zero if that's a requirement
        int currentCount = playerPowerUps.getCount();
        if (currentCount > 0) {
            playerPowerUps.setCount(currentCount - 1);
        }

        playerPowerupRepository.save(playerPowerUps);
    }
}
