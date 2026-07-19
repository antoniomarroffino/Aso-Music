package com.asomusic.backend.security;

public record AuthenticatedUser(
        String uid,
        String email,
        boolean emailVerified
) {

    public AuthenticatedUser {
        if (uid == null || uid.isBlank()) {
            throw new IllegalArgumentException(
                    "Authenticated user UID cannot be empty"
            );
        }
    }
}