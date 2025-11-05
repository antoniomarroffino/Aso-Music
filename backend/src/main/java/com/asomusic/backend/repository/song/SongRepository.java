package com.asomusic.backend.repository.song;

import com.asomusic.backend.model.dto.AlbumDTO;
import com.asomusic.backend.model.dto.ArtistDTO;
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

    @Override
    public List<AlbumDTO> fetchAllAlbumsWithSongs() throws ExecutionException, InterruptedException {
        List<AlbumDTO> albums = new ArrayList<>();

        ApiFuture<QuerySnapshot> albumFuture = db.collection("album").get();
        List<QueryDocumentSnapshot> albumDocs = albumFuture.get().getDocuments();

        for (QueryDocumentSnapshot albumDoc : albumDocs) {
            String albumId = albumDoc.getId();

            ApiFuture<QuerySnapshot> songsFuture = db.collection("album")
                    .document(albumId)
                    .collection("songs")
                    .get();

            List<SongDTO> songDTOs = new ArrayList<>();
            for (QueryDocumentSnapshot songDoc : songsFuture.get().getDocuments()) {
                List<ArtistDTO> artistDTOs = resolveArtists(songDoc);

                SongDTO song = SongDTO.builder()
                        .id(songDoc.getId())
                        .title(songDoc.getString("title"))
                        .duration(songDoc.getString("duration"))
                        .audioURL(songDoc.getString("audioURL"))
                        .coverURL(songDoc.getString("coverURL"))
                        .stream(asInt(songDoc.get("stream")))
                        .tracklistPosition(asInt(songDoc.get("tracklistPosition")))
                        .artists(artistDTOs)
                        .build();

                songDTOs.add(song);
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

    @Override
    public void incrementListenCount(String albumId, String songId) throws ExecutionException, InterruptedException {
        DocumentReference songRef = db
                .collection("album")
                .document(albumId)
                .collection("songs")
                .document(songId);

        DocumentSnapshot snapshot = songRef.get().get();
        if (!snapshot.exists()) {
            throw new IllegalArgumentException("Song not found: " + songId);
        }

        Long currentCount = snapshot.contains("stream") ? snapshot.getLong("stream") : Long.valueOf(0L);
        songRef.update("stream", currentCount + 1);
    }

    private List<ArtistDTO> resolveArtists(QueryDocumentSnapshot songDoc) {
        List<ArtistDTO> artistDTOs = new ArrayList<>();

        Object rawArtists = songDoc.get("artist");
        if (!(rawArtists instanceof List<?> artistList)) {
            System.out.println("⚠️ Nessun campo 'artist' per la canzone " + songDoc.getId());
            return artistDTOs;
        }

        for (Object refObj : artistList) {
            try {
                DocumentSnapshot artistDoc = null;

                if (refObj instanceof DocumentReference ref) {
                    artistDoc = ref.get().get();
                }

                else if (refObj instanceof String artistId && !artistId.isBlank()) {
                    artistDoc = db.collection("artists").document(artistId).get().get();
                }

                if (artistDoc != null && artistDoc.exists()) {
                    ArtistDTO artist = ArtistDTO.builder()
                            .id(artistDoc.getId())
                            .name(artistDoc.getString("name"))
                            .bio(artistDoc.getString("bio"))
                            .profileURL(artistDoc.getString("profileURL"))
                            .build();

                    artistDTOs.add(artist);
                }

            } catch (Exception e) {
                System.err.println("❌ Errore recupero artista per song " + songDoc.getId() + ": " + e.getMessage());
            }
        }

        System.out.println("🎨 SongRepository -> " + songDoc.getString("title") +
                " resolved " + artistDTOs.size() + " artist(s)");

        return artistDTOs;
    }

    private Integer asInt(Object obj) {
        if (obj instanceof Number) return ((Number) obj).intValue();
        if (obj instanceof String) return Integer.parseInt((String) obj);
        return null;
    }
}
