package org.techy.xo_clash.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.techy.xo_clash.dto.UserDTO;
import org.techy.xo_clash.handlers.InvalidateTokenException;
import org.techy.xo_clash.request.LoginRequest;
import org.techy.xo_clash.service.UserService;
import org.techy.xo_clash.service.security.JwtService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserService userService;


    @PostMapping("/create-account")
    public ResponseEntity<UserDTO> createAccount(@RequestBody @Valid UserDTO userDTO) {
        return new ResponseEntity<>(userService.createUser(userDTO), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public void login(@RequestBody @Valid LoginRequest loginRequest) {
        // This method is intentionally left blank as the actual authentication logic is handled by the AuthFilter
    }

    @GetMapping("/refresh")
    public ResponseEntity<Map<String,Object>> getNewAccessToken(HttpServletRequest servletRequest) {
        String token = extractToken(servletRequest); //refresh token
        String username = jwtService.extractUsername(token);
        if(jwtService.isTokenInvalidated(token) && username.isEmpty()) {
            throw new InvalidateTokenException("Refresh token is invalid");
        }
        return new ResponseEntity<>(Map.of("accessToken", jwtService.generateAccessToken(username), "refreshToken",token), HttpStatus.OK);
    }


    @GetMapping("/validate/token")
    public ResponseEntity<Map<String,Object>> validateToken(HttpServletRequest servletRequest) {
        String token = extractToken(servletRequest); //access token
        String username = jwtService.extractUsername(token);
        if(jwtService.isTokenInvalidated(token) || username.isEmpty()) {
            throw new InvalidateTokenException("Refresh token is invalid");
        }
        return new ResponseEntity<>(Map.of("valid", true), HttpStatus.OK);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(HttpServletRequest request) {
        String token = extractToken(request);
        if(token != null) {
            String username = jwtService.extractUsername(token);
            UserDTO userDTO = userService.getUserByUsername(username);
            return new ResponseEntity<>(userDTO, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
    }

    @GetMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest request) {
        String token = extractToken(request);
        if(token != null) {
            jwtService.invalidateToken(token);

            return new ResponseEntity<>("Logged out successfully", HttpStatus.OK);
        }
        return new ResponseEntity<>("No token provided", HttpStatus.BAD_REQUEST);
    }


    public static String extractToken(HttpServletRequest servletRequest) {
        String header = servletRequest.getHeader("Authorization");
        if(header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
