package com.asomusic.backend.security;

import jakarta.enterprise.context.RequestScoped;

import java.util.Objects;

@RequestScoped
public class CurrentUserService implements ICurrentUserService {

    private AuthenticatedUser authenticatedUser;

    /**
     * Inizializzato dal filtro di autenticazione.
     *
     * Il metodo non fa parte dell'interfaccia pubblica
     * ICurrentUserService, quindi i service applicativi
     * possono soltanto leggere l'identità corrente.
     */
    public void initialize(
            AuthenticatedUser authenticatedUser
    ) {
        Objects.requireNonNull(
                authenticatedUser,
                "Authenticated user cannot be null"
        );

        if (this.authenticatedUser != null) {
            throw new IllegalStateException(
                    "Authenticated user context "
                            + "has already been initialized"
            );
        }

        this.authenticatedUser = authenticatedUser;
    }

    @Override
    public AuthenticatedUser getCurrentUser() {
        if (authenticatedUser == null) {
            throw new IllegalStateException(
                    "No authenticated user is available "
                            + "for the current request"
            );
        }

        return authenticatedUser;
    }

    @Override
    public String getCurrentUserId() {
        return getCurrentUser().uid();
    }

    @Override
    public boolean isAuthenticated() {
        return authenticatedUser != null;
    }
}