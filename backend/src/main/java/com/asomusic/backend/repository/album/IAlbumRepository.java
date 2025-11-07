package com.asomusic.backend.repository.album;

import com.asomusic.backend.model.dto.AlbumPreviewDTO;
import java.util.List;
import java.util.concurrent.ExecutionException;

public interface IAlbumRepository {
    List<AlbumPreviewDTO> fetchAllAlbumsPreview() throws ExecutionException, InterruptedException;
}
