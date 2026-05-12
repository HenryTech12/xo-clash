package org.techy.xo_clash.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.techy.xo_clash.handler.JwtException;
import org.techy.xo_clash.model.PowerUpEntity;
import org.techy.xo_clash.service.PowerUpsService;
import org.techy.xo_clash.service.security.JwtService;

import java.util.List;

@RequestMapping("/api/v1/powerups")
@RestController
public class PowerUpsController {

    @Autowired
    private PowerUpsService powerUpsService;
    @Autowired
    private JwtService jwtService;

    @GetMapping("/available")
    public ResponseEntity<List<PowerUpEntity>> fetchAvailablePowerUps() {
        return ResponseEntity.ok().body(powerUpsService.fetchAvailablePowerUps());
    }

    @GetMapping("/init")
    public ResponseEntity<String> initPlayerPowerUp(HttpServletRequest request) {
        String token = extractToken(request);
        if(token == null) {
            throw new JwtException("Invalid Jwt Token");
        }
        String playerUsername = jwtService.extractUsername(token);
        powerUpsService.createPlayerPowerUps(playerUsername);
        return ResponseEntity.ok().body("Power up initiated");
    }

    public static String extractToken(HttpServletRequest servletRequest) {
        String header = servletRequest.getHeader("Authorization");
        if(header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
