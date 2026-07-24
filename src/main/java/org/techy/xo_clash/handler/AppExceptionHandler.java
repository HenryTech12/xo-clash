package org.techy.xo_clash.handler;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class AppExceptionHandler {

    public ResponseEntity<Map<String, Object>> handleCustomMailException(Exception ex, String error, HttpServletRequest request, HttpStatus status) {
        Map<String, Object> response = new HashMap<>();
        response.put("error", error);
        response.put("path", request.getRequestURI());
        response.put("status", status.value());
        response.put("message", ex.getMessage());
        return new ResponseEntity<>(response, status);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleUserNotFoundException(UserNotFoundException userNotFoundException, HttpServletRequest request) {
        return handleCustomMailException(userNotFoundException, "User details not found", request, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(org.techy.xo_clash.handlers.UsernameExistsException.class)
    public ResponseEntity<Map<String, Object>> handleUsernameExistsException(org.techy.xo_clash.handlers.UsernameExistsException usernameExistsException, HttpServletRequest request) {
        return handleCustomMailException(usernameExistsException, "Username already exists", request, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(io.jsonwebtoken.security.SignatureException.class)
    public ResponseEntity<Map<String, Object>> handleSignatureException(io.jsonwebtoken.security.SignatureException jwtSignatureException, HttpServletRequest request) {
        return handleCustomMailException(jwtSignatureException, "Invalid Jwt token signature", request, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(JwtException.class)
    public ResponseEntity<Map<String, Object>> handleJwtException(JwtException jwtException, HttpServletRequest request) {
        return handleCustomMailException(jwtException, "Invalid JWT TOKEN", request, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex, HttpServletRequest request) {
        return handleCustomMailException(ex, "Internal Server Error", request, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
