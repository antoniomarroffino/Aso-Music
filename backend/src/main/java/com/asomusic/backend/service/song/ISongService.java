package com.asomusic.backend.service.song;

import com.asomusic.backend.model.dto.AlbumDTO;
import com.asomusic.backend.model.dto.SongPlaybackUrlDTO;
import com.asomusic.backend.model.dto.SongPreviewDTO;

import java.util.List;

public interface ISongService {
    List<AlbumDTO> fetchAllSongs();
    List<SongPreviewDTO> fetchSongsByAlbum(String albumId);
    void incrementListenCount(String albumId, String songId);
    SongPlaybackUrlDTO generatePlaybackUrl(
            String albumId,
            String songId
    );
}
