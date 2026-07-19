package com.asomusic.backend.repository.news;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldMask;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.SetOptions;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Map;
import java.util.concurrent.ExecutionException;

@ApplicationScoped
public class NewsUserStateRepository
        implements INewsUserStateRepository {

    private static final String USER_NEWS_STATE_COLLECTION =
            "userNewsState";

    private static final String FIELD_LAST_SEEN_SEQUENCE =
            "lastSeenSequence";
    private static final String FIELD_UPDATED_AT =
            "updatedAt";

    private static final FieldMask USER_STATE_FIELD_MASK =
            FieldMask.of(FIELD_LAST_SEEN_SEQUENCE);

    private final Firestore db =
            FirestoreClient.getFirestore();

    @Override
    public long getLastSeenSequence(
            String userId
    ) throws ExecutionException, InterruptedException {

        DocumentSnapshot snapshot =
                getUserStateReference(userId)
                        .get(USER_STATE_FIELD_MASK)
                        .get();

        if (!snapshot.exists()) {
            return 0L;
        }

        return readLong(
                snapshot,
                FIELD_LAST_SEEN_SEQUENCE
        );
    }

    @Override
    public long markSeenUpTo(
            String userId,
            long sequence
    ) throws ExecutionException, InterruptedException {

        if (sequence < 0) {
            throw new IllegalArgumentException(
                    "News sequence cannot be negative"
            );
        }

        DocumentReference stateReference =
                getUserStateReference(userId);

        return db.runTransaction(transaction -> {
                    DocumentSnapshot stateSnapshot =
                            transaction
                                    .get(stateReference)
                                    .get();

                    long currentSequence =
                            stateSnapshot.exists()
                                    ? readLong(
                                    stateSnapshot,
                                    FIELD_LAST_SEEN_SEQUENCE
                            )
                                    : 0L;

                    /*
                     * Una richiesta vecchia o ritardata non può
                     * riportare indietro il cursore dell'utente.
                     */
                    long targetSequence =
                            Math.max(
                                    currentSequence,
                                    sequence
                            );

                    Map<String, Object> stateData =
                            Map.of(
                                    FIELD_LAST_SEEN_SEQUENCE,
                                    targetSequence,
                                    FIELD_UPDATED_AT,
                                    Timestamp.now()
                            );

                    transaction.set(
                            stateReference,
                            stateData,
                            SetOptions.merge()
                    );

                    return targetSequence;
                })
                .get();
    }

    private DocumentReference getUserStateReference(
            String userId
    ) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException(
                    "User ID cannot be empty"
            );
        }

        return db.collection(USER_NEWS_STATE_COLLECTION)
                .document(userId);
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