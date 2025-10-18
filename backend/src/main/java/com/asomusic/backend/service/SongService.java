package com.asomusic.backend.service;

import com.asomusic.backend.model.dto.AlbumDTO;
import com.asomusic.backend.model.dto.SongDTO;
import com.asomusic.backend.repository.SongRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.UnsupportedEncodingException;
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
                    .map(this::convertAlbumStorageUrls)
                    .collect(Collectors.toList());

        } catch (ExecutionException | InterruptedException e) {
            throw new RuntimeException("Errore durante il recupero dei brani", e);
        }
    }

    private AlbumDTO convertAlbumStorageUrls(AlbumDTO album) {
        album.setCoverURL(convertGsToHttpUrl(album.getCoverURL()));
        if (album.getSongs() != null) {
            List<SongDTO> convertedSongs = album.getSongs().stream()
                    .map(this::convertSongStorageUrls)
                    .collect(Collectors.toList());
            album.setSongs(convertedSongs);
        }

        return album;
    }

    private SongDTO convertSongStorageUrls(SongDTO song) {
        song.setCoverURL(convertGsToHttpUrl(song.getCoverURL()));
        song.setAudioURL(convertGsToHttpUrl(song.getAudioURL()));
        return song;
    }

    private String convertGsToHttpUrl(String gsUrl) {
        if (gsUrl == null || gsUrl.trim().isEmpty()) {
            return gsUrl;
        }

        if (!gsUrl.startsWith("gs://")) {
            return gsUrl;
        }

        try {
            String path = gsUrl.substring(5);
            int firstSlashIndex = path.indexOf('/');

            if (firstSlashIndex == -1) {
                System.err.println("⚠️ URL Firebase Storage malformato: " + gsUrl);
                return gsUrl;
            }

            String bucketName = path.substring(0, firstSlashIndex);
            String filePath = path.substring(firstSlashIndex + 1);

            String encodedPath = encodeFirebaseStoragePath(filePath);

            String httpUrl = String.format(
                    "https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media",
                    bucketName,
                    encodedPath
            );

            System.out.println("🔄 Convertito: " + gsUrl + " → " + httpUrl);
            return httpUrl;

        } catch (Exception e) {
            System.err.println("❌ Errore conversione URL: " + gsUrl + " - " + e.getMessage());
            return gsUrl;
        }
    }

    private String encodeFirebaseStoragePath(String path) {
        String[] parts = path.split("/");
        StringBuilder encodedPath = new StringBuilder();

        for (int i = 0; i < parts.length; i++) {
            String encodedPart = URLEncoder.encode(parts[i], StandardCharsets.UTF_8)
                    .replace("+", "%20");

            encodedPath.append(encodedPart);

            if (i < parts.length - 1) {
                encodedPath.append("%2F");
            }
        }

        return encodedPath.toString();

    }
}