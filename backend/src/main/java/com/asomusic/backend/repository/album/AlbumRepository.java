package com.asomusic.backend.repository.album;

import com.asomusic.backend.model.dto.AlbumPreviewDTO;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@ApplicationScoped
public class AlbumRepository implements IAlbumRepository {

    private final Firestore db = FirestoreClient.getFirestore();

    @Override
    public List<AlbumPreviewDTO> fetchAllAlbumsPreview() throws ExecutionException, InterruptedException {
        List<AlbumPreviewDTO> albums = new ArrayList<>();

        ApiFuture<QuerySnapshot> future = db.collection("album").get();
        List<QueryDocumentSnapshot> docs = future.get().getDocuments();

        for (QueryDocumentSnapshot doc : docs) {
            albums.add(mapToPreview(doc));
        }

        return albums;
    }

    // ✅ NEW: recupero singolo album (per tornare quello aggiornato allo sblocco)
    @Override
    public AlbumPreviewDTO fetchAlbumPreviewById(String albumId) throws ExecutionException, InterruptedException {
        DocumentReference ref = db.collection("album").document(albumId);
        DocumentSnapshot snap = ref.get().get();

        if (!snap.exists()) {
            return null;
        }

        return mapToPreview(snap);
    }

    @Override
    public void updateAlbumAvailability(String albumId, boolean available) throws ExecutionException, InterruptedException {
        DocumentReference ref = db.collection("album").document(albumId);

        ApiFuture<WriteResult> write = ref.update(
                "available", available,
                "availableAt", null
        );

        write.get();
    }


    private AlbumPreviewDTO mapToPreview(DocumentSnapshot doc) {
        Boolean available = doc.getBoolean("available");

        Timestamp availableTs = doc.getTimestamp("availableAt");
        Timestamp releaseTs = doc.getTimestamp("releaseYear");

        return AlbumPreviewDTO.builder()
                .id(doc.getId())
                .name(doc.getString("name"))
                .artist(doc.getString("artist"))
                .coverURL(doc.getString("coverURL"))
                .releaseDate(toOffsetDateTime(releaseTs))
                .available(available != null ? available : false)
                .availableAt(availableTs != null ? availableTs.toDate().getTime() : null)

                .build();
    }

    private OffsetDateTime toOffsetDateTime(Timestamp ts) {
        return ts != null
                ? ts.toDate()
                .toInstant()
                .atZone(ZoneId.systemDefault())
                .toOffsetDateTime()
                : null;
    }


}
