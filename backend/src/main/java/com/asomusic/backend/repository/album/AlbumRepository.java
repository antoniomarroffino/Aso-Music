package com.asomusic.backend.repository.album;

import com.asomusic.backend.model.dto.AlbumPreviewDTO;
import com.google.api.core.ApiFuture;
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
            AlbumPreviewDTO album = AlbumPreviewDTO.builder()
                    .id(doc.getId())
                    .name(doc.getString("name"))
                    .artist(doc.getString("artist"))
                    .coverURL(doc.getString("coverURL"))
                    .releaseYear(doc.getLong("releaseYear") != null
                            ? doc.getLong("releaseYear").intValue() : null)
                    .build();

            albums.add(album);
        }

        return albums;
    }
}
