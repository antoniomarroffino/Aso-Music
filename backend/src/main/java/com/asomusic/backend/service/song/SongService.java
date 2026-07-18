package com.asomusic.backend.service.song;

import com.asomusic.backend.model.dto.AlbumDTO;
import com.asomusic.backend.model.dto.ArtistDTO;
import com.asomusic.backend.model.dto.SongPlaybackUrlDTO;
import com.asomusic.backend.model.dto.SongPreviewDTO;
import com.asomusic.backend.repository.song.ISongRepository;
import com.asomusic.backend.service.storage.FirebaseStorageService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.concurrent.ExecutionException;

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
        List<AlbumDTO> albums =
                executeRepositoryRead(
                        "Errore durante il recupero degli album e dei brani",
                        songRepository::fetchAllAlbumsWithSongs
                );

        /*
         * Una singola cache per tutta la risposta:
         * la copertina dell'album può essere usata anche
         * da più canzoni dello stesso album.
         */
        Map<String, String> signedUrls =
                new HashMap<>();

        return albums.stream()
                .map(
                        album -> signAlbumUrls(
                                album,
                                signedUrls
                        )
                )
                .toList();
    }

    @Override
    public List<SongPreviewDTO> fetchSongsByAlbum(
            String albumId
    ) {
        List<SongPreviewDTO> songs =
                executeRepositoryRead(
                        "Errore durante il recupero delle canzoni dell'album: "
                                + albumId,
                        () -> songRepository.fetchSongsByAlbum(
                                albumId
                        )
                );

        return signSongPreviewUrls(songs);
    }

    @Override
    public List<SongPreviewDTO> fetchSongsByArtist(
            String artistId
    ) {
        List<SongPreviewDTO> songs =
                executeRepositoryRead(
                        "Errore durante il recupero delle canzoni dell'artista: "
                                + artistId,
                        () -> songRepository.fetchSongsByArtist(
                                artistId
                        )
                );

        return signSongPreviewUrls(songs);
    }

    @Override
    public void incrementListenCount(
            String albumId,
            String songId
    ) {
        executeRepositoryWrite(
                "Errore durante l'incremento degli ascolti "
                        + "della canzone: "
                        + songId,
                () -> songRepository.incrementListenCount(
                        albumId,
                        songId
                )
        );
    }

    @Override
    public SongPlaybackUrlDTO generatePlaybackUrl(
            String albumId,
            String songId
    ) {
        String audioStoragePath =
                executeRepositoryRead(
                        "Errore durante il recupero delle informazioni "
                                + "di riproduzione della canzone: "
                                + songId,
                        () -> songRepository
                                .fetchSongAudioStoragePath(
                                        albumId,
                                        songId
                                )
                                .orElseThrow(
                                        () -> new NoSuchElementException(
                                                "Canzone non trovata "
                                                        + "o audioURL mancante: "
                                                        + songId
                                        )
                                )
                );

        String signedUrl =
                firebaseStorageService.generateSignedUrl(
                        audioStoragePath
                );

        if (!isValidPlaybackUrl(signedUrl)) {
            throw new IllegalStateException(
                    "Impossibile generare l'URL di riproduzione "
                            + "per la canzone: "
                            + songId
            );
        }

        OffsetDateTime expiresAt =
                OffsetDateTime
                        .now(ZoneOffset.UTC)
                        .plusHours(
                                urlExpirationHours
                        );

        return SongPlaybackUrlDTO.builder()
                .url(signedUrl)
                .expiresAt(expiresAt)
                .build();
    }

    private List<SongPreviewDTO> signSongPreviewUrls(
            List<SongPreviewDTO> songs
    ) {
        if (songs.isEmpty()) {
            return List.of();
        }

        Map<String, String> signedUrls =
                new HashMap<>();

        return songs.stream()
                .map(
                        song -> signSongPreviewUrls(
                                song,
                                signedUrls
                        )
                )
                .toList();
    }

    private AlbumDTO signAlbumUrls(
            AlbumDTO album,
            Map<String, String> signedUrls
    ) {
        List<SongPreviewDTO> songs =
                album.getSongs() == null
                        ? List.of()
                        : album.getSongs()
                        .stream()
                        .map(
                                song -> signSongPreviewUrls(
                                        song,
                                        signedUrls
                                )
                        )
                        .toList();

        return AlbumDTO.builder()
                .id(album.getId())
                .name(album.getName())
                .artist(album.getArtist())
                .description(album.getDescription())
                .coverURL(
                        generateSignedUrlCached(
                                album.getCoverURL(),
                                signedUrls
                        )
                )
                .releaseDate(
                        album.getReleaseDate()
                )
                .songs(songs)
                .build();
    }

    private SongPreviewDTO signSongPreviewUrls(
            SongPreviewDTO song,
            Map<String, String> signedUrls
    ) {
        List<ArtistDTO> artists =
                song.getArtists() == null
                        ? List.of()
                        : song.getArtists()
                        .stream()
                        .map(
                                artist -> signArtistUrls(
                                        artist,
                                        signedUrls
                                )
                        )
                        .toList();

        return SongPreviewDTO.builder()
                .id(song.getId())
                .title(song.getTitle())
                .duration(song.getDuration())
                .coverURL(
                        generateSignedUrlCached(
                                song.getCoverURL(),
                                signedUrls
                        )
                )
                .stream(song.getStream())
                .tracklistPosition(
                        song.getTracklistPosition()
                )
                .artists(artists)
                .albumId(song.getAlbumId())
                .albumName(song.getAlbumName())
                .build();
    }

    private ArtistDTO signArtistUrls(
            ArtistDTO artist,
            Map<String, String> signedUrls
    ) {
        return ArtistDTO.builder()
                .id(artist.getId())
                .name(artist.getName())
                .bio(artist.getBio())
                .profileURL(
                        generateSignedUrlCached(
                                artist.getProfileURL(),
                                signedUrls
                        )
                )
                .build();
    }

    /**
     * Firma ogni storage path una sola volta
     * durante la costruzione della risposta.
     */
    private String generateSignedUrlCached(
            String storagePath,
            Map<String, String> signedUrls
    ) {
        if (!hasText(storagePath)) {
            return null;
        }

        /*
         * Evita di provare a firmare nuovamente
         * un URL già utilizzabile.
         */
        if (isHttpUrl(storagePath)) {
            return storagePath;
        }

        if (signedUrls.containsKey(storagePath)) {
            return signedUrls.get(storagePath);
        }

        String signedUrl =
                firebaseStorageService.generateSignedUrl(
                        storagePath
                );

        signedUrls.put(
                storagePath,
                signedUrl
        );

        return signedUrl;
    }

    private boolean isHttpUrl(
            String value
    ) {
        return value.startsWith("https://")
                || value.startsWith("http://");
    }

    private boolean isValidPlaybackUrl(
            String url
    ) {
        return hasText(url)
                && !url.startsWith("gs://");
    }

    private boolean hasText(
            String value
    ) {
        return value != null
                && !value.isBlank();
    }

    private <T> T executeRepositoryRead(
            String errorMessage,
            RepositorySupplier<T> operation
    ) {
        try {
            return operation.execute();

        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();

            throw new IllegalStateException(
                    errorMessage
                            + ": thread interrotto",
                    exception
            );

        } catch (ExecutionException exception) {
            throw new IllegalStateException(
                    errorMessage,
                    exception
            );
        }
    }

    private void executeRepositoryWrite(
            String errorMessage,
            RepositoryAction operation
    ) {
        try {
            operation.execute();

        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();

            throw new IllegalStateException(
                    errorMessage
                            + ": thread interrotto",
                    exception
            );

        } catch (ExecutionException exception) {
            throw new IllegalStateException(
                    errorMessage,
                    exception
            );
        }
    }

    @FunctionalInterface
    private interface RepositorySupplier<T> {

        T execute()
                throws ExecutionException,
                InterruptedException;
    }

    @FunctionalInterface
    private interface RepositoryAction {

        void execute()
                throws ExecutionException,
                InterruptedException;
    }
}