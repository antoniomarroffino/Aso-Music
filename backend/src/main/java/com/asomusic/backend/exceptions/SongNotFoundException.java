package com.asomusic.backend.exceptions;

public class SongNotFoundException extends RuntimeException {

    public SongNotFoundException(String message) {
        super(message);
    }
}
