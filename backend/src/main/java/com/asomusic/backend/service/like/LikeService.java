package com.asomusic.backend.service.like;

import com.asomusic.backend.model.dto.LikeMutationResultDTO;
import com.asomusic.backend.model.dto.SongLikesDTO;
import com.asomusic.backend.model.dto.UserLikedSongDTO;
import com.asomusic.backend.model.dto.UserLikesDTO;
import com.asomusic.backend.repository.like.ILikeRepository;
import com.asomusic.backend.service.storage.IStorageUrlService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.quarkus.cache.CacheInvalidateAll;

import java.util.List;
import java.util.concurrent.ExecutionException;

@ApplicationScoped
public class LikeService implements ILikeService {

    public static final int LIKE_LIMIT = 10;

    @Inject
    ILikeRepository likeRepository;

    @Inject
    IStorageUrlService storageUrlService;

    @Override
    public UserLikesDTO fetchUserLikes(String userId) {
        validateUserId(userId);

        List<UserLikedSongDTO> likes =
                executeRepositoryOperation(
                        "Errore durante il recupero dei like dell'utente",
                        () -> likeRepository.fetchUserLikes(userId)
                )
                        .stream()
                        .map(this::resolveCoverUrl)
                        .toList();

        int used = likes.size();

        return UserLikesDTO.builder()
                .limit(LIKE_LIMIT)
                .used(used)
                .remaining(Math.max(LIKE_LIMIT - used, 0))
                .likes(likes)
                .build();
    }

    @Override
    public SongLikesDTO fetchSongLikes(
            String userId,
            String albumId,
            String songId
    ) {
        validateIdentifiers(userId, albumId, songId);

        return executeRepositoryOperation(
                "Errore durante il recupero dei like del brano",
                () -> likeRepository.fetchSongLikes(
                        userId,
                        albumId,
                        songId
                )
        );
    }

    @Override
    @CacheInvalidateAll(cacheName = "song-catalog")
    @CacheInvalidateAll(cacheName = "album-songs")
    @CacheInvalidateAll(cacheName = "artist-songs")
    public LikeMutationResultDTO addLike(
            String userId,
            String albumId,
            String songId
    ) {
        validateIdentifiers(userId, albumId, songId);

        return executeRepositoryOperation(
                "Errore durante l'aggiunta del like",
                () -> likeRepository.addLike(
                        userId,
                        albumId,
                        songId,
                        LIKE_LIMIT
                )
        );
    }

    @Override
    @CacheInvalidateAll(cacheName = "song-catalog")
    @CacheInvalidateAll(cacheName = "album-songs")
    @CacheInvalidateAll(cacheName = "artist-songs")
    public LikeMutationResultDTO removeLike(
            String userId,
            String albumId,
            String songId
    ) {
        validateIdentifiers(userId, albumId, songId);

        return executeRepositoryOperation(
                "Errore durante la rimozione del like",
                () -> likeRepository.removeLike(
                        userId,
                        albumId,
                        songId,
                        LIKE_LIMIT
                )
        );
    }

    private UserLikedSongDTO resolveCoverUrl(
            UserLikedSongDTO like
    ) {
        String coverPath = like.getCoverURL();
        String resolvedCoverUrl =
                coverPath == null || coverPath.isBlank()
                        ? null
                        : storageUrlService.getSignedUrl(coverPath);

        return UserLikedSongDTO.builder()
                .albumId(like.getAlbumId())
                .songId(like.getSongId())
                .title(like.getTitle())
                .albumName(like.getAlbumName())
                .coverURL(resolvedCoverUrl)
                .artistNames(like.getArtistNames())
                .likedAt(like.getLikedAt())
                .build();
    }

    private void validateIdentifiers(
            String userId,
            String albumId,
            String songId
    ) {
        validateUserId(userId);
        validateIdentifier(albumId, "Album ID");
        validateIdentifier(songId, "Song ID");
    }

    private void validateUserId(String userId) {
        validateIdentifier(userId, "User ID");
    }

    private void validateIdentifier(
            String value,
            String label
    ) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(
                    label + " obbligatorio"
            );
        }

        if (value.length() > 250) {
            throw new IllegalArgumentException(
                    label + " troppo lungo"
            );
        }
    }

    private <T> T executeRepositoryOperation(
            String errorMessage,
            RepositorySupplier<T> operation
    ) {
        try {
            return operation.execute();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();

            throw new IllegalStateException(
                    errorMessage + ": thread interrotto",
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
                throws ExecutionException, InterruptedException;
    }
}
