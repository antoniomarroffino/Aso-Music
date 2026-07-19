package com.asomusic.backend.security;

public interface ICurrentUserService {

    /**
     * Restituisce l'utente autenticato associato
     * alla richiesta HTTP corrente.
     */
    AuthenticatedUser getCurrentUser();

    /**
     * Restituisce direttamente l'UID Firebase
     * dell'utente corrente.
     */
    String getCurrentUserId();

    /**
     * Indica se il contesto della richiesta contiene
     * un utente autenticato.
     */
    boolean isAuthenticated();
}