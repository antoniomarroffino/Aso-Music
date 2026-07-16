package com.asomusic.backend.service.song;

import com.asomusic.backend.model.dto.AlbumDTO;
import com.asomusic.backend.model.dto.SongDTO;
import com.asomusic.backend.model.dto.SongPlaybackUrlDTO;
import com.asomusic.backend.model.dto.SongPreviewDTO;
import com.asomusic.backend.repository.song.ISongRepository;
import com.asomusic.backend.service.storage.FirebaseStorageService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@ApplicationScoped
public class SongService implements ISongService {

    @Inject
    ISongRepository songRepository;

    @Inject
    FirebaseStorageService firebaseStorageService;

    @ConfigProperty(
            name = "firebase.storage.url-expiration-hours",
            defaultValue = "24"
    )
    long urlExpirationHours;

    @Override
    public List<AlbumDTO> fetchAllSongs() {
        try {
            List<AlbumDTO> albums = songRepository.fetchAllAlbumsWithSongs();

            return albums.stream()
                    .map(this::convertAlbumStorageUrlsSafe)
                    .collect(Collectors.toList());

        } catch (ExecutionException | InterruptedException e) {
            throw new RuntimeException("❌ Errore durante il recupero dei brani", e);
        }
    }

    @Override
    public void incrementListenCount(String albumId, String songId) {
        try {
            songRepository.incrementListenCount(albumId, songId);
        } catch (ExecutionException | InterruptedException e) {
            throw new RuntimeException("❌ Errore durante l'incremento degli ascolti", e);
        }
    }

    @Override
    public List<SongPreviewDTO> fetchSongsByAlbum(String albumId) {
        try {
            return songRepository.fetchSongsByAlbum(albumId)
                    .stream()
                    .map(this::convertToSongPreview)
                    .toList();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Thread interrotto durante il recupero delle canzoni dell'album",
                    e
            );

        } catch (ExecutionException e) {
            throw new RuntimeException(
                    "Errore durante il recupero delle canzoni dell'album",
                    e
            );
        }
    }

    @Override
    public SongPlaybackUrlDTO generatePlaybackUrl(
            String albumId,
            String songId
    ) {
        try {
            String audioStoragePath = songRepository
                    .fetchSongAudioStoragePath(albumId, songId)
                    .orElseThrow(() -> new NoSuchElementException(
                            "Song not found or missing audio URL: " + songId
                    ));

            OffsetDateTime expiresAt = OffsetDateTime
                    .now(ZoneOffset.UTC)
                    .plusHours(urlExpirationHours);

            String signedUrl =
                    firebaseStorageService.generateSignedUrl(
                            audioStoragePath
                    );

            /*
             * FirebaseStorageService attualmente restituisce il gsPath
             * originale quando la firma fallisce. Evitiamo quindi di
             * restituire una risposta 200 con una URL inutilizzabile.
             */
            if (signedUrl == null
                    || signedUrl.isBlank()
                    || signedUrl.startsWith("gs://")) {
                throw new IllegalStateException(
                        "Unable to generate playback URL for song: "
                                + songId
                );
            }

            return SongPlaybackUrlDTO.builder()
                    .url(signedUrl)
                    .expiresAt(expiresAt)
                    .build();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();

            throw new RuntimeException(
                    "Thread interrupted while generating playback URL",
                    e
            );

        } catch (ExecutionException e) {
            throw new RuntimeException(
                    "Error retrieving song playback information",
                    e
            );
        }
    }

    private AlbumDTO convertAlbumStorageUrlsSafe(AlbumDTO album) {
        return AlbumDTO.builder()
                .id(album.getId())
                .name(album.getName())
                .artist(album.getArtist())
                .description(album.getDescription())
                .coverURL(firebaseStorageService.generateSignedUrl(album.getCoverURL()))
                .releaseDate(album.getReleaseDate())
                .songs(album.getSongs() == null ? List.of() :
                        album.getSongs().stream()
                                .map(song ->
                                        convertSongStorageUrlsSafe(
                                                song,
                                                album.getId(),
                                                album.getName()
                                        )
                                )
                                .collect(Collectors.toList()))
                .build();
    }

    private SongDTO convertSongStorageUrlsSafe(SongDTO song, String albumId, String albumName) {
        return SongDTO.builder()
                .id(song.getId())
                .title(song.getTitle())
                .duration(song.getDuration())
                .audioURL(firebaseStorageService.generateSignedUrl(song.getAudioURL()))
                .coverURL(firebaseStorageService.generateSignedUrl(song.getCoverURL()))
                .stream(song.getStream())
                .tracklistPosition(song.getTracklistPosition())
                .artists(song.getArtists())
                .albumId(albumId)
                .albumName(albumName)
                .build();
    }

    private SongPreviewDTO convertToSongPreview(SongDTO song) {
        return SongPreviewDTO.builder()
                .id(song.getId())
                .title(song.getTitle())
                .duration(song.getDuration())
                .coverURL(
                        firebaseStorageService.generateSignedUrl(
                                song.getCoverURL()
                        )
                )
                .stream(song.getStream())
                .tracklistPosition(song.getTracklistPosition())
                .artists(song.getArtists())
                .albumId(song.getAlbumId())
                .albumName(song.getAlbumName())
                .build();
    }
}
