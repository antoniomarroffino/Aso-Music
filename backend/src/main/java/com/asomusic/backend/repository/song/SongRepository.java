package com.asomusic.backend.repository.song;

import com.asomusic.backend.model.dto.AlbumDTO;
import com.asomusic.backend.model.dto.ArtistDTO;
import com.asomusic.backend.model.dto.SongDTO;
import com.asomusic.backend.util.SongUtils;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
            String albumName = albumDoc.getString("name");

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
                        .stream(SongUtils.asInt(songDoc.get("stream")))
                        .tracklistPosition(SongUtils.asInt(songDoc.get("tracklistPosition")))
                        .artists(artistDTOs)
                        .albumId(albumId)
                        .albumName(albumName)
                        .build();

                songDTOs.add(song);
            }

            Timestamp releaseTs = albumDoc.getTimestamp("releaseYear");

            AlbumDTO albumDTO = AlbumDTO.builder()
                    .id(albumId)
                    .name(albumName)
                    .artist(albumDoc.getString("artist"))
                    .description(albumDoc.getString("description"))
                    .coverURL(albumDoc.getString("coverURL"))
                    .releaseDate(SongUtils.toOffsetDateTime(releaseTs))
                    .songs(songDTOs)
                    .build();

            albums.add(albumDTO);
        }

        return albums;
    }

    @Override
    public List<SongDTO> fetchSongsByAlbum(String albumId) throws ExecutionException, InterruptedException {
        List<SongDTO> songs = new ArrayList<>();

        DocumentSnapshot albumSnap = db.collection("album").document(albumId).get().get();
        String albumName = albumSnap.exists() ? albumSnap.getString("name") : "Sconosciuto";

        ApiFuture<QuerySnapshot> songsFuture = db.collection("album")
                .document(albumId)
                .collection("songs")
                .orderBy("tracklistPosition")
                .get();

        for (QueryDocumentSnapshot songDoc : songsFuture.get().getDocuments()) {
            List<ArtistDTO> artistDTOs = resolveArtists(songDoc);

            SongDTO song = SongDTO.builder()
                    .id(songDoc.getId())
                    .title(songDoc.getString("title"))
                    .duration(songDoc.getString("duration"))
                    .audioURL(songDoc.getString("audioURL"))
                    .coverURL(songDoc.getString("coverURL"))
                    .stream(SongUtils.asInt(songDoc.get("stream")))
                    .tracklistPosition(SongUtils.asInt(songDoc.get("tracklistPosition")))
                    .artists(artistDTOs)
                    .albumId(albumId)
                    .albumName(albumName)
                    .build();

            songs.add(song);
        }

        return songs;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔢 INCREMENT LISTEN COUNT
    // ═══════════════════════════════════════════════════════════════════════════

    @Override
    public void incrementListenCount(String albumId, String songId) throws ExecutionException, InterruptedException {
        DocumentReference songRef = db
                .collection("album")
                .document(albumId)
                .collection("songs")
                .document(songId);

        DocumentSnapshot snapshot = songRef.get().get();
        if (!snapshot.exists()) {
            System.err.println("❌ Song not found: " + songId + " (albumId=" + albumId + ")");
            throw new IllegalArgumentException("Song not found: " + songId);
        }

        Long currentCount = snapshot.contains("stream") ? snapshot.getLong("stream") : 0L;
        Long newCount = currentCount + 1;

        songRef.update("stream", newCount);

        checkAndCreateCertificationNews(snapshot, newCount);
    }

    private List<ArtistDTO> resolveArtists(QueryDocumentSnapshot songDoc) {
        List<ArtistDTO> artistDTOs = new ArrayList<>();

        Object rawArtists = songDoc.get("artist");
        if (!(rawArtists instanceof List<?> artistList)) {
            return artistDTOs;
        }

        for (Object refObj : artistList) {
            try {
                DocumentSnapshot artistDoc = resolveArtistDocument(refObj);

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

        return artistDTOs;
    }

    private void checkAndCreateCertificationNews(DocumentSnapshot songSnapshot, Long newCount) {
        try {
            if (newCount < 50) {
                return;
            }

            String songName = songSnapshot.getString("title");
            String artistName = resolveArtistNamesFormatted(songSnapshot);

            String message = SongUtils.buildCertificationMessage(songName, artistName, newCount);

            if (message != null) {
                addNewsToFirestore(message);
                System.out.println("📰 News creata: " + message);
            }

        } catch (Exception e) {
            System.err.println("⚠️ Errore durante la creazione della news: " + e.getMessage());
        }
    }

    private String resolveArtistNamesFormatted(DocumentSnapshot songSnapshot) {
        Object artistsField = songSnapshot.get("artist");
        if (!(artistsField instanceof List<?> artistRefs) || artistRefs.isEmpty()) {
            return "Artista sconosciuto";
        }

        List<String> artistNames = new ArrayList<>();

        for (Object refObj : artistRefs) {
            try {
                DocumentSnapshot artistSnap = resolveArtistDocument(refObj);

                if (artistSnap != null && artistSnap.exists()) {
                    String name = artistSnap.getString("name");
                    if (name != null && !name.isBlank()) {
                        artistNames.add(name);
                    }
                }
            } catch (Exception e) {
                System.err.println("⚠️ Errore recupero nome artista: " + e.getMessage());
            }
        }

        return SongUtils.formatArtistNames(artistNames);
    }

    private DocumentSnapshot resolveArtistDocument(Object refObj) throws ExecutionException, InterruptedException {
        if (refObj instanceof DocumentReference artistRef) {
            return artistRef.get().get();
        }

        if (refObj instanceof String artistId && !artistId.isBlank()) {
            return db.collection("artists").document(artistId).get().get();
        }

        return null;
    }

    private void addNewsToFirestore(String message) throws ExecutionException, InterruptedException {
        CollectionReference newsCollection = db.collection("news");

        Map<String, Object> newsData = new HashMap<>();
        newsData.put("message", message);
        newsData.put("createdAt", Instant.now().toString());

        newsCollection.add(newsData).get();
    }
}