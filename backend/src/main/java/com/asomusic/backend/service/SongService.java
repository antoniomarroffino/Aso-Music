package com.asomusic.backend.service;

import com.asomusic.backend.model.dto.AlbumDTO;
import com.asomusic.backend.model.dto.SongDTO;
import com.asomusic.backend.repository.SongRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@ApplicationScoped
public class SongService implements ISongService {

    @Inject
    SongRepository songRepository;

    @Override
    public List<AlbumDTO> fetchAllSongs() {
        try {
            List<AlbumDTO> albums = songRepository.fetchAllAlbumsWithSongs();

            return albums.stream()
                    .map(this::convertAlbumStorageUrlsSafe)
                    .collect(Collectors.toList());

        } catch (ExecutionException | InterruptedException e) {
            throw new RuntimeException("Errore durante il recupero dei brani", e);
        }
    }

    // ✅ Conversione completa per ogni album e i suoi brani
    private AlbumDTO convertAlbumStorageUrlsSafe(AlbumDTO album) {
        return AlbumDTO.builder()
                .id(album.getId())
                .name(album.getName())
                .artist(album.getArtist())
                .description(album.getDescription())
                .coverURL(convertGsToHttpUrl(album.getCoverURL()))
                .releaseYear(album.getReleaseYear())
                .songs(album.getSongs() == null ? List.of() :
                        album.getSongs().stream()
                                .map(this::convertSongStorageUrlsSafe)
                                .collect(Collectors.toList()))
                .build();
    }

    private SongDTO convertSongStorageUrlsSafe(SongDTO song) {
        return SongDTO.builder()
                .id(song.getId())
                .title(song.getTitle())
                .duration(song.getDuration())
                .audioURL(convertGsToHttpUrl(song.getAudioURL()))
                .coverURL(convertGsToHttpUrl(song.getCoverURL()))
                .stream(song.getStream())
                .tracklistPosition(song.getTracklistPosition())
                .build();
    }

    // ✅ Conversione universale Firebase Storage URL
    private String convertGsToHttpUrl(String gsUrl) {
        if (gsUrl == null || gsUrl.isBlank()) return gsUrl;
        if (!gsUrl.startsWith("gs://")) return gsUrl;

        try {
            // Esempio: gs://asomusic-d39c4.appspot.com/album/SNITCH (DELUXE)/cover.jpg
            String path = gsUrl.substring(5); // asomusic-d39c4.appspot.com/album/...
            int slashIndex = path.indexOf('/');

            if (slashIndex == -1) {
                System.err.println("⚠️ URL Firebase Storage malformato: " + gsUrl);
                return gsUrl;
            }

            String bucket = path.substring(0, slashIndex);
            String filePath = path.substring(slashIndex + 1);

            // Decode eventuali path già encoded e re-encode in modo pulito
            String cleanPath = URLDecoder.decode(filePath, StandardCharsets.UTF_8);
            String encodedPath = encodeFirebaseStoragePath(cleanPath);

            String httpUrl = String.format(
                    "https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media",
                    bucket, encodedPath
            );

            System.out.println("🔄 Convertito: " + gsUrl + " → " + httpUrl);
            return httpUrl;

        } catch (Exception e) {
            System.err.println("❌ Errore conversione URL: " + gsUrl + " - " + e.getMessage());
            return gsUrl;
        }
    }

    // ✅ Encoding sicuro per Firebase Storage
    private String encodeFirebaseStoragePath(String path) {
        String[] parts = path.split("/");
        return String.join("%2F",
                java.util.Arrays.stream(parts)
                        .map(part -> URLEncoder.encode(part, StandardCharsets.UTF_8)
                                .replace("+", "%20"))
                        .collect(Collectors.toList()));
    }
}
