package com.asomusic.backend.repository.song;

import com.asomusic.backend.model.dto.AlbumDTO;
import com.asomusic.backend.model.dto.SongDTO;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@ApplicationScoped
public class SongRepository implements ISongRepository {

    private final Firestore db = FirestoreClient.getFirestore();

    public List<AlbumDTO> fetchAllAlbumsWithSongs() throws ExecutionException, InterruptedException {
        List<AlbumDTO> albums = new ArrayList<>();

        ApiFuture<QuerySnapshot> albumFuture = db.collection("album").get();
        List<QueryDocumentSnapshot> albumDocs = albumFuture.get().getDocuments();

        for (QueryDocumentSnapshot albumDoc : albumDocs) {
            String albumId = albumDoc.getId();

            // Sottocollezione "songs"
            ApiFuture<QuerySnapshot> songsFuture = db.collection("album")
                    .document(albumId)
                    .collection("songs")
                    .get();

            List<SongDTO> songDTOs = new ArrayList<>();
            for (QueryDocumentSnapshot songDoc : songsFuture.get().getDocuments()) {
                songDTOs.add(SongDTO.builder()
                        .id(songDoc.getId())
                        .title(songDoc.getString("title"))
                        .duration(songDoc.getString("duration"))
                        .audioURL(songDoc.getString("audioURL"))
                        .coverURL(songDoc.getString("coverURL"))
                        .stream(asInt(songDoc.get("stream")))
                        .tracklistPosition(asInt(songDoc.get("tracklistPosition")))
                        .build());
            }

            AlbumDTO albumDTO = AlbumDTO.builder()
                    .id(albumId)
                    .name(albumDoc.getString("name"))
                    .artist(albumDoc.getString("artist"))
                    .description(albumDoc.getString("description"))
                    .coverURL(albumDoc.getString("coverURL"))
                    .releaseYear(albumDoc.getLong("releaseYear") != null
                            ? albumDoc.getLong("releaseYear").intValue() : null)
                    .songs(songDTOs)
                    .build();

            albums.add(albumDTO);
        }

        return albums;
    }

    private Integer asInt(Object obj) {
        if (obj instanceof Number) return ((Number) obj).intValue();
        if (obj instanceof String) return Integer.parseInt((String) obj);
        return null;
    }
}
