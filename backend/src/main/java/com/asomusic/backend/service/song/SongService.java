package com.asomusic.backend.service.song;

import com.asomusic.backend.model.dto.*;
import com.asomusic.backend.repository.news.INewsRepository;
import com.asomusic.backend.repository.song.ISongRepository;
import com.asomusic.backend.service.storage.IStorageUrlService;
import com.asomusic.backend.util.SongUtils;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.concurrent.ExecutionException;

@ApplicationScoped
public class SongService implements ISongService {

    private static final Logger LOGGER =
            Logger.getLogger(SongService.class);

    private static final String UNKNOWN_ARTIST =
            "Artista sconosciuto";

    @Inject
    ISongRepository songRepository;

    @Inject
    INewsRepository newsRepository;

    @Inject
    IStorageUrlService storageUrlService;

    @Override
    public List<AlbumDTO> fetchAllSongs() {
        List<AlbumDTO> albums =
                executeRepositoryRead(
                        "Errore durante il recupero "
                                + "degli album e dei brani",
                        songRepository::fetchAllAlbumsWithSongs
                );

        return albums.stream()
                .map(this::resolveAlbumUrls)
                .toList();
    }

    @Override
    public List<SongPreviewDTO> fetchSongsByAlbum(
            String albumId
    ) {
        List<SongPreviewDTO> songs =
                executeRepositoryRead(
                        "Errore durante il recupero "
                                + "delle canzoni dell'album: "
                                + albumId,
                        () -> songRepository.fetchSongsByAlbum(
                                albumId
                        )
                );

        return resolveSongPreviewUrls(songs);
    }

    @Override
    public List<SongPreviewDTO> fetchSongsByArtist(
            String artistId
    ) {
        List<SongPreviewDTO> songs =
                executeRepositoryRead(
                        "Errore durante il recupero "
                                + "delle canzoni dell'artista: "
                                + artistId,
                        () -> songRepository.fetchSongsByArtist(
                                artistId
                        )
                );

        return resolveSongPreviewUrls(songs);
    }

    @Override
    public void incrementListenCount(
            String albumId,
            String songId
    ) {
        SongListenIncrementResult result =
                executeRepositoryRead(
                        "Errore durante l'incremento "
                                + "degli ascolti della canzone: "
                                + songId,
                        () -> songRepository.incrementListenCount(
                                albumId,
                                songId
                        )
                );

        createCertificationNewsIfNeeded(result);
    }

    @Override
    public SongPlaybackUrlDTO generatePlaybackUrl(
            String albumId,
            String songId
    ) {
        String audioStoragePath =
                executeRepositoryRead(
                        "Errore durante il recupero "
                                + "delle informazioni di riproduzione "
                                + "della canzone: "
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

        SignedStorageUrl playbackUrl =
                storageUrlService.generateFreshSignedUrl(
                        audioStoragePath
                );

        if (!isValidPlaybackUrl(playbackUrl.url())) {
            throw new IllegalStateException(
                    "Impossibile generare l'URL "
                            + "di riproduzione per la canzone: "
                            + songId
            );
        }

        return SongPlaybackUrlDTO.builder()
                .url(playbackUrl.url())
                .expiresAt(playbackUrl.expiresAt())
                .build();
    }

    private void createCertificationNewsIfNeeded(
            SongListenIncrementResult result
    ) {
        if (result == null) {
            return;
        }

        String artistNames =
                formatArtistNames(result.artistNames());

        String message =
                SongUtils.buildCertificationMessage(
                        result.title(),
                        artistNames,
                        result.listenCount()
                );

        /*
         * buildCertificationMessage restituisce null quando
         * il numero di ascolti non corrisponde a una soglia
         * che deve produrre una news.
         */
        if (!hasText(message)) {
            return;
        }

        createNewsBestEffort(
                result,
                message
        );
    }

    private void createNewsBestEffort(
            SongListenIncrementResult result,
            String message
    ) {
        try {
            long newsSequence =
                    newsRepository.createNews(message);

            LOGGER.infof(
                    "News con sequenza %d creata per la canzone %s "
                            + "al raggiungimento di %d ascolti",
                    newsSequence,
                    result.songId(),
                    result.listenCount()
            );

        } catch (InterruptedException exception) {
            /*
             * L'incremento degli ascolti è già stato salvato.
             * Ripristiniamo comunque lo stato interrupted del thread.
             */
            Thread.currentThread().interrupt();

            LOGGER.warnf(
                    exception,
                    "Creazione della news interrotta per la canzone %s "
                            + "al raggiungimento di %d ascolti",
                    result.songId(),
                    result.listenCount()
            );

        } catch (ExecutionException | RuntimeException exception) {
            /*
             * Un errore nella creazione della news non deve far
             * apparire fallito un incremento già completato.
             */
            LOGGER.warnf(
                    exception,
                    "Impossibile creare la news per la canzone %s "
                            + "al raggiungimento di %d ascolti",
                    result.songId(),
                    result.listenCount()
            );
        }
    }

    private String formatArtistNames(
            List<String> artistNames
    ) {
        if (artistNames == null || artistNames.isEmpty()) {
            return UNKNOWN_ARTIST;
        }

        List<String> validArtistNames =
                artistNames.stream()
                        .filter(this::hasText)
                        .toList();

        if (validArtistNames.isEmpty()) {
            return UNKNOWN_ARTIST;
        }

        return SongUtils.formatArtistNames(
                validArtistNames
        );
    }

    private List<SongPreviewDTO> resolveSongPreviewUrls(
            List<SongPreviewDTO> songs
    ) {
        if (songs == null || songs.isEmpty()) {
            return List.of();
        }

        return songs.stream()
                .map(this::resolveSongPreviewUrls)
                .toList();
    }

    private AlbumDTO resolveAlbumUrls(
            AlbumDTO album
    ) {
        List<SongPreviewDTO> songs =
                album.getSongs() == null
                        ? List.of()
                        : album.getSongs()
                        .stream()
                        .map(this::resolveSongPreviewUrls)
                        .toList();

        return AlbumDTO.builder()
                .id(album.getId())
                .name(album.getName())
                .artist(album.getArtist())
                .description(album.getDescription())
                .coverURL(
                        resolveCachedStorageUrl(
                                album.getCoverURL()
                        )
                )
                .releaseDate(album.getReleaseDate())
                .songs(songs)
                .build();
    }

    private SongPreviewDTO resolveSongPreviewUrls(
            SongPreviewDTO song
    ) {
        List<ArtistDTO> artists =
                song.getArtists() == null
                        ? List.of()
                        : song.getArtists()
                        .stream()
                        .map(this::resolveArtistUrls)
                        .toList();

        return SongPreviewDTO.builder()
                .id(song.getId())
                .title(song.getTitle())
                .duration(song.getDuration())
                .coverURL(
                        resolveCachedStorageUrl(
                                song.getCoverURL()
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

    private ArtistDTO resolveArtistUrls(
            ArtistDTO artist
    ) {
        return ArtistDTO.builder()
                .id(artist.getId())
                .name(artist.getName())
                .bio(artist.getBio())
                .profileURL(
                        resolveCachedStorageUrl(
                                artist.getProfileURL()
                        )
                )
                .build();
    }

    private String resolveCachedStorageUrl(
            String storagePath
    ) {
        if (!hasText(storagePath)) {
            return null;
        }

        return storageUrlService.getSignedUrl(
                storagePath
        );
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

    @FunctionalInterface
    private interface RepositorySupplier<T> {

        T execute()
                throws ExecutionException,
                InterruptedException;
    }
}