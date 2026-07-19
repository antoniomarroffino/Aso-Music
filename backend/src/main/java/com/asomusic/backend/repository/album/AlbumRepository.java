package com.asomusic.backend.repository.album;

import com.asomusic.backend.model.dto.AlbumPreviewDTO;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldMask;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@ApplicationScoped
public class AlbumRepository implements IAlbumRepository {

    private static final String ALBUM_COLLECTION = "album";

    private static final String FIELD_NAME = "name";
    private static final String FIELD_ARTIST = "artist";
    private static final String FIELD_COVER_URL = "coverURL";
    private static final String FIELD_RELEASE_YEAR = "releaseYear";
    private static final String FIELD_AVAILABLE = "available";
    private static final String FIELD_AVAILABLE_AT = "availableAt";

    private static final String[] PREVIEW_FIELDS = {
            FIELD_NAME,
            FIELD_ARTIST,
            FIELD_COVER_URL,
            FIELD_RELEASE_YEAR,
            FIELD_AVAILABLE,
            FIELD_AVAILABLE_AT
    };

    private static final FieldMask PREVIEW_FIELD_MASK =
            FieldMask.of(PREVIEW_FIELDS);

    private final Firestore db = FirestoreClient.getFirestore();

    @Override
    public List<AlbumPreviewDTO> fetchAllAlbumsPreview()
            throws ExecutionException, InterruptedException {

        QuerySnapshot snapshot = db.collection(ALBUM_COLLECTION)
                .select(PREVIEW_FIELDS)
                .get()
                .get();

        List<QueryDocumentSnapshot> documents =
                snapshot.getDocuments();

        List<AlbumPreviewDTO> albums =
                new ArrayList<>(documents.size());

        for (QueryDocumentSnapshot document : documents) {
            albums.add(mapToPreview(document));
        }

        return albums;
    }

    @Override
    public AlbumPreviewDTO fetchAlbumPreviewById(String albumId)
            throws ExecutionException, InterruptedException {

        DocumentReference reference = db.collection(ALBUM_COLLECTION)
                .document(albumId);

        DocumentSnapshot snapshot = reference
                .get(PREVIEW_FIELD_MASK)
                .get();

        if (!snapshot.exists()) {
            return null;
        }

        return mapToPreview(snapshot);
    }

    @Override
    public void updateAlbumAvailability(
            String albumId,
            boolean available
    ) throws ExecutionException, InterruptedException {

        DocumentReference reference = db.collection(ALBUM_COLLECTION)
                .document(albumId);

        ApiFuture<WriteResult> write;

        if (available) {
            /*
             * Lo sblocco manuale rende disponibile immediatamente
             * l'album ed elimina l'eventuale data programmata.
             */
            write = reference.update(
                    FIELD_AVAILABLE,
                    true,
                    FIELD_AVAILABLE_AT,
                    null
            );
        } else {
            /*
             * Rendere l'album non disponibile non elimina
             * automaticamente un'eventuale programmazione esistente.
             */
            write = reference.update(
                    FIELD_AVAILABLE,
                    false
            );
        }

        write.get();
    }

    private AlbumPreviewDTO mapToPreview(DocumentSnapshot document) {
        Boolean available = document.getBoolean(FIELD_AVAILABLE);

        Timestamp availableTimestamp =
                document.getTimestamp(FIELD_AVAILABLE_AT);

        Timestamp releaseTimestamp =
                document.getTimestamp(FIELD_RELEASE_YEAR);

        return AlbumPreviewDTO.builder()
                .id(document.getId())
                .name(document.getString(FIELD_NAME))
                .artist(document.getString(FIELD_ARTIST))
                .coverURL(document.getString(FIELD_COVER_URL))
                .releaseDate(toOffsetDateTime(releaseTimestamp))
                .available(Boolean.TRUE.equals(available))
                .availableAt(toEpochMilliseconds(availableTimestamp))
                .build();
    }

    private OffsetDateTime toOffsetDateTime(Timestamp timestamp) {
        if (timestamp == null) {
            return null;
        }

        return timestamp.toDate()
                .toInstant()
                .atOffset(ZoneOffset.UTC);
    }

    private Long toEpochMilliseconds(Timestamp timestamp) {
        return timestamp != null
                ? timestamp.toDate().getTime()
                : null;
    }
}