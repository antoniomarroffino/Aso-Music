package com.asomusic.backend.service.album;

import com.asomusic.backend.model.dto.AlbumPreviewDTO;
import java.util.List;

public interface IAlbumService {
    List<AlbumPreviewDTO> fetchAllAlbumsPreview();
}
