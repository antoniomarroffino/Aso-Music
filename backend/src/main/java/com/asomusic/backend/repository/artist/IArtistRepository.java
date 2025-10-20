package com.asomusic.backend.repository.artist;

import com.asomusic.backend.model.dto.ArtistDTO;

import java.util.List;
import java.util.concurrent.ExecutionException;

public interface IArtistRepository {
    List<ArtistDTO> fetchAllArtists() throws ExecutionException, InterruptedException;
    ArtistDTO fetchArtistById(String artistId) throws ExecutionException, InterruptedException;
}

