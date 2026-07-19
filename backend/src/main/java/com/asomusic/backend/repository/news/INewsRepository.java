package com.asomusic.backend.repository.news;

import com.asomusic.backend.model.dto.NewsRecord;

import java.util.List;
import java.util.concurrent.ExecutionException;

public interface INewsRepository {

    List<NewsRecord> fetchAllNews()
            throws ExecutionException, InterruptedException;

    /**
     * Conta le news con sequence maggiore del cursore indicato.
     */
    long countNewsAfter(
            long sequence
    ) throws ExecutionException, InterruptedException;

    /**
     * Restituisce l'ultima sequenza generata.
     */
    long getLatestSequence()
            throws ExecutionException, InterruptedException;

    /**
     * Crea una nuova news assegnandole una sequenza atomica.
     *
     * @return sequenza assegnata alla news
     */
    long createNews(
            String message
    ) throws ExecutionException, InterruptedException;
}