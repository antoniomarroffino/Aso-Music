package com.asomusic.backend.service;

import com.asomusic.backend.model.dto.AlbumDTO;
import com.asomusic.backend.repository.SongRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.concurrent.ExecutionException;

@ApplicationScoped
public class SongService implements ISongService {

    @Inject
    SongRepository songRepository;

    @Override
    public List<AlbumDTO> fetchAllSongs() {
        try {
            return songRepository.fetchAllAlbumsWithSongs();
        } catch (ExecutionException | InterruptedException e) {
            throw new RuntimeException("Errore durante il recupero dei brani", e);
        }
    }
}
