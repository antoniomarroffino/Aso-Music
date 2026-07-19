package com.asomusic.backend.migration;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.SetOptions;
import com.google.cloud.firestore.WriteBatch;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

public final class NewsSequenceMigration {

    private static final String NEWS_COLLECTION =
            "news";

    private static final String METADATA_COLLECTION =
            "metadata";

    private static final String NEWS_COUNTER_DOCUMENT =
            "newsCounter";

    private static final String FIELD_CREATED_AT =
            "createdAt";

    private static final String FIELD_SEQUENCE =
            "sequence";

    private static final String FIELD_LAST_SEQUENCE =
            "lastSequence";

    private static final String FIELD_UPDATED_AT =
            "updatedAt";

    /*
     * Firestore consente fino a 500 scritture
     * per WriteBatch. Usiamo 400 per mantenere
     * un margine di sicurezza.
     */
    private static final int WRITE_BATCH_SIZE =
            400;

    private static final String APPLY_ARGUMENT =
            "--apply";

    private NewsSequenceMigration() {
    }

    public static void main(
            String[] args
    ) {
        boolean applyChanges =
                Arrays.asList(args)
                        .contains(APPLY_ARGUMENT);

        FirebaseApp firebaseApp =
                null;

        Firestore firestore =
                null;

        int exitCode =
                0;

        try {
            /*
             * Usa Application Default Credentials.
             *
             * In locale è sufficiente impostare:
             *
             * GOOGLE_APPLICATION_CREDENTIALS
             */
            firebaseApp =
                    FirebaseApp.initializeApp();

            firestore =
                    FirestoreClient.getFirestore(
                            firebaseApp
                    );

            migrate(
                    firestore,
                    applyChanges
            );

        } catch (Exception exception) {
            exitCode = 1;

            System.err.println(
                    "Migrazione news fallita:"
            );

            exception.printStackTrace();

        } finally {
            closeFirestore(firestore);
            deleteFirebaseApp(firebaseApp);
        }

        if (exitCode != 0) {
            System.exit(exitCode);
        }
    }

    private static void migrate(
            Firestore firestore,
            boolean applyChanges
    ) throws Exception {

        System.out.println();
        System.out.println(
                "Recupero delle news da Firestore..."
        );

        QuerySnapshot snapshot =
                firestore
                        .collection(
                                NEWS_COLLECTION
                        )
                        .select(
                                FIELD_CREATED_AT
                        )
                        .get()
                        .get();

        List<QueryDocumentSnapshot> documents =
                snapshot.getDocuments();

        if (documents.isEmpty()) {
            System.out.println(
                    "Nessuna news trovata."
            );

            if (applyChanges) {
                updateCounter(
                        firestore,
                        0L
                );

                System.out.println(
                        "Contatore news impostato a 0."
                );
            }

            return;
        }

        List<NewsMigrationItem> news =
                mapAndValidateNews(
                        documents
                );

        news.sort(
                Comparator
                        .comparing(
                                NewsMigrationItem::createdAt
                        )
                        .thenComparing(
                                NewsMigrationItem::documentId
                        )
        );

        printMigrationPlan(
                news,
                applyChanges
        );

        if (!applyChanges) {
            System.out.println();
            System.out.println(
                    "DRY RUN completato: "
                            + "nessun documento è stato modificato."
            );

            System.out.println(
                    "Esegui nuovamente lo script con --apply "
                            + "per applicare la migrazione."
            );

            return;
        }

        applySequences(
                firestore,
                news
        );

        long lastSequence =
                news.size();

        updateCounter(
                firestore,
                lastSequence
        );

        System.out.println();
        System.out.println(
                "Migrazione completata."
        );

        System.out.printf(
                "News aggiornate: %d%n",
                news.size()
        );

        System.out.printf(
                "%s/%s.%s = %d%n",
                METADATA_COLLECTION,
                NEWS_COUNTER_DOCUMENT,
                FIELD_LAST_SEQUENCE,
                lastSequence
        );
    }

    private static List<NewsMigrationItem> mapAndValidateNews(
            List<QueryDocumentSnapshot> documents
    ) {
        List<NewsMigrationItem> result =
                new ArrayList<>(
                        documents.size()
                );

        List<String> validationErrors =
                new ArrayList<>();

        for (
                QueryDocumentSnapshot document :
                documents
        ) {
            Object rawCreatedAt =
                    document.get(
                            FIELD_CREATED_AT
                    );

            if (
                    !(rawCreatedAt
                            instanceof String createdAtString)
            ) {
                validationErrors.add(
                        "News "
                                + document.getId()
                                + ": createdAt non è una stringa"
                );

                continue;
            }

            try {
                Instant createdAt =
                        parseCreatedAt(
                                createdAtString,
                                document.getId()
                        );

                result.add(
                        new NewsMigrationItem(
                                document.getId(),
                                document.getReference(),
                                createdAt,
                                createdAtString
                        )
                );

            } catch (IllegalArgumentException exception) {
                validationErrors.add(
                        exception.getMessage()
                );
            }
        }

        if (!validationErrors.isEmpty()) {
            String message =
                    "Migrazione annullata. "
                            + "Sono state trovate date non valide:\n- "
                            + String.join(
                            "\n- ",
                            validationErrors
                    );

            throw new IllegalStateException(
                    message
            );
        }

        return result;
    }

    private static Instant parseCreatedAt(
            String rawCreatedAt,
            String documentId
    ) {
        String value =
                rawCreatedAt.trim();

        if (value.isEmpty()) {
            throw new IllegalArgumentException(
                    "News "
                            + documentId
                            + ": createdAt è vuoto"
            );
        }

        /*
         * Formato generato da Instant.now().toString():
         *
         * 2026-07-19T10:30:00Z
         */
        try {
            return Instant.parse(value);

        } catch (DateTimeParseException ignored) {
            /*
             * Supporta anche date con offset:
             *
             * 2026-07-19T12:30:00+02:00
             */
            try {
                return OffsetDateTime
                        .parse(value)
                        .toInstant();

            } catch (
                    DateTimeParseException secondException
            ) {
                throw new IllegalArgumentException(
                        "News "
                                + documentId
                                + ": createdAt non valido: "
                                + rawCreatedAt,
                        secondException
                );
            }
        }
    }

    private static void printMigrationPlan(
            List<NewsMigrationItem> news,
            boolean applyChanges
    ) {
        System.out.println();
        System.out.println(
                applyChanges
                        ? "APPLY MODE: le modifiche verranno salvate."
                        : "DRY RUN: nessuna modifica verrà salvata."
        );

        System.out.println();
        System.out.println(
                "Ordine delle sequenze:"
        );

        for (
                int index = 0;
                index < news.size();
                index++
        ) {
            NewsMigrationItem item =
                    news.get(index);

            long sequence =
                    index + 1L;

            System.out.printf(
                    "%4d | %-24s | %s%n",
                    sequence,
                    item.documentId(),
                    item.originalCreatedAt()
            );
        }

        System.out.println();

        System.out.printf(
                "Totale news: %d%n",
                news.size()
        );

        System.out.printf(
                "Sequenza finale: %d%n",
                news.size()
        );
    }

    private static void applySequences(
            Firestore firestore,
            List<NewsMigrationItem> news
    ) throws Exception {

        WriteBatch batch =
                firestore.batch();

        int writesInCurrentBatch =
                0;

        int committedWrites =
                0;

        for (
                int index = 0;
                index < news.size();
                index++
        ) {
            NewsMigrationItem item =
                    news.get(index);

            long sequence =
                    index + 1L;

            batch.update(
                    item.documentReference(),
                    Map.of(
                            FIELD_SEQUENCE,
                            sequence
                    )
            );

            writesInCurrentBatch++;

            if (
                    writesInCurrentBatch
                            >= WRITE_BATCH_SIZE
            ) {
                batch.commit()
                        .get();

                committedWrites +=
                        writesInCurrentBatch;

                System.out.printf(
                        "Salvate %d news...%n",
                        committedWrites
                );

                batch =
                        firestore.batch();

                writesInCurrentBatch =
                        0;
            }
        }

        if (writesInCurrentBatch > 0) {
            batch.commit()
                    .get();

            committedWrites +=
                    writesInCurrentBatch;

            System.out.printf(
                    "Salvate %d news...%n",
                    committedWrites
            );
        }
    }

    private static void updateCounter(
            Firestore firestore,
            long lastSequence
    ) throws Exception {

        Map<String, Object> counterData =
                Map.of(
                        FIELD_LAST_SEQUENCE,
                        lastSequence,
                        FIELD_UPDATED_AT,
                        Timestamp.now()
                );

        firestore
                .collection(
                        METADATA_COLLECTION
                )
                .document(
                        NEWS_COUNTER_DOCUMENT
                )
                .set(
                        counterData,
                        SetOptions.merge()
                )
                .get();
    }

    private static void closeFirestore(
            Firestore firestore
    ) {
        if (firestore == null) {
            return;
        }

        try {
            firestore.close();

        } catch (Exception exception) {
            System.err.println(
                    "Errore durante la chiusura di Firestore:"
            );

            exception.printStackTrace();
        }
    }

    private static void deleteFirebaseApp(
            FirebaseApp firebaseApp
    ) {
        if (firebaseApp == null) {
            return;
        }

        try {
            firebaseApp.delete();

        } catch (Exception exception) {
            System.err.println(
                    "Errore durante la chiusura di Firebase:"
            );

            exception.printStackTrace();
        }
    }

    private record NewsMigrationItem(
            String documentId,
            DocumentReference documentReference,
            Instant createdAt,
            String originalCreatedAt
    ) {
    }
}