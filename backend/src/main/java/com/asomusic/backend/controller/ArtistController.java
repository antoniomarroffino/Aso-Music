package com.asomusic.backend.controller;

import com.asomusic.backend.model.dto.ArtistDTO;
import com.asomusic.backend.service.artist.IArtistService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;

import java.util.List;

@Path("/artists")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ArtistController {

    @Inject
    IArtistService artistService;

    @GET
    @Path("/all")
    @Operation(summary = "Recupera tutti gli artisti presenti nel database")
    public Response fetchAllArtists() {
        List<ArtistDTO> artists = artistService.fetchAllArtists();
        return Response.ok(artists).build();
    }

    @GET
    @Path("/{id}")
    @Operation(summary = "Recupera un artista specifico tramite il suo ID")
    public Response fetchArtistById(
            @Parameter(description = "ID univoco dell'artista") @PathParam("id") String artistId
    ) {
        ArtistDTO artist = artistService.fetchArtistById(artistId);

        if (artist == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("❌ Nessun artista trovato con ID: " + artistId)
                    .build();
        }

        return Response.ok(artist).build();
    }
}
