package com.asomusic.backend.service;

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
public class SongService implements ISongService {

    @Override
    public List<AlbumDTO> fetchAllSongs() {
        Firestore db = FirestoreClient.getFirestore();
        List<AlbumDTO> albums = new ArrayList<>();

        try {
            ApiFuture<QuerySnapshot> albumFuture = db.collection("album").get();
            List<QueryDocumentSnapshot> albumDocs = albumFuture.get().getDocuments();

            for (QueryDocumentSnapshot albumDoc : albumDocs) {
                String albumId = albumDoc.getId();
                System.out.println("📀 Album: " + albumDoc.getString("name") + " (ID: " + albumId + ")");

                List<SongDTO> songDTOs = new ArrayList<>();

                // Sottocollezione songs
                ApiFuture<QuerySnapshot> songsFuture = db.collection("album")
                        .document(albumId)
                        .collection("songs")
                        .get();

                for (QueryDocumentSnapshot songDoc : songsFuture.get().getDocuments()) {
                    try {
                        System.out.println("🎵 Analizzando song ID: " + songDoc.getId());

                        Object posObj = songDoc.get("tracklistPosition");
                        Integer tracklistPosition = null;
                        if (posObj instanceof Number) {
                            tracklistPosition = ((Number) posObj).intValue();
                        } else if (posObj instanceof String) {
                            tracklistPosition = Integer.parseInt((String) posObj);
                        } else {
                            System.err.println("⚠️ tracklistPosition ha tipo sconosciuto: " + posObj);
                        }

                        Object streamObj = songDoc.get("stream");
                        Integer stream = null;
                        if (streamObj instanceof Number) {
                            stream = ((Number) streamObj).intValue();
                        } else if (streamObj instanceof String) {
                            stream = Integer.parseInt((String) streamObj);
                        } else {
                            System.err.println("⚠️ stream ha tipo sconosciuto: " + streamObj);
                        }

                        songDTOs.add(
                                SongDTO.builder()
                                        .id(songDoc.getId())
                                        .title(songDoc.getString("title"))
                                        .duration(songDoc.getString("duration"))
                                        .audioURL(songDoc.getString("audioURL"))
                                        .coverURL(songDoc.getString("coverURL"))
                                        .stream(stream)
                                        .tracklistPosition(tracklistPosition)
                                        .build()
                        );

                    } catch (Exception e) {
                        System.err.println("❌ Errore su song ID: " + songDoc.getId() +
                                " – Titolo: " + songDoc.getString("title"));
                        e.printStackTrace();
                    }
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

        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
        }

        return albums;
    }
}
