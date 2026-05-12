package org.techy.xo_clash.service.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.techy.xo_clash.dto.UserRole;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.function.Function;

@Service
public class JwtService {

    private String secretKey;
    private long accessTokenExpiryInMinutes = 15;
    private long refreshTokenExpiryInDays = 7;
    Set<String> invalidatedTokens = Collections.synchronizedSet(new HashSet<>());

    public JwtService() {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance("HmacSHA256");
            SecretKey key = keyGenerator.generateKey();
            secretKey = Base64.getEncoder().encodeToString(key.getEncoded());
        } catch (RuntimeException e) {
            throw new RuntimeException(e);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }


    public SecretKey getKey() {
        return Keys.hmacShaKeyFor(Base64.getDecoder().decode(secretKey));
    }


    public Map<String,Object> generateAccessToken(String subject) {
        return Map.of("accessToken", generateToken(subject, accessTokenExpiryInMinutes * 60 * 1000));
    }

    public Map<String,Object> generateRefreshToken(String subject) {
        return Map.of("refreshToken", generateToken(subject, refreshTokenExpiryInDays * 24 * 60 * 60 * 1000));
    }

    public String generateToken(String subject, long expiry) {
        Map<String,Object> claims = new HashMap<>();
        claims.put("roles", List.of(UserRole.USER.name()));

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiry))
                .signWith(getKey())
                .compact();
    }

    public <T>T extractAllClaims(String token, Function<Claims,T> claimsResolver) {
        Claims claims = extractClaims(token);
        return claimsResolver.apply(claims);
    }

    public String extractUsername(String token) {
        return extractAllClaims(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractAllClaims(token, Claims::getExpiration);
    }

    public Claims extractClaims(String token) {
        return Jwts.parser().verifyWith(getKey())
                .build().parseSignedClaims(token).getPayload();
    }

    public void invalidateToken(String token) {
        invalidatedTokens.add(token);
    }

    public boolean isTokenInvalidated(String token) {
        return invalidatedTokens.contains(token);
    }

    public boolean verifyExpiration(String token) {
        try {
            return extractUsername(token) != null && !extractExpiration(token).before(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    public List<String> extractRoles(String token) {
        Claims claims = extractClaims(token);
        // Ensure you handle potential nulls or different types
        Object roles = claims.get("roles");
        if (roles instanceof List) {
            return (List<String>) roles;
        }
        return Collections.emptyList();
    }
}
