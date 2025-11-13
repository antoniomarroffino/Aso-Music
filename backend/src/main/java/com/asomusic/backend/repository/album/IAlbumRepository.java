package com.asomusic.backend.repository.album;

import com.asomusic.backend.model.dto.AlbumPreviewDTO;

import java.util.List;
import java.util.concurrent.ExecutionException;

public interface IAlbumRepository {

    List<AlbumPreviewDTO> fetchAllAlbumsPreview() throws ExecutionException, InterruptedException;

    AlbumPreviewDTO fetchAlbumPreviewById(String albumId) throws ExecutionException, InterruptedException;

    void updateAlbumAvailability(String albumId, boolean available) throws ExecutionException, InterruptedException;
}
