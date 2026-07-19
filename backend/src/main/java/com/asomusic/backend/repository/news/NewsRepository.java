package com.asomusic.backend.repository.news;

import com.asomusic.backend.model.dto.NewsRecord;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.AggregateQuerySnapshot;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldMask;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.SetOptions;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@ApplicationScoped
public class NewsRepository implements INewsRepository {

    private static final String NEWS_COLLECTION = "news";
    private static final String METADATA_COLLECTION = "metadata";
    private static final String NEWS_COUNTER_DOCUMENT =
            "newsCounter";

    private static final String FIELD_MESSAGE = "message";
    private static final String FIELD_CREATED_AT = "createdAt";
    private static final String FIELD_SEQUENCE = "sequence";
    private static final String FIELD_LAST_SEQUENCE =
            "lastSequence";
    private static final String FIELD_UPDATED_AT = "updatedAt";

    private static final String[] NEWS_FIELDS = {
            FIELD_MESSAGE,
            FIELD_CREATED_AT,
            FIELD_SEQUENCE
    };

    private static final FieldMask COUNTER_FIELD_MASK =
            FieldMask.of(FIELD_LAST_SEQUENCE);

    private final Firestore db =
            FirestoreClient.getFirestore();

    @Override
    public List<NewsRecord> fetchAllNews()
            throws ExecutionException, InterruptedException {

        /*
         * Non usiamo orderBy("sequence") direttamente perché
         * le news storiche potrebbero non avere ancora il campo.
         *
         * Firestore escluderebbe dalla query i documenti senza
         * il campo usato nell'ordinamento.
         */
        QuerySnapshot snapshot =
                db.collection(NEWS_COLLECTION)
                        .select(NEWS_FIELDS)
                        .get()
                        .get();

        List<QueryDocumentSnapshot> documents =
                snapshot.getDocuments();

        List<NewsRecord> news =
                new ArrayList<>(documents.size());

        for (QueryDocumentSnapshot document : documents) {
            news.add(mapNews(document));
        }

        /*
         * Le nuove news vengono ordinate per sequence.
         * Le news storiche hanno sequence zero e vengono
         * ordinate successivamente per data.
         */
        news.sort(
                Comparator
                        .comparingLong(NewsRecord::sequence)
                        .reversed()
                        .thenComparing(
                                NewsRecord::createdAt,
                                Comparator.nullsLast(
                                        Comparator.reverseOrder()
                                )
                        )
        );

        return news;
    }

    @Override
    public long countNewsAfter(
            long sequence
    ) throws ExecutionException, InterruptedException {

        AggregateQuerySnapshot snapshot =
                db.collection(NEWS_COLLECTION)
                        .whereGreaterThan(
                                FIELD_SEQUENCE,
                                sequence
                        )
                        .count()
                        .get()
                        .get();

        return snapshot.getCount();
    }

    @Override
    public long getLatestSequence()
            throws ExecutionException, InterruptedException {

        DocumentSnapshot snapshot =
                getCounterReference()
                        .get(COUNTER_FIELD_MASK)
                        .get();

        if (!snapshot.exists()) {
            return 0L;
        }

        return readLong(
                snapshot,
                FIELD_LAST_SEQUENCE
        );
    }

    @Override
    public long createNews(
            String message
    ) throws ExecutionException, InterruptedException {

        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException(
                    "News message cannot be empty"
            );
        }

        DocumentReference counterReference =
                getCounterReference();

        DocumentReference newsReference =
                db.collection(NEWS_COLLECTION)
                        .document();

        return db.runTransaction(transaction -> {
                    /*
                     * Tutte le letture devono avvenire prima
                     * delle scritture nella transazione.
                     */
                    DocumentSnapshot counterSnapshot =
                            transaction
                                    .get(counterReference)
                                    .get();

                    long currentSequence =
                            counterSnapshot.exists()
                                    ? readLong(
                                    counterSnapshot,
                                    FIELD_LAST_SEQUENCE
                            )
                                    : 0L;

                    long nextSequence =
                            Math.addExact(
                                    currentSequence,
                                    1L
                            );

                    Timestamp now = Timestamp.now();

                    Map<String, Object> counterData =
                            Map.of(
                                    FIELD_LAST_SEQUENCE,
                                    nextSequence,
                                    FIELD_UPDATED_AT,
                                    now
                            );

                    Map<String, Object> newsData =
                            Map.of(
                                    FIELD_MESSAGE,
                                    message.trim(),
                                    FIELD_CREATED_AT,
                                    now,
                                    FIELD_SEQUENCE,
                                    nextSequence
                            );

                    transaction.set(
                            counterReference,
                            counterData,
                            SetOptions.merge()
                    );

                    transaction.set(
                            newsReference,
                            newsData
                    );

                    return nextSequence;
                })
                .get();
    }

    private DocumentReference getCounterReference() {
        return db.collection(METADATA_COLLECTION)
                .document(NEWS_COUNTER_DOCUMENT);
    }

    private NewsRecord mapNews(
            DocumentSnapshot document
    ) {
        return new NewsRecord(
                document.getId(),
                document.getString(FIELD_MESSAGE),
                readCreatedAt(document),
                readLong(document, FIELD_SEQUENCE)
        );
    }

    /**
     * Supporta sia le nuove news salvate come Timestamp,
     * sia le news storiche salvate come stringa ISO-8601.
     */
    private OffsetDateTime readCreatedAt(
            DocumentSnapshot document
    ) {
        Object rawValue =
                document.get(FIELD_CREATED_AT);

        if (rawValue instanceof Timestamp timestamp) {
            return timestamp
                    .toDate()
                    .toInstant()
                    .atOffset(ZoneOffset.UTC);
        }

        if (rawValue instanceof String stringValue) {
            try {
                return OffsetDateTime.parse(stringValue);
            } catch (DateTimeParseException ignored) {
                try {
                    return Instant.parse(stringValue)
                            .atOffset(ZoneOffset.UTC);
                } catch (DateTimeParseException ignoredAgain) {
                    return null;
                }
            }
        }

        if (rawValue instanceof Number number) {
            return Instant
                    .ofEpochMilli(number.longValue())
                    .atOffset(ZoneOffset.UTC);
        }

        return null;
    }

    private long readLong(
            DocumentSnapshot document,
            String fieldName
    ) {
        Object rawValue =
                document.get(fieldName);

        if (rawValue instanceof Number number) {
            return number.longValue();
        }

        if (rawValue instanceof String stringValue) {
            try {
                return Long.parseLong(stringValue);
            } catch (NumberFormatException ignored) {
                return 0L;
            }
        }

        return 0L;
    }
}