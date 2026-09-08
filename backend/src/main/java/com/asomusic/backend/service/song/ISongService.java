package com.asomusic.backend.service.song;

import com.asomusic.backend.model.dto.AlbumDTO;
import com.asomusic.backend.model.dto.SongPlaybackUrlDTO;
import com.asomusic.backend.model.dto.SongPreviewDTO;
import com.asomusic.backend.model.dto.SongListenIncrementResult;

import java.util.List;

public interface ISongService {

    List<AlbumDTO> fetchAllSongs();

    List<SongPreviewDTO> fetchSongsByAlbum(
            String albumId
    );

    List<SongPreviewDTO> fetchSongsByArtist(
            String artistId
    );

    SongPlaybackUrlDTO generatePlaybackUrl(
            String albumId,
            String songId
    );

    SongListenIncrementResult incrementListenCount(
            String albumId,
            String songId,
            String listenId
    );
}
