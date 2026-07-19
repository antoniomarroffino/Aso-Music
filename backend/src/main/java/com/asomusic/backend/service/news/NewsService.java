package com.asomusic.backend.service.news;

import com.asomusic.backend.model.dto.*;
import com.asomusic.backend.repository.news.INewsRepository;
import com.asomusic.backend.repository.news.INewsUserStateRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.concurrent.ExecutionException;

@ApplicationScoped
public class NewsService implements INewsService {

    @Inject
    INewsRepository newsRepository;

    @Inject
    INewsUserStateRepository newsUserStateRepository;

    @Override
    public NewsFeedDTO fetchAllNews(
            String userId
    ) {
        validateUserId(userId);

        return executeRepositoryOperation(
                "Errore durante il recupero delle news",
                () -> {
                    long lastSeenSequence =
                            newsUserStateRepository
                                    .getLastSeenSequence(
                                            userId
                                    );

                    List<NewsRecord> records =
                            newsRepository.fetchAllNews();

                    List<NewsDTO> news =
                            records.stream()
                                    .map(
                                            record -> mapNews(
                                                    record,
                                                    lastSeenSequence
                                            )
                                    )
                                    .toList();

                    long unreadCount =
                            records.stream()
                                    .filter(
                                            record ->
                                                    record.sequence()
                                                            > lastSeenSequence
                                    )
                                    .count();

                    long readCursor =
                            records.stream()
                                    .mapToLong(
                                            NewsRecord::sequence
                                    )
                                    .max()
                                    .orElse(0L);

                    return NewsFeedDTO.builder()
                            .news(news)
                            .unreadCount(unreadCount)
                            .readCursor(readCursor)
                            .build();
                }
        );
    }

    @Override
    public UnreadNewsCountDTO fetchUnreadCount(
            String userId
    ) {
        validateUserId(userId);

        return executeRepositoryOperation(
                "Errore durante il recupero "
                        + "del numero di news non lette",
                () -> {
                    long lastSeenSequence =
                            newsUserStateRepository
                                    .getLastSeenSequence(
                                            userId
                                    );

                    long unreadCount =
                            newsRepository.countNewsAfter(
                                    lastSeenSequence
                            );

                    return UnreadNewsCountDTO.builder()
                            .unreadCount(unreadCount)
                            .build();
                }
        );
    }

    @Override
    public UnreadNewsCountDTO markSeen(
            String userId,
            MarkNewsSeenRequestDTO request
    ) {
        validateUserId(userId);

        if (request == null
                || request.getUpToSequence() == null) {
            throw new IllegalArgumentException(
                    "Il cursore di lettura è obbligatorio"
            );
        }

        return executeRepositoryOperation(
                "Errore durante l'aggiornamento "
                        + "delle news visualizzate",
                () -> {
                    long latestSequence =
                            newsRepository.getLatestSequence();

                    /*
                     * Impedisce a un client malevolo di inviare
                     * Long.MAX_VALUE e marcare come viste anche
                     * news che verranno create in futuro.
                     */
                    long safeRequestedSequence =
                            Math.min(
                                    request.getUpToSequence(),
                                    latestSequence
                            );

                    long appliedSequence =
                            newsUserStateRepository
                                    .markSeenUpTo(
                                            userId,
                                            safeRequestedSequence
                                    );

                    /*
                     * Se una nuova news è stata creata tra il GET
                     * della lista e questo aggiornamento, rimane
                     * correttamente non letta.
                     */
                    long unreadCount =
                            newsRepository.countNewsAfter(
                                    appliedSequence
                            );

                    return UnreadNewsCountDTO.builder()
                            .unreadCount(unreadCount)
                            .build();
                }
        );
    }

    @Override
    public long createNews(
            String message
    ) {
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException(
                    "Il messaggio della news è obbligatorio"
            );
        }

        return executeRepositoryOperation(
                "Errore durante la creazione della news",
                () -> newsRepository.createNews(
                        message
                )
        );
    }

    private NewsDTO mapNews(
            NewsRecord record,
            long lastSeenSequence
    ) {
        return NewsDTO.builder()
                .id(record.id())
                .message(record.message())
                .createdAt(record.createdAt())
                .seen(
                        record.sequence()
                                <= lastSeenSequence
                )
                .build();
    }

    private void validateUserId(
            String userId
    ) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException(
                    "User ID cannot be empty"
            );
        }
    }

    private <T> T executeRepositoryOperation(
            String errorMessage,
            RepositorySupplier<T> operation
    ) {
        try {
            return operation.execute();

        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();

            throw new IllegalStateException(
                    errorMessage
                            + ": thread interrotto",
                    exception
            );

        } catch (ExecutionException exception) {
            throw new IllegalStateException(
                    errorMessage,
                    exception
            );
        }
    }

    @FunctionalInterface
    private interface RepositorySupplier<T> {

        T execute()
                throws ExecutionException,
                InterruptedException;
    }
}