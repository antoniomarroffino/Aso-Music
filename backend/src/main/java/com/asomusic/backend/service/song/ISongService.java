package com.asomusic.backend.service.song;

import com.asomusic.backend.model.dto.AlbumDTO;

import java.util.List;

public interface ISongService {
    List<AlbumDTO> fetchAllSongs();
    void incrementListenCount(String albumId, String songId);

}
