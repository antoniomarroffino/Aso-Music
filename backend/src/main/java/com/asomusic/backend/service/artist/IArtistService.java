package com.asomusic.backend.service.artist;

import com.asomusic.backend.model.dto.ArtistDTO;

import java.util.List;

public interface IArtistService {
    List<ArtistDTO> fetchAllArtists();
    ArtistDTO fetchArtistById(String artistId);
}
