package com.asomusic.backend.exceptions;

public class LikeLimitReachedException extends RuntimeException {

    public LikeLimitReachedException(String message) {
        super(message);
    }
}
