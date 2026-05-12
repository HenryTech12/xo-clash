package org.techy.xo_clash.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.web.filter.OncePerRequestFilter;
import org.techy.xo_clash.configuration.MyUserDetailsService;
import org.techy.xo_clash.handlers.InvalidateTokenException;
import org.techy.xo_clash.service.security.JwtService;

import java.io.IOException;
import java.util.List;

@Component
@Slf4j
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;
    @Autowired
    private MyUserDetailsService myUserDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException { // Removed duplicate IOException

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            if (jwtService.isTokenInvalidated(token)) {
                log.warn("Invalidated token used for request to {}: {}", request.getServletPath(), token);
                throw new InvalidateTokenException("Token is blacklisted");
            }

            try {
                String username = jwtService.extractUsername(token);

                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    // Check if token is valid (this should handle expiration check internally)
                    if (jwtService.verifyExpiration(token)) {
                        // 1. Extract raw roles from JWT (e.g., ["ADMIN", "CONTRIBUTOR"])
                        List<String> roles = jwtService.extractRoles(token);

                        // 2. Convert List<String> to List<SimpleGrantedAuthority> with ROLE_ prefix
                        List<SimpleGrantedAuthority> authorities = roles.stream()
                                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                                .toList();

                        // 3. Create the Authentication Token using the authorities
                        UsernamePasswordAuthenticationToken authToken =
                                new UsernamePasswordAuthenticationToken(
                                        username, // Principal
                                        null,  // Credentials
                                        authorities // Authorities (Critical for @PreAuthorize)
                                );

                        log.info("Authenticated user {} with authorities: {}", username, authorities);

                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                        // 4. Set the SecurityContext
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            } catch (Exception e) {
                log.error("JWT validation failed: {}", e.getMessage());
            }
        }
        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getServletPath();
        return path.startsWith("/api/v1/auth");
    }
}

