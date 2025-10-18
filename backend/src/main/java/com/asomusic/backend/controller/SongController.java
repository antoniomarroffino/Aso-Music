package com.asomusic.backend.controller;

import com.asomusic.backend.model.dto.AlbumDTO;
import com.asomusic.backend.service.ISongService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;

import java.util.List;

@Path("/songs")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SongController {

    @Inject
    ISongService songService;

    @GET
    @Path("/all")
    @Operation(summary = "Recupera tutti gli album con i rispettivi brani")
    public Response fetchAllSongs() {
        List<AlbumDTO> albums = songService.fetchAllSongs();
        return Response.ok(albums).build();
    }
}
