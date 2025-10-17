package com.asomusic.backend.repository;

import com.asomusic.backend.model.dto.AlbumDTO;

import java.util.List;
import java.util.concurrent.ExecutionException;

public interface ISongRepository {
    List<AlbumDTO> fetchAllAlbumsWithSongs() throws ExecutionException, InterruptedException;
}