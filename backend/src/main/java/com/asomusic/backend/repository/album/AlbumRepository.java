package com.asomusic.backend.repository.album;

import com.asomusic.backend.model.dto.AlbumPreviewDTO;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.enterprise.context.ApplicationScoped;

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


    // 🔄 Mapper condiviso (evita ripetizione codice)
    private AlbumPreviewDTO mapToPreview(DocumentSnapshot doc) {
        Boolean available = doc.getBoolean("available");
        Timestamp ts = doc.getTimestamp("availableAt");
        return AlbumPreviewDTO.builder()
                .id(doc.getId())
                .name(doc.getString("name"))
                .artist(doc.getString("artist"))
                .coverURL(doc.getString("coverURL"))
                .releaseYear(doc.getLong("releaseYear") != null
                        ? doc.getLong("releaseYear").intValue()
                        : null)
                .available(doc.getBoolean("available") != null
                        ? doc.getBoolean("available")
                        : false)   // default album locked se non presente
                .availableAt(ts != null ? ts.toDate().getTime() : null)
                .build();
    }
}
