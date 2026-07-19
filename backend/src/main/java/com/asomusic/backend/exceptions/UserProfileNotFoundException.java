package com.asomusic.backend.exceptions;

public class UserProfileNotFoundException
        extends RuntimeException {

    public UserProfileNotFoundException(String message) {
        super(message);
    }
}