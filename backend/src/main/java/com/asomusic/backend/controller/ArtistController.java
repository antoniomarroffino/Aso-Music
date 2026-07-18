package com.asomusic.backend.controller;

import com.asomusic.backend.model.dto.ArtistDTO;
import com.asomusic.backend.model.dto.ArtistSongsDTO;
import com.asomusic.backend.model.dto.SongPreviewDTO;
import com.asomusic.backend.service.artist.IArtistService;
import com.asomusic.backend.service.song.ISongService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
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

    @Inject
    ISongService songService;

    @GET
    @Path("/all")
    @Operation(
            summary = "Recupera tutti gli artisti presenti nel database"
    )
    public Response fetchAllArtists() {
        List<ArtistDTO> artists =
                artistService.fetchAllArtists();

        return Response.ok(artists).build();
    }

    @GET
    @Path("/{id}/songs")
    @Operation(
            summary = "Recupera le canzoni di un artista",
            description = """
                    Restituisce le anteprime delle canzoni associate
                    all'artista, ordinate per numero di ascolti decrescente.
                    Non include gli URL di riproduzione.
                    """
    )
    public Response fetchArtistSongs(
            @Parameter(
                    description = "ID univoco dell'artista",
                    required = true
            )
            @PathParam("id")
            String artistId
    ) {
        ArtistDTO artist =
                artistService.fetchArtistById(artistId);

        if (artist == null) {
            return artistNotFoundResponse(artistId);
        }

        List<SongPreviewDTO> songs =
                songService.fetchSongsByArtist(artistId);

        ArtistSongsDTO response =
                ArtistSongsDTO.builder()
                        .artistId(artistId)
                        .total(songs.size())
                        .songs(songs)
                        .build();

        return Response.ok(response).build();
    }

    private Response artistNotFoundResponse(
            String artistId
    ) {
        return Response.status(
                        Response.Status.NOT_FOUND
                )
                .entity(
                        "Nessun artista trovato con ID: "
                                + artistId
                )
                .build();
    }
}