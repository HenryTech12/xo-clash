package org.techy.xo_clash.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.techy.xo_clash.events.PowerUp;
import org.techy.xo_clash.model.PlayerPowerUps;
import org.techy.xo_clash.repository.PlayerPowerupRepository;
import org.techy.xo_clash.request.UsePowerUpsRequest;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class PowerUpsServiceTest {

    private PowerUpsService powerUpsService;
    private GameService gameService;
    private PlayerPowerupRepository playerPowerupRepository;

    @BeforeEach
    void setUp() {
        powerUpsService = new PowerUpsService();
        gameService = mock(GameService.class);
        playerPowerupRepository = mock(PlayerPowerupRepository.class);

        setField(powerUpsService, "gameService", gameService);
        setField(powerUpsService, "playerPowerupRepository", playerPowerupRepository);

        PlayerPowerUps unlocked = new PlayerPowerUps();
        unlocked.setCount(1);
        when(playerPowerupRepository.findByPlayerNameAndPowerupName(anyString(), anyString()))
                .thenReturn(Optional.of(unlocked));
        when(gameService.verifyMove(anyString(), anyString())).thenReturn(true);
    }

    private static void setField(Object target, String field, Object value) {
        try {
            var f = target.getClass().getDeclaredField(field);
            f.setAccessible(true);
            f.set(target, value);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void handlePowerUp_swapCellWithoutTargetCoordinates_throwsInsteadOfNpe() {
        UsePowerUpsRequest request = new UsePowerUpsRequest();
        request.setSessionId("s1");
        request.setPlayerId("alice");
        request.setPowerUpType(PowerUp.SWAP_CELL.name());
        // targetRow/targetCol intentionally left null

        assertThrows(IllegalArgumentException.class, () -> powerUpsService.handlePowerUp(request));
        verify(gameService, never()).canSwapCell(any(), any(), anyInt(), anyInt(), any());
    }

    @Test
    void handlePowerUp_ghostMoveWithoutTargetCoordinates_throwsInsteadOfNpe() {
        UsePowerUpsRequest request = new UsePowerUpsRequest();
        request.setSessionId("s1");
        request.setPlayerId("alice");
        request.setPowerUpType(PowerUp.GHOST_MOVE.name());

        assertThrows(IllegalArgumentException.class, () -> powerUpsService.handlePowerUp(request));
        verify(gameService, never()).activateGhostMove(any(), anyInt(), anyInt(), any());
    }
}
