package org.techy.xo_clash.handler;

public class JwtException extends RuntimeException {

    public JwtException() {
        super();
    }

    public JwtException(String message) {
        super(message);
    }
}
