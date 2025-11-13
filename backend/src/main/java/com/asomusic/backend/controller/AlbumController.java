package com.asomusic.backend.controller;

import com.asomusic.backend.model.dto.AlbumPreviewDTO;
import com.asomusic.backend.service.album.IAlbumService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/albums")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AlbumController {

    @Inject
    IAlbumService albumService;

    @GET
    @Path("/all")
    public Response fetchAllAlbums() {
        List<AlbumPreviewDTO> albums = albumService.fetchAllAlbumsPreview();
        return Response.ok(albums).build();
    }

    @POST
    @Path("/{albumId}/unlock")
    public Response unlockAlbum(@PathParam("albumId") String albumId) {
        AlbumPreviewDTO updated = albumService.unlockAlbum(albumId);
        return Response.ok(updated).build();
    }
}
