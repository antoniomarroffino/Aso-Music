package com.asomusic.backend.service.artist;

import com.asomusic.backend.model.dto.ArtistDTO;
import com.asomusic.backend.repository.artist.ArtistRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@ApplicationScoped
public class ArtistService implements IArtistService {

    @Inject
    ArtistRepository artistRepository;

    @Override
    public List<ArtistDTO> fetchAllArtists() {
        try {
            List<ArtistDTO> artists = artistRepository.fetchAllArtists();

            // ✅ Converte eventuali profileURL in https
            return artists.stream()
                    .map(this::convertArtistUrls)
                    .collect(Collectors.toList());

        } catch (ExecutionException | InterruptedException e) {
            throw new RuntimeException("Errore durante il recupero degli artisti", e);
        }
    }

    @Override
    public ArtistDTO fetchArtistById(String artistId) {
        try {
            ArtistDTO artist = artistRepository.fetchArtistById(artistId);
            if (artist != null) {
                return convertArtistUrls(artist);
            }
            return null;
        } catch (ExecutionException | InterruptedException e) {
            throw new RuntimeException("Errore durante il recupero dell'artista con ID: " + artistId, e);
        }
    }

    // ✅ Conversione dei link Firebase anche per i profili artista
    private ArtistDTO convertArtistUrls(ArtistDTO artist) {
        if (artist == null) return null;

        return ArtistDTO.builder()
                .id(artist.getId())
                .name(artist.getName())
                .bio(artist.getBio())
                .profileURL(convertGsToHttpUrl(artist.getProfileURL()))
                .build();
    }

    // ✅ Conversione gs:// → https://firebasestorage.googleapis.com/...
    private String convertGsToHttpUrl(String gsUrl) {
        if (gsUrl == null || gsUrl.isBlank()) return gsUrl;
        if (!gsUrl.startsWith("gs://")) return gsUrl;

        try {
            String path = gsUrl.substring(5);
            int slashIndex = path.indexOf('/');

            if (slashIndex == -1) {
                System.err.println("⚠️ URL Firebase Storage malformato: " + gsUrl);
                return gsUrl;
            }

            String bucket = path.substring(0, slashIndex);
            String filePath = path.substring(slashIndex + 1);

            String cleanPath = URLDecoder.decode(filePath, StandardCharsets.UTF_8);
            String encodedPath = encodeFirebaseStoragePath(cleanPath);

            return String.format(
                    "https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media",
                    bucket, encodedPath
            );
        } catch (Exception e) {
            System.err.println("❌ Errore conversione URL artista: " + gsUrl + " - " + e.getMessage());
            return gsUrl;
        }
    }

    private String encodeFirebaseStoragePath(String path) {
        String[] parts = path.split("/");
        return Arrays.stream(parts)
                .map(part -> URLEncoder.encode(part, StandardCharsets.UTF_8)
                        .replace("+", "%20"))
                .collect(Collectors.joining("%2F"));
    }
}
