package org.techy.xo_clash.handlers;

public class UsernameAuthenticationFailed extends RuntimeException {
    public UsernameAuthenticationFailed(String message) {
        super(message);
    }
}
