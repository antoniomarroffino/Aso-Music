package com.asomusic.backend.service.song;

import com.asomusic.backend.model.dto.AlbumDTO;
import com.asomusic.backend.model.dto.NewsRecord;
import com.asomusic.backend.model.dto.SignedStorageUrl;
import com.asomusic.backend.model.dto.SongListenIncrementResult;
import com.asomusic.backend.model.dto.SongPreviewDTO;
import com.asomusic.backend.repository.news.INewsRepository;
import com.asomusic.backend.repository.song.ISongRepository;
import com.asomusic.backend.service.storage.IStorageUrlService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SongServiceTest {

    private SongService service;
    private FakeSongRepository songRepository;
    private FakeNewsRepository newsRepository;

    @BeforeEach
    void setUp() {
        service = new SongService();
        songRepository = new FakeSongRepository();
        newsRepository = new FakeNewsRepository();

        service.songRepository = songRepository;
        service.newsRepository = newsRepository;
        service.storageUrlService = new UnusedStorageUrlService();
    }

    @Test
    void returnsThePersistedCountForARegisteredListen() {
        songRepository.result = new SongListenIncrementResult(
                "song-1",
                "Brano",
                42,
                List.of("Artista"),
                true
        );

        SongListenIncrementResult result =
                service.incrementListenCount(
                        "album-1",
                        "song-1",
                        "queue-1:album-1:song-1:0"
                );

        assertEquals(42, result.listenCount());
        assertTrue(result.incremented());
        assertEquals(
                "queue-1:album-1:song-1:0",
                songRepository.receivedListenId
        );
    }

    @Test
    void duplicateListenDoesNotCreateCertificationNewsAgain() {
        songRepository.result = new SongListenIncrementResult(
                "song-1",
                "Brano",
                50,
                List.of("Artista"),
                false
        );

        SongListenIncrementResult result =
                service.incrementListenCount(
                        "album-1",
                        "song-1",
                        "same-listen-id"
                );

        assertFalse(result.incremented());
        assertEquals(0, newsRepository.createdNewsCount);
    }

    @Test
    void rejectsMissingListenId() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.incrementListenCount(
                        "album-1",
                        "song-1",
                        " "
                )
        );
    }

    private static final class FakeSongRepository
            implements ISongRepository {

        private SongListenIncrementResult result;
        private String receivedListenId;

        @Override
        public SongListenIncrementResult incrementListenCount(
                String albumId,
                String songId,
                String listenId
        ) {
            receivedListenId = listenId;
            return result;
        }

        @Override
        public List<AlbumDTO> fetchAllAlbumsWithSongs() {
            return List.of();
        }

        @Override
        public List<SongPreviewDTO> fetchSongsByAlbum(String albumId) {
            return List.of();
        }

        @Override
        public List<SongPreviewDTO> fetchSongsByArtist(String artistId) {
            return List.of();
        }

        @Override
        public Optional<String> fetchSongAudioStoragePath(
                String albumId,
                String songId
        ) {
            return Optional.empty();
        }
    }

    private static final class FakeNewsRepository
            implements INewsRepository {

        private int createdNewsCount;

        @Override
        public long createNews(String message) {
            createdNewsCount += 1;
            return createdNewsCount;
        }

        @Override
        public List<NewsRecord> fetchAllNews() {
            return List.of();
        }

        @Override
        public long countNewsAfter(long sequence) {
            return 0;
        }

        @Override
        public long getLatestSequence() {
            return 0;
        }
    }

    private static final class UnusedStorageUrlService
            implements IStorageUrlService {

        @Override
        public String getSignedUrl(String storagePath) {
            throw new UnsupportedOperationException();
        }

        @Override
        public SignedStorageUrl generateFreshSignedUrl(
                String storagePath
        ) {
            throw new UnsupportedOperationException();
        }
    }
}
