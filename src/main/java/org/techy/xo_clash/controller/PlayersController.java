package org.techy.xo_clash.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.techy.xo_clash.model.PlayerPowerUps;
import org.techy.xo_clash.service.PowerUpsService;
import org.techy.xo_clash.service.TrackProgressService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/players")
public class PlayersController {

    @Autowired
    private TrackProgressService trackProgressService;

    @Autowired
    private PowerUpsService powerUpsService;

    @GetMapping("/rankings")
    public ResponseEntity<Map<String,Object>> fetchLeaderboards(@RequestParam int limit) {
        return ResponseEntity.ok().body(trackProgressService.fetchLeaderboard(limit));
    }

    @GetMapping("/{username}/stats")
    public ResponseEntity<Map<String,Object>> getPlayerStats(@PathVariable String username) {
        return ResponseEntity.ok().body(trackProgressService.getPlayerStats(username));
    }

    @GetMapping("/{username}/powerups")
    public ResponseEntity<List<PlayerPowerUps>> fetchPlayerPowerUps(@PathVariable String username) {
        return ResponseEntity.ok().body(powerUpsService.fetchPlayerPowerUps(username));
    }

}
