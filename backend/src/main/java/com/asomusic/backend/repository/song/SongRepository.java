package com.asomusic.backend.repository.song;

import com.asomusic.backend.model.dto.AlbumDTO;
import com.asomusic.backend.model.dto.ArtistDTO;
import com.asomusic.backend.model.dto.SongListenIncrementResult;
import com.asomusic.backend.model.dto.SongPreviewDTO;
import com.asomusic.backend.util.SongUtils;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldMask;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@ApplicationScoped
public class SongRepository implements ISongRepository {

    private static final Logger LOGGER =
            Logger.getLogger(SongRepository.class);

    private static final String ALBUM_COLLECTION = "album";
    private static final String SONGS_COLLECTION = "songs";
    private static final String ARTISTS_COLLECTION = "artists";
    private static final String NEWS_COLLECTION = "news";

    /*
     * Evita richieste getAll eccessivamente grandi.
     * Per cataloghi piccoli verrà comunque eseguito un solo batch.
     */
    private static final int BATCH_READ_SIZE = 100;

    private final Firestore db =
            FirestoreClient.getFirestore();

    /**
     * Recupera album e canzoni con:
     * 1 query per tutti gli album;
     * 1 collection-group query per tutte le canzoni;
     * N batch per tutti gli artisti distinti.
     * Non viene mai letto audioURL.
     */
    @Override
    public List<AlbumDTO> fetchAllAlbumsWithSongs()
            throws ExecutionException, InterruptedException {

        QuerySnapshot albumSnapshot =
                db.collection(ALBUM_COLLECTION)
                        .get()
                        .get();

        List<QueryDocumentSnapshot> albumDocuments =
                albumSnapshot.getDocuments();

        if (albumDocuments.isEmpty()) {
            return List.of();
        }

        QuerySnapshot songsSnapshot =
                db.collectionGroup(SONGS_COLLECTION)
                        .get()
                        .get();

        List<QueryDocumentSnapshot> songDocuments =
                songsSnapshot.getDocuments();

        Map<String, QueryDocumentSnapshot> albumsById =
                indexAlbumsById(albumDocuments);

        Map<String, ArtistDTO> artistsByPath =
                fetchArtistsForSongs(songDocuments);

        Map<String, List<SongPreviewDTO>> songsByAlbumId =
                new HashMap<>();

        for (QueryDocumentSnapshot songDocument : songDocuments) {
            DocumentReference albumReference =
                    getAlbumReference(songDocument);

            if (albumReference == null) {
                continue;
            }

            String albumId = albumReference.getId();

            DocumentSnapshot albumDocument =
                    albumsById.get(albumId);

            if (albumDocument == null) {
                continue;
            }

            SongPreviewDTO song =
                    mapSongPreview(
                            songDocument,
                            albumDocument,
                            artistsByPath
                    );

            songsByAlbumId
                    .computeIfAbsent(
                            albumId,
                            ignored -> new ArrayList<>()
                    )
                    .add(song);
        }

        /*
         * La collection-group query non garantisce l'ordine
         * interno delle canzoni di ogni album.
         */
        songsByAlbumId.values().forEach(
                songs -> songs.sort(
                        Comparator.comparingInt(
                                SongPreviewDTO::getTracklistPosition
                        )
                )
        );

        List<AlbumDTO> albums =
                new ArrayList<>(albumDocuments.size());

        for (QueryDocumentSnapshot albumDocument : albumDocuments) {
            String albumId = albumDocument.getId();

            List<SongPreviewDTO> songs =
                    songsByAlbumId.getOrDefault(
                            albumId,
                            List.of()
                    );

            albums.add(
                    mapAlbum(
                            albumDocument,
                            songs
                    )
            );
        }

        return albums;
    }

    /**
     * Recupera soltanto le anteprime delle canzoni
     * dell'album richiesto.
     * audioURL non viene letto.
     */
    @Override
    public List<SongPreviewDTO> fetchSongsByAlbum(
            String albumId
    ) throws ExecutionException, InterruptedException {

        DocumentReference albumReference =
                db.collection(ALBUM_COLLECTION)
                        .document(albumId);

        DocumentSnapshot albumDocument =
                albumReference
                        .get(
                                FieldMask.of(
                                        "name",
                                        "coverURL"
                                )
                        )
                        .get();

        if (!albumDocument.exists()) {
            return List.of();
        }

        QuerySnapshot songsSnapshot =
                albumReference
                        .collection(SONGS_COLLECTION)
                        .orderBy(
                                "tracklistPosition",
                                Query.Direction.ASCENDING
                        )
                        .get()
                        .get();

        List<QueryDocumentSnapshot> songDocuments =
                songsSnapshot.getDocuments();

        if (songDocuments.isEmpty()) {
            return List.of();
        }

        Map<String, ArtistDTO> artistsByPath =
                fetchArtistsForSongs(songDocuments);

        List<SongPreviewDTO> songs =
                new ArrayList<>(songDocuments.size());

        for (QueryDocumentSnapshot songDocument : songDocuments) {
            songs.add(
                    mapSongPreview(
                            songDocument,
                            albumDocument,
                            artistsByPath
                    )
            );
        }

        return songs;
    }

    /**
     * Recupera le canzoni dell'artista già ordinate
     * per numero di ascolti decrescente.
     * Richiede un indice Firestore collection-group:
     * artist: array
     * stream: descending
     */
    @Override
    public List<SongPreviewDTO> fetchSongsByArtist(
            String artistId
    ) throws ExecutionException, InterruptedException {

        DocumentReference artistReference =
                db.collection(ARTISTS_COLLECTION)
                        .document(artistId);

        QuerySnapshot songsSnapshot =
                db.collectionGroup(SONGS_COLLECTION)
                        .whereArrayContains(
                                "artist",
                                artistReference
                        )
                        .orderBy(
                                "stream",
                                Query.Direction.DESCENDING
                        )
                        .get()
                        .get();

        List<QueryDocumentSnapshot> songDocuments =
                songsSnapshot.getDocuments();

        if (songDocuments.isEmpty()) {
            return List.of();
        }

        Map<String, DocumentReference> albumReferences =
                collectAlbumReferences(songDocuments);

        Map<String, DocumentSnapshot> albumsByPath =
                fetchDocumentsByPath(
                        albumReferences.values()
                );

        Map<String, ArtistDTO> artistsByPath =
                fetchArtistsForSongs(songDocuments);

        List<SongPreviewDTO> songs =
                new ArrayList<>(songDocuments.size());

        for (QueryDocumentSnapshot songDocument : songDocuments) {
            DocumentReference albumReference =
                    getAlbumReference(songDocument);

            if (albumReference == null) {
                continue;
            }

            DocumentSnapshot albumDocument =
                    albumsByPath.get(
                            albumReference.getPath()
                    );

            SongPreviewDTO song =
                    mapSongPreview(
                            songDocument,
                            albumDocument,
                            artistsByPath
                    );

            songs.add(song);
        }

        /*
         * La query Firestore li restituisce già ordinati
         * per stream DESC. Non serve un sort Java.
         */
        return songs;
    }

    /**
     * Legge esclusivamente audioURL.
     * Questo è l'unico metodo del repository che deve
     * conoscere il campo audioURL.
     */
    @Override
    public Optional<String> fetchSongAudioStoragePath(
            String albumId,
            String songId
    ) throws ExecutionException, InterruptedException {

        DocumentSnapshot songSnapshot =
                db.collection(ALBUM_COLLECTION)
                        .document(albumId)
                        .collection(SONGS_COLLECTION)
                        .document(songId)
                        .get(
                                FieldMask.of("audioURL")
                        )
                        .get();

        if (!songSnapshot.exists()) {
            return Optional.empty();
        }

        String audioStoragePath =
                songSnapshot.getString("audioURL");

        if (!hasText(audioStoragePath)) {
            return Optional.empty();
        }

        return Optional.of(audioStoragePath);
    }

    /**
     * Incremento atomico del contatore.
     * La precedente implementazione eseguiva:
     * read -> current + 1 -> update
     * Due richieste concorrenti potevano quindi scrivere
     * lo stesso valore. La transazione evita aggiornamenti persi.
     */
    @Override
    public SongListenIncrementResult incrementListenCount(
            String albumId,
            String songId
    ) throws ExecutionException, InterruptedException {

        DocumentReference songReference =
                db.collection(ALBUM_COLLECTION)
                        .document(albumId)
                        .collection(SONGS_COLLECTION)
                        .document(songId);

        ListenIncrementPersistenceResult incrementResult =
                db.runTransaction(transaction -> {
                            DocumentSnapshot songSnapshot =
                                    transaction
                                            .get(songReference)
                                            .get();

                            if (!songSnapshot.exists()) {
                                throw new IllegalArgumentException(
                                        "Song not found: "
                                                + songId
                                                + " (albumId="
                                                + albumId
                                                + ")"
                                );
                            }

                            long currentCount =
                                    readLong(
                                            songSnapshot,
                                            "stream"
                                    );

                            long newCount =
                                    Math.addExact(
                                            currentCount,
                                            1L
                                    );

                            transaction.update(
                                    songReference,
                                    "stream",
                                    newCount
                            );

                            return new ListenIncrementPersistenceResult(
                                    songSnapshot,
                                    newCount
                            );
                        })
                        .get();

        List<String> artistNames =
                resolveArtistNames(
                        incrementResult.songSnapshot()
                );

        return new SongListenIncrementResult(
                songId,
                incrementResult
                        .songSnapshot()
                        .getString("title"),
                incrementResult.newCount(),
                artistNames
        );
    }

    private AlbumDTO mapAlbum(
            DocumentSnapshot albumDocument,
            List<SongPreviewDTO> songs
    ) {
        Timestamp releaseTimestamp =
                albumDocument.getTimestamp(
                        "releaseYear"
                );

        return AlbumDTO.builder()
                .id(albumDocument.getId())
                .name(
                        albumDocument.getString(
                                "name"
                        )
                )
                .artist(
                        albumDocument.getString(
                                "artist"
                        )
                )
                .description(
                        albumDocument.getString(
                                "description"
                        )
                )
                .coverURL(
                        albumDocument.getString(
                                "coverURL"
                        )
                )
                .releaseDate(
                        SongUtils.toOffsetDateTime(
                                releaseTimestamp
                        )
                )
                .songs(songs)
                .build();
    }

    /**
     * Mapper unico usato da:
     * - fetchAllAlbumsWithSongs;
     * - fetchSongsByAlbum;
     * - fetchSongsByArtist.
     */
    private SongPreviewDTO mapSongPreview(
            DocumentSnapshot songDocument,
            DocumentSnapshot albumDocument,
            Map<String, ArtistDTO> artistsByPath
    ) {
        DocumentReference albumReference =
                getAlbumReference(songDocument);

        String albumId =
                albumReference != null
                        ? albumReference.getId()
                        : "";

        String albumName =
                albumDocument != null
                        ? albumDocument.getString("name")
                        : null;

        String songCoverUrl =
                songDocument.getString("coverURL");

        String albumCoverUrl =
                albumDocument != null
                        ? albumDocument.getString("coverURL")
                        : null;

        String effectiveCoverUrl =
                hasText(songCoverUrl)
                        ? songCoverUrl
                        : albumCoverUrl;

        return SongPreviewDTO.builder()
                .id(songDocument.getId())
                .title(
                        songDocument.getString(
                                "title"
                        )
                )
                .duration(
                        songDocument.getString(
                                "duration"
                        )
                )
                .coverURL(effectiveCoverUrl)
                .stream(
                        readLong(
                                songDocument,
                                "stream"
                        )
                )
                .tracklistPosition(
                        readInt(
                                songDocument,
                                "tracklistPosition"
                        )
                )
                .artists(
                        mapArtists(
                                songDocument,
                                artistsByPath
                        )
                )
                .albumId(albumId)
                .albumName(
                        hasText(albumName)
                                ? albumName
                                : "Sconosciuto"
                )
                .build();
    }

    private List<String> resolveArtistNames(
            DocumentSnapshot songSnapshot
    ) throws ExecutionException, InterruptedException {

        Map<String, ArtistDTO> artistsByPath =
                fetchArtistsForSongs(
                        List.of(songSnapshot)
                );

        return mapArtists(
                songSnapshot,
                artistsByPath
        )
                .stream()
                .map(ArtistDTO::getName)
                .filter(this::hasText)
                .toList();
    }

    private Map<String, QueryDocumentSnapshot> indexAlbumsById(
            List<QueryDocumentSnapshot> albumDocuments
    ) {
        Map<String, QueryDocumentSnapshot> result =
                new HashMap<>();

        for (QueryDocumentSnapshot albumDocument : albumDocuments) {
            result.put(
                    albumDocument.getId(),
                    albumDocument
            );
        }

        return result;
    }

    private Map<String, DocumentReference> collectAlbumReferences(
            Collection<? extends DocumentSnapshot> songDocuments
    ) {
        Map<String, DocumentReference> result =
                new LinkedHashMap<>();

        for (DocumentSnapshot songDocument : songDocuments) {
            DocumentReference albumReference =
                    getAlbumReference(songDocument);

            if (albumReference == null) {
                continue;
            }

            result.putIfAbsent(
                    albumReference.getPath(),
                    albumReference
            );
        }

        return result;
    }

    private DocumentReference getAlbumReference(
            DocumentSnapshot songDocument
    ) {
        /*
         * Struttura:
         *
         * album/{albumId}/songs/{songId}
         */
        return songDocument
                .getReference()
                .getParent()
                .getParent();
    }

    /**
     * Recupera tutti gli artisti distinti necessari
     * alle canzoni con letture batch.
     * Evita una richiesta Firestore per ogni artista
     * di ogni canzone.
     */
    private Map<String, ArtistDTO> fetchArtistsForSongs(
            Collection<? extends DocumentSnapshot> songDocuments
    ) throws ExecutionException, InterruptedException {

        Map<String, DocumentReference> artistReferences =
                new LinkedHashMap<>();

        for (DocumentSnapshot songDocument : songDocuments) {
            for (
                    DocumentReference artistReference :
                    extractArtistReferences(songDocument)
            ) {
                artistReferences.putIfAbsent(
                        artistReference.getPath(),
                        artistReference
                );
            }
        }

        if (artistReferences.isEmpty()) {
            return Map.of();
        }

        Map<String, DocumentSnapshot> artistDocuments =
                fetchDocumentsByPath(
                        artistReferences.values()
                );

        Map<String, ArtistDTO> artistsByPath =
                new HashMap<>();

        for (
                Map.Entry<String, DocumentSnapshot> entry :
                artistDocuments.entrySet()
        ) {
            DocumentSnapshot artistDocument =
                    entry.getValue();

            artistsByPath.put(
                    entry.getKey(),
                    mapArtist(artistDocument)
            );
        }

        return artistsByPath;
    }

    private ArtistDTO mapArtist(
            DocumentSnapshot artistDocument
    ) {
        return ArtistDTO.builder()
                .id(artistDocument.getId())
                .name(
                        artistDocument.getString(
                                "name"
                        )
                )
                .bio(
                        artistDocument.getString(
                                "bio"
                        )
                )
                .profileURL(
                        artistDocument.getString(
                                "profileURL"
                        )
                )
                .build();
    }

    private List<ArtistDTO> mapArtists(
            DocumentSnapshot songDocument,
            Map<String, ArtistDTO> artistsByPath
    ) {
        List<DocumentReference> artistReferences =
                extractArtistReferences(
                        songDocument
                );

        if (artistReferences.isEmpty()) {
            return List.of();
        }

        List<ArtistDTO> artists =
                new ArrayList<>(
                        artistReferences.size()
                );

        for (DocumentReference artistReference : artistReferences) {
            ArtistDTO artist =
                    artistsByPath.get(
                            artistReference.getPath()
                    );

            if (artist != null) {
                artists.add(artist);
                continue;
            }

            /*
             * Mantiene almeno l'ID nel caso il documento artista
             * non esista o non sia stato recuperato.
             */
            artists.add(
                    ArtistDTO.builder()
                            .id(
                                    artistReference.getId()
                            )
                            .build()
            );
        }

        return artists;
    }

    /**
     * Supporta sia DocumentReference sia vecchi documenti
     * che contengono direttamente l'ID dell'artista.
     */
    private List<DocumentReference> extractArtistReferences(
            DocumentSnapshot songDocument
    ) {
        Object rawValue =
                songDocument.get("artist");

        if (!(rawValue instanceof List<?> rawArtists)) {
            return List.of();
        }

        List<DocumentReference> references =
                new ArrayList<>(
                        rawArtists.size()
                );

        for (Object rawArtist : rawArtists) {
            if (rawArtist instanceof DocumentReference reference) {
                references.add(reference);
                continue;
            }

            if (
                    rawArtist instanceof String artistId
                            && hasText(artistId)
            ) {
                references.add(
                        db.collection(ARTISTS_COLLECTION)
                                .document(artistId)
                );
            }
        }

        return references;
    }

    /**
     * Firestore getAll in batch.
     * La mappa è indicizzata con il path completo del documento,
     * non soltanto con l'ID.
     */
    private Map<String, DocumentSnapshot> fetchDocumentsByPath(
            Collection<DocumentReference> references
    ) throws ExecutionException, InterruptedException {

        if (references.isEmpty()) {
            return Map.of();
        }

        Map<String, DocumentReference> referencesByPath =
                new LinkedHashMap<>();

        for (DocumentReference reference : references) {
            referencesByPath.putIfAbsent(
                    reference.getPath(),
                    reference
            );
        }

        List<DocumentReference> uniqueReferences =
                new ArrayList<>(
                        referencesByPath.values()
                );

        Map<String, DocumentSnapshot> documentsByPath =
                new HashMap<>();

        for (
                int start = 0;
                start < uniqueReferences.size();
                start += BATCH_READ_SIZE
        ) {
            int end =
                    Math.min(
                            start + BATCH_READ_SIZE,
                            uniqueReferences.size()
                    );

            DocumentReference[] batch =
                    uniqueReferences
                            .subList(start, end)
                            .toArray(
                                    DocumentReference[]::new
                            );

            List<DocumentSnapshot> snapshots =
                    db.getAll(batch)
                            .get();

            for (DocumentSnapshot snapshot : snapshots) {
                if (!snapshot.exists()) {
                    continue;
                }

                documentsByPath.put(
                        snapshot
                                .getReference()
                                .getPath(),
                        snapshot
                );
            }
        }

        return documentsByPath;
    }

    private long readLong(
            DocumentSnapshot document,
            String fieldName
    ) {
        Object value =
                document.get(fieldName);

        if (value instanceof Number number) {
            return number.longValue();
        }

        if (value instanceof String stringValue) {
            try {
                return Long.parseLong(
                        stringValue
                );
            } catch (NumberFormatException ignored) {
                return 0L;
            }
        }

        return 0L;
    }

    private int readInt(
            DocumentSnapshot document,
            String fieldName
    ) {
        Object value =
                document.get(fieldName);

        if (value instanceof Number number) {
            return number.intValue();
        }

        if (value instanceof String stringValue) {
            try {
                return Integer.parseInt(
                        stringValue
                );
            } catch (NumberFormatException ignored) {
                return 0;
            }
        }

        return 0;
    }

    private boolean hasText(
            String value
    ) {
        return value != null
                && !value.isBlank();
    }

    private void checkAndCreateCertificationNews(
            DocumentSnapshot songSnapshot,
            long newCount
    ) {
        try {
            if (newCount < 50) {
                return;
            }

            String songName =
                    songSnapshot.getString("title");

            String artistNames =
                    resolveArtistNamesFormatted(
                            songSnapshot
                    );

            String message =
                    SongUtils.buildCertificationMessage(
                            songName,
                            artistNames,
                            newCount
                    );

            if (message == null) {
                return;
            }

            addNewsToFirestore(message);

            LOGGER.infof(
                    "News creata per la canzone %s al raggiungimento di %d ascolti",
                    songSnapshot.getId(),
                    newCount
            );

        } catch (Exception exception) {
            LOGGER.warnf(
                    exception,
                    "Errore durante la creazione della news per la canzone %s",
                    songSnapshot.getId()
            );
        }
    }

    private String resolveArtistNamesFormatted(
            DocumentSnapshot songSnapshot
    ) throws ExecutionException, InterruptedException {

        Map<String, ArtistDTO> artistsByPath =
                fetchArtistsForSongs(
                        List.of(songSnapshot)
                );

        List<String> names =
                mapArtists(
                        songSnapshot,
                        artistsByPath
                )
                        .stream()
                        .map(ArtistDTO::getName)
                        .filter(this::hasText)
                        .toList();

        if (names.isEmpty()) {
            return "Artista sconosciuto";
        }

        return SongUtils.formatArtistNames(names);
    }

    private void addNewsToFirestore(
            String message
    ) throws ExecutionException, InterruptedException {

        CollectionReference newsCollection =
                db.collection(NEWS_COLLECTION);

        Map<String, Object> newsData =
                new HashMap<>();

        newsData.put(
                "message",
                message
        );

        newsData.put(
                "createdAt",
                Instant.now().toString()
        );

        newsCollection
                .add(newsData)
                .get();
    }

    private record ListenIncrementPersistenceResult(
            DocumentSnapshot songSnapshot,
            long newCount
    ) {
    }
}