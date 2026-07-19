package com.asomusic.backend.repository.news;

import java.util.concurrent.ExecutionException;

public interface INewsUserStateRepository {

    /**
     * Restituisce la sequenza dell'ultima news vista.
     *
     * Se lo stato utente non esiste ancora, restituisce zero.
     */
    long getLastSeenSequence(
            String userId
    ) throws ExecutionException, InterruptedException;

    /**
     * Aggiorna il cursore in modo monotono.
     *
     * Il cursore non può mai tornare indietro.
     *
     * @return sequenza effettivamente memorizzata
     */
    long markSeenUpTo(
            String userId,
            long sequence
    ) throws ExecutionException, InterruptedException;
}