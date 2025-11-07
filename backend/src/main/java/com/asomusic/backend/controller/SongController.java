package com.asomusic.backend.controller;

import com.asomusic.backend.model.dto.AlbumDTO;
import com.asomusic.backend.service.song.ISongService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
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

    @GET
    @Path("/album/{albumId}")
    @Operation(summary = "Recupera tutte le canzoni di un album specifico")
    public Response getSongsByAlbum(@PathParam("albumId") String albumId) {
        try {
            return Response.ok(songService.fetchSongsByAlbum(albumId)).build();
        } catch (Exception e) {
            e.printStackTrace();
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}")
                    .build();
        }
    }


    @POST
    @Path("/{albumId}/songs/{songId}/listen")
    @Operation(summary = "Incrementa il numero di ascolti per una canzone in un album")
    public Response incrementListenCount(
            @PathParam("albumId") String albumId,
            @PathParam("songId") String songId
    ) {
        try {
            songService.incrementListenCount(albumId, songId);
            return Response.ok("{\"message\": \"Listen count incremented\"}").build();
        } catch (Exception e) {
            e.printStackTrace();
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\": \"" + e.getMessage() + "\"}")
                    .build();
        }
    }
}
