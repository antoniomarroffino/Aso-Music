package com.asomusic.backend.exceptions;

public class InvalidAuthenticationTokenException
        extends RuntimeException {

    public InvalidAuthenticationTokenException(
            String message,
            Throwable cause
    ) {
        super(message, cause);
    }
}