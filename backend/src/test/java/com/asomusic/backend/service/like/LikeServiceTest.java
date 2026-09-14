package com.asomusic.backend.service.like;

import com.asomusic.backend.exceptions.LikeLimitReachedException;
import com.asomusic.backend.model.dto.LikeMutationResultDTO;
import com.asomusic.backend.model.dto.SignedStorageUrl;
import com.asomusic.backend.model.dto.SongLikesDTO;
import com.asomusic.backend.model.dto.UserLikedSongDTO;
import com.asomusic.backend.model.dto.UserLikesDTO;
import com.asomusic.backend.repository.like.ILikeRepository;
import com.asomusic.backend.service.storage.IStorageUrlService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LikeServiceTest {

    private LikeService service;
    private FakeLikeRepository repository;

    @BeforeEach
    void setUp() {
        service = new LikeService();
        repository = new FakeLikeRepository();
        service.likeRepository = repository;
        service.storageUrlService = new FakeStorageUrlService();
    }

    @Test
    void returnsBudgetFromThePersistedLikeList() {
        repository.userLikes = List.of(
                likedSong("song-1", "covers/one.jpg"),
                likedSong("song-2", null)
        );

        UserLikesDTO result =
                service.fetchUserLikes("user-1");

        assertEquals(LikeService.LIKE_LIMIT, result.getLimit());
        assertEquals(2, result.getUsed());
        assertEquals(8, result.getRemaining());
        assertEquals(
                "signed:covers/one.jpg",
                result.getLikes().getFirst().getCoverURL()
        );
    }

    @Test
    void delegatesTheAtomicLimitToTheRepository() {
        repository.mutationResult =
                LikeMutationResultDTO.builder()
                        .albumId("album-1")
                        .songId("song-1")
                        .liked(true)
                        .changed(true)
                        .likeCount(4)
                        .used(10)
                        .remaining(0)
                        .build();

        LikeMutationResultDTO result =
                service.addLike(
                        "user-1",
                        "album-1",
                        "song-1"
                );

        assertTrue(result.isLiked());
        assertEquals(
                LikeService.LIKE_LIMIT,
                repository.receivedLimit
        );
    }

    @Test
    void propagatesTheLikeLimitError() {
        repository.limitReached = true;

        assertThrows(
                LikeLimitReachedException.class,
                () -> service.addLike(
                        "user-1",
                        "album-1",
                        "song-1"
                )
        );
    }

    @Test
    void rejectsBlankIdentifiersBeforePersistence() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.removeLike(
                        "user-1",
                        " ",
                        "song-1"
                )
        );
    }

    private UserLikedSongDTO likedSong(
            String songId,
            String coverURL
    ) {
        return UserLikedSongDTO.builder()
                .albumId("album-1")
                .songId(songId)
                .title("Brano")
                .albumName("Album")
                .coverURL(coverURL)
                .artistNames(List.of("Artista"))
                .likedAt(OffsetDateTime.now())
                .build();
    }

    private static final class FakeLikeRepository
            implements ILikeRepository {

        private List<UserLikedSongDTO> userLikes = List.of();
        private LikeMutationResultDTO mutationResult;
        private boolean limitReached;
        private int receivedLimit;

        @Override
        public LikeMutationResultDTO addLike(
                String userId,
                String albumId,
                String songId,
                int likeLimit
        ) {
            receivedLimit = likeLimit;

            if (limitReached) {
                throw new LikeLimitReachedException("Limite raggiunto");
            }

            return mutationResult;
        }

        @Override
        public LikeMutationResultDTO removeLike(
                String userId,
                String albumId,
                String songId,
                int likeLimit
        ) {
            receivedLimit = likeLimit;
            return mutationResult;
        }

        @Override
        public SongLikesDTO fetchSongLikes(
                String userId,
                String albumId,
                String songId
        ) {
            return SongLikesDTO.builder()
                    .albumId(albumId)
                    .songId(songId)
                    .likeCount(0)
                    .likedByCurrentUser(false)
                    .users(List.of())
                    .build();
        }

        @Override
        public List<UserLikedSongDTO> fetchUserLikes(
                String userId
        ) {
            return userLikes;
        }
    }

    private static final class FakeStorageUrlService
            implements IStorageUrlService {

        @Override
        public String getSignedUrl(String storagePath) {
            return "signed:" + storagePath;
        }

        @Override
        public SignedStorageUrl generateFreshSignedUrl(
                String storagePath
        ) {
            throw new UnsupportedOperationException();
        }
    }
}
