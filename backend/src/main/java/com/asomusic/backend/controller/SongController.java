package com.asomusic.backend.controller;

import com.asomusic.backend.service.ISongService;
import com.asomusic.backend.service.SongService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;

@Path("/api/songs")
public class SongController {

    @Inject
    ISongService songService;

    @GET
    public Response fetchAndLogSongs() {
        songService.fetchAllSongs();
        return Response.ok("Songs fetched. Check console.").build();
    }
}
