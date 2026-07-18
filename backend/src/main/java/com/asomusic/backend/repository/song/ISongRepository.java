package com.asomusic.backend.repository.song;

import com.asomusic.backend.model.dto.AlbumDTO;
import com.asomusic.backend.model.dto.SongPreviewDTO;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

public interface ISongRepository {

    List<AlbumDTO> fetchAllAlbumsWithSongs()
            throws ExecutionException, InterruptedException;

    List<SongPreviewDTO> fetchSongsByAlbum(
            String albumId
    ) throws ExecutionException, InterruptedException;

    List<SongPreviewDTO> fetchSongsByArtist(
            String artistId
    ) throws ExecutionException, InterruptedException;

    Optional<String> fetchSongAudioStoragePath(
            String albumId,
            String songId
    ) throws ExecutionException, InterruptedException;

    void incrementListenCount(
            String albumId,
            String songId
    ) throws ExecutionException, InterruptedException;
}