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
            System.err.println("❌ Song not found: " + songId);
            throw new IllegalArgumentException("Song not found: " + songId);
        }

        Long currentCount = snapshot.contains("stream") ? snapshot.getLong("stream") : 0L;
        Long newCount = currentCount + 1;

        songRef.update("stream", newCount);

        checkAndCreateCertificationNews(snapshot, newCount, albumId);
    }


    @Override
    public List<SongDTO> fetchSongsByAlbum(String albumId) throws ExecutionException, InterruptedException {

        List<SongDTO> songs = new ArrayList<>();

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
                    .stream(asInt(songDoc.get("stream")))
                    .tracklistPosition(asInt(songDoc.get("tracklistPosition")))
                    .artists(artistDTOs)
                    .build();

            songs.add(song);
        }

        return songs;
    }


    private List<ArtistDTO> resolveArtists(QueryDocumentSnapshot songDoc) {
        List<ArtistDTO> artistDTOs = new ArrayList<>();

        Object rawArtists = songDoc.get("artist");
        if (!(rawArtists instanceof List<?> artistList)) {
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
        return artistDTOs;
    }

    private Integer asInt(Object obj) {
        if (obj instanceof Number) return ((Number) obj).intValue();
        if (obj instanceof String) return Integer.parseInt((String) obj);
        return null;
    }

    private void checkAndCreateCertificationNews(DocumentSnapshot songSnapshot, Long newCount, String albumId) {
        try {
            if (newCount < 40) return; // Nessuna certificazione prima di 40 ascolti

            String songName = songSnapshot.getString("title");
            String artistName = resolveArtistName(songSnapshot);

            String message = null;

            if (newCount.equals(40L)) {
                message = "🥇 \"" + songName + "\" di " + artistName + " ha ottenuto il disco d’oro!";
            } else if (newCount.equals(80L)) {
                message = "💿 \"" + songName + "\" di " + artistName + " ha ottenuto il disco di platino!";
            } else if (newCount > 80 && newCount % 80 == 0) {
                int multiplier = (int) (newCount / 80);
                String label = getPlatinoLabel(multiplier);
                message = "💿 \"" + songName + "\" di " + artistName + " ha ottenuto il " + label + " disco di platino!";
            }

            if (message != null) {
                addNewsToFirestore(message);
                System.out.println("📰 News creata: " + message);
            }

        } catch (Exception e) {
            System.err.println("⚠️ Errore durante la creazione della news: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private String resolveArtistName(DocumentSnapshot songSnapshot) throws ExecutionException, InterruptedException {
        Object artistsField = songSnapshot.get("artist");
        if (!(artistsField instanceof List<?> artistRefs) || artistRefs.isEmpty()) {
            return "Artista sconosciuto";
        }

        // Prendiamo il primo riferimento (se ne hai più di uno puoi concatenare)
        Object refObj = artistRefs.get(0);
        if (!(refObj instanceof DocumentReference artistRef)) {
            return "Artista sconosciuto";
        }

        DocumentSnapshot artistSnap = artistRef.get().get();
        if (!artistSnap.exists()) {
            return "Artista sconosciuto";
        }

        String name = artistSnap.getString("name");
        return name != null ? name : "Artista sconosciuto";
    }

    private String getPlatinoLabel(int multiplier) {
        return switch (multiplier) {
            case 2 -> "doppio";
            case 3 -> "triplo";
            case 4 -> "quadruplo";
            case 5 -> "quintuplo";
            default -> multiplier + "º";
        };
    }


    private void addNewsToFirestore(String message) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference newsCollection = db.collection("news");

        String createdAt = java.time.Instant.now().toString();

        newsCollection.add(new java.util.HashMap<String, Object>() {{
            put("message", message);
            put("createdAt", createdAt);
        }}).get();
    }


}
