package com.asomusic.backend.controller;

import com.asomusic.backend.model.dto.AlbumDTO;
import com.asomusic.backend.service.ISongService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/songs")
public class SongController {

    @Inject
    ISongService songService;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<AlbumDTO> fetchSongs() {
        return songService.fetchAllSongs();
    }
}
