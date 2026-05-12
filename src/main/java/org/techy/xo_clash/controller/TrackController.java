package org.techy.xo_clash.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.techy.xo_clash.dto.PlaysDTO;
import org.techy.xo_clash.service.TrackProgressService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/track")
public class TrackController {

    @Autowired
    private TrackProgressService trackProgressService;

    @PostMapping("/result")
    public ResponseEntity<PlaysDTO> trackProgress(@RequestBody PlaysDTO playsDTO) {
        // Placeholder for tracking logic
        return ResponseEntity.ok(trackProgressService.createProgressTrack(playsDTO));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardData(@RequestParam String playerId) {
        // Placeholder for dashboard data retrieval logic
        return ResponseEntity.ok(Map.of("dashboardData", trackProgressService.getDashboardData(playerId)));
    }

    @GetMapping("/result/{id}")
    public ResponseEntity<PlaysDTO> getProgressTrackById(Long id) {
        // Placeholder for retrieving progress track by ID logic
        return ResponseEntity.ok(trackProgressService.getProgressTrackById(id));
    }
}
