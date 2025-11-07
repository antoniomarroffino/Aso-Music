package com.asomusic.backend.service.song;

import com.asomusic.backend.model.dto.AlbumDTO;
import com.asomusic.backend.model.dto.SongDTO;

import java.util.List;

public interface ISongService {
    List<AlbumDTO> fetchAllSongs();
    List<SongDTO> fetchSongsByAlbum(String albumId);
    void incrementListenCount(String albumId, String songId);

}
