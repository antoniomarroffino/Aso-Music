package com.asomusic.backend.repository.like;

import com.asomusic.backend.exceptions.LikeLimitReachedException;
import com.asomusic.backend.exceptions.SongNotFoundException;
import com.asomusic.backend.exceptions.UserProfileNotFoundException;
import com.asomusic.backend.model.dto.LikeMutationResultDTO;
import com.asomusic.backend.model.dto.LikeUserDTO;
import com.asomusic.backend.model.dto.SongLikesDTO;
import com.asomusic.backend.model.dto.UserLikedSongDTO;
import com.asomusic.backend.util.SongUtils;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.enterprise.context.ApplicationScoped;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@ApplicationScoped
public class LikeRepository implements ILikeRepository {

    private static final String USERS_COLLECTION = "users";
    private static final String ALBUM_COLLECTION = "album";
    private static final String SONGS_COLLECTION = "songs";
    private static final String LIKES_COLLECTION = "likes";
    private static final String ARTISTS_COLLECTION = "artists";
    private static final String USER_LIKES_USED_FIELD = "likesUsed";
    private static final String SONG_LIKE_COUNT_FIELD = "likeCount";

    private final Firestore db =
            FirestoreClient.getFirestore();

    @Override
    public LikeMutationResultDTO addLike(
            String userId,
            String albumId,
            String songId,
            int likeLimit
    ) throws ExecutionException, InterruptedException {
        try {
            return db.runTransaction(transaction -> {
                        DocumentReference userReference =
                                userReference(userId);
                        DocumentReference songReference =
                                songReference(albumId, songId);
                        DocumentReference songLikeReference =
                                songReference
                                        .collection(LIKES_COLLECTION)
                                        .document(userId);
                        DocumentReference userLikeReference =
                                userReference
                                        .collection(LIKES_COLLECTION)
                                        .document(likeDocumentId(albumId, songId));

                        DocumentSnapshot userSnapshot =
                                transaction.get(userReference).get();
                        DocumentSnapshot songSnapshot =
                                transaction.get(songReference).get();
                        DocumentSnapshot songLikeSnapshot =
                                transaction.get(songLikeReference).get();
                        DocumentSnapshot userLikeSnapshot =
                                transaction.get(userLikeReference).get();

                        requireExistingUser(userSnapshot, userId);
                        requireExistingSong(songSnapshot, albumId, songId);

                        long userLikesUsed =
                                readLong(userSnapshot, USER_LIKES_USED_FIELD);
                        long songLikeCount =
                                readLong(songSnapshot, SONG_LIKE_COUNT_FIELD);

                        if (songLikeSnapshot.exists()) {
                            return mutationResult(
                                    albumId,
                                    songId,
                                    true,
                                    false,
                                    songLikeCount,
                                    userLikesUsed,
                                    likeLimit
                            );
                        }

                        if (userLikesUsed >= likeLimit) {
                            throw new LikeLimitReachedException(
                                    "Hai già utilizzato tutti i "
                                            + likeLimit
                                            + " like disponibili"
                            );
                        }

                        DocumentReference albumReference =
                                db.collection(ALBUM_COLLECTION)
                                        .document(albumId);
                        DocumentSnapshot albumSnapshot =
                                transaction.get(albumReference).get();

                        List<String> artistNames =
                                readArtistNames(transaction, songSnapshot);

                        long newUserLikesUsed =
                                Math.addExact(userLikesUsed, 1L);
                        long newSongLikeCount =
                                Math.addExact(songLikeCount, 1L);
                        Timestamp likedAt = Timestamp.now();

                        transaction.update(
                                userReference,
                                USER_LIKES_USED_FIELD,
                                newUserLikesUsed
                        );
                        transaction.update(
                                songReference,
                                SONG_LIKE_COUNT_FIELD,
                                newSongLikeCount
                        );
                        transaction.create(
                                songLikeReference,
                                buildSongLikeData(userSnapshot, likedAt)
                        );
                        transaction.create(
                                userLikeReference,
                                buildUserLikeData(
                                        albumId,
                                        songId,
                                        songSnapshot,
                                        albumSnapshot,
                                        artistNames,
                                        likedAt
                                )
                        );

                        return mutationResult(
                                albumId,
                                songId,
                                true,
                                true,
                                newSongLikeCount,
                                newUserLikesUsed,
                                likeLimit
                        );
                    })
                    .get();
        } catch (ExecutionException exception) {
            throwKnownCause(exception);
            throw exception;
        }
    }

    @Override
    public LikeMutationResultDTO removeLike(
            String userId,
            String albumId,
            String songId,
            int likeLimit
    ) throws ExecutionException, InterruptedException {
        try {
            return db.runTransaction(transaction -> {
                        DocumentReference userReference =
                                userReference(userId);
                        DocumentReference songReference =
                                songReference(albumId, songId);
                        DocumentReference songLikeReference =
                                songReference
                                        .collection(LIKES_COLLECTION)
                                        .document(userId);
                        DocumentReference userLikeReference =
                                userReference
                                        .collection(LIKES_COLLECTION)
                                        .document(likeDocumentId(albumId, songId));

                        DocumentSnapshot userSnapshot =
                                transaction.get(userReference).get();
                        DocumentSnapshot songSnapshot =
                                transaction.get(songReference).get();
                        DocumentSnapshot songLikeSnapshot =
                                transaction.get(songLikeReference).get();
                        DocumentSnapshot userLikeSnapshot =
                                transaction.get(userLikeReference).get();

                        requireExistingUser(userSnapshot, userId);
                        requireExistingSong(songSnapshot, albumId, songId);

                        long userLikesUsed =
                                readLong(userSnapshot, USER_LIKES_USED_FIELD);
                        long songLikeCount =
                                readLong(songSnapshot, SONG_LIKE_COUNT_FIELD);

                        if (!songLikeSnapshot.exists()) {
                            return mutationResult(
                                    albumId,
                                    songId,
                                    false,
                                    false,
                                    songLikeCount,
                                    userLikesUsed,
                                    likeLimit
                            );
                        }

                        long newUserLikesUsed =
                                Math.max(userLikesUsed - 1L, 0L);
                        long newSongLikeCount =
                                Math.max(songLikeCount - 1L, 0L);

                        transaction.update(
                                userReference,
                                USER_LIKES_USED_FIELD,
                                newUserLikesUsed
                        );
                        transaction.update(
                                songReference,
                                SONG_LIKE_COUNT_FIELD,
                                newSongLikeCount
                        );
                        transaction.delete(songLikeReference);

                        if (userLikeSnapshot.exists()) {
                            transaction.delete(userLikeReference);
                        }

                        return mutationResult(
                                albumId,
                                songId,
                                false,
                                true,
                                newSongLikeCount,
                                newUserLikesUsed,
                                likeLimit
                        );
                    })
                    .get();
        } catch (ExecutionException exception) {
            throwKnownCause(exception);
            throw exception;
        }
    }

    @Override
    public SongLikesDTO fetchSongLikes(
            String userId,
            String albumId,
            String songId
    ) throws ExecutionException, InterruptedException {
        DocumentReference songReference =
                songReference(albumId, songId);

        DocumentSnapshot songSnapshot =
                songReference.get().get();
        requireExistingSong(songSnapshot, albumId, songId);

        QuerySnapshot likesSnapshot =
                songReference
                        .collection(LIKES_COLLECTION)
                        .orderBy("likedAt", Query.Direction.DESCENDING)
                        .get()
                        .get();

        List<LikeUserDTO> users =
                likesSnapshot.getDocuments()
                        .stream()
                        .map(this::mapLikeUser)
                        .toList();

        boolean likedByCurrentUser =
                likesSnapshot.getDocuments()
                        .stream()
                        .anyMatch(document ->
                                document.getId().equals(userId)
                        );

        return SongLikesDTO.builder()
                .albumId(albumId)
                .songId(songId)
                .likeCount(users.size())
                .likedByCurrentUser(likedByCurrentUser)
                .users(users)
                .build();
    }

    @Override
    public List<UserLikedSongDTO> fetchUserLikes(
            String userId
    ) throws ExecutionException, InterruptedException {
        QuerySnapshot likesSnapshot =
                userReference(userId)
                        .collection(LIKES_COLLECTION)
                        .orderBy("likedAt", Query.Direction.DESCENDING)
                        .get()
                        .get();

        return likesSnapshot.getDocuments()
                .stream()
                .map(this::mapUserLikedSong)
                .toList();
    }

    private DocumentReference userReference(String userId) {
        return db.collection(USERS_COLLECTION).document(userId);
    }

    private DocumentReference songReference(
            String albumId,
            String songId
    ) {
        return db.collection(ALBUM_COLLECTION)
                .document(albumId)
                .collection(SONGS_COLLECTION)
                .document(songId);
    }

    private String likeDocumentId(
            String albumId,
            String songId
    ) {
        try {
            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");
            String identity = albumId + "\u0000" + songId;

            return HexFormat.of().formatHex(
                    digest.digest(
                            identity.getBytes(StandardCharsets.UTF_8)
                    )
            );
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "SHA-256 non disponibile",
                    exception
            );
        }
    }

    private List<String> readArtistNames(
            com.google.cloud.firestore.Transaction transaction,
            DocumentSnapshot songSnapshot
    ) throws ExecutionException, InterruptedException {
        Object rawArtists = songSnapshot.get("artist");

        if (!(rawArtists instanceof List<?> artists)) {
            return List.of();
        }

        List<String> names = new ArrayList<>();

        for (Object rawArtist : artists) {
            DocumentReference artistReference = null;

            if (rawArtist instanceof DocumentReference reference) {
                artistReference = reference;
            } else if (rawArtist instanceof String artistId
                    && !artistId.isBlank()) {
                artistReference =
                        db.collection(ARTISTS_COLLECTION)
                                .document(artistId);
            }

            if (artistReference == null) {
                continue;
            }

            DocumentSnapshot artistSnapshot =
                    transaction.get(artistReference).get();
            String name = artistSnapshot.getString("name");

            if (name != null && !name.isBlank()) {
                names.add(name);
            }
        }

        return names;
    }

    private Map<String, Object> buildSongLikeData(
            DocumentSnapshot userSnapshot,
            Timestamp likedAt
    ) {
        Map<String, Object> data = new HashMap<>();

        data.put("userId", userSnapshot.getId());
        putIfPresent(data, "username", userSnapshot.getString("username"));
        putIfPresent(data, "firstName", userSnapshot.getString("firstName"));
        putIfPresent(data, "lastName", userSnapshot.getString("lastName"));
        data.put("likedAt", likedAt);

        return data;
    }

    private Map<String, Object> buildUserLikeData(
            String albumId,
            String songId,
            DocumentSnapshot songSnapshot,
            DocumentSnapshot albumSnapshot,
            List<String> artistNames,
            Timestamp likedAt
    ) {
        Map<String, Object> data = new HashMap<>();
        String songCoverURL = songSnapshot.getString("coverURL");
        String albumCoverURL = albumSnapshot.exists()
                ? albumSnapshot.getString("coverURL")
                : null;

        data.put("albumId", albumId);
        data.put("songId", songId);
        putIfPresent(data, "title", songSnapshot.getString("title"));
        putIfPresent(
                data,
                "albumName",
                albumSnapshot.exists()
                        ? albumSnapshot.getString("name")
                        : null
        );
        putIfPresent(
                data,
                "coverURL",
                hasText(songCoverURL) ? songCoverURL : albumCoverURL
        );
        data.put("artistNames", artistNames);
        data.put("likedAt", likedAt);

        return data;
    }

    private LikeUserDTO mapLikeUser(
            QueryDocumentSnapshot document
    ) {
        return LikeUserDTO.builder()
                .uid(document.getId())
                .username(document.getString("username"))
                .firstName(document.getString("firstName"))
                .lastName(document.getString("lastName"))
                .build();
    }

    private UserLikedSongDTO mapUserLikedSong(
            QueryDocumentSnapshot document
    ) {
        List<String> artistNames = new ArrayList<>();
        Object rawArtistNames = document.get("artistNames");

        if (rawArtistNames instanceof List<?> rawNames) {
            rawNames.stream()
                    .filter(String.class::isInstance)
                    .map(String.class::cast)
                    .filter(this::hasText)
                    .forEach(artistNames::add);
        }

        return UserLikedSongDTO.builder()
                .albumId(document.getString("albumId"))
                .songId(document.getString("songId"))
                .title(document.getString("title"))
                .albumName(document.getString("albumName"))
                .coverURL(document.getString("coverURL"))
                .artistNames(artistNames)
                .likedAt(
                        SongUtils.toOffsetDateTime(
                                document.getTimestamp("likedAt")
                        )
                )
                .build();
    }

    private LikeMutationResultDTO mutationResult(
            String albumId,
            String songId,
            boolean liked,
            boolean changed,
            long likeCount,
            long used,
            int limit
    ) {
        int safeUsed = (int) Math.min(
                Math.max(used, 0L),
                Integer.MAX_VALUE
        );

        return LikeMutationResultDTO.builder()
                .albumId(albumId)
                .songId(songId)
                .liked(liked)
                .changed(changed)
                .likeCount(Math.max(likeCount, 0L))
                .used(safeUsed)
                .remaining(Math.max(limit - safeUsed, 0))
                .build();
    }

    private void requireExistingUser(
            DocumentSnapshot userSnapshot,
            String userId
    ) {
        if (!userSnapshot.exists()) {
            throw new UserProfileNotFoundException(
                    "Profilo utente non trovato: " + userId
            );
        }
    }

    private void requireExistingSong(
            DocumentSnapshot songSnapshot,
            String albumId,
            String songId
    ) {
        if (!songSnapshot.exists()) {
            throw new SongNotFoundException(
                    "Canzone non trovata: "
                            + songId
                            + " (albumId="
                            + albumId
                            + ")"
            );
        }
    }

    private long readLong(
            DocumentSnapshot document,
            String fieldName
    ) {
        Object value = document.get(fieldName);

        if (value instanceof Number number) {
            return Math.max(number.longValue(), 0L);
        }

        return 0L;
    }

    private void putIfPresent(
            Map<String, Object> data,
            String key,
            String value
    ) {
        if (hasText(value)) {
            data.put(key, value);
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private void throwKnownCause(
            ExecutionException exception
    ) {
        Throwable cause = exception.getCause();

        while (cause != null && cause != exception) {
            if (cause instanceof LikeLimitReachedException known) {
                throw known;
            }

            if (cause instanceof SongNotFoundException known) {
                throw known;
            }

            if (cause instanceof UserProfileNotFoundException known) {
                throw known;
            }

            cause = cause.getCause();
        }
    }
}
