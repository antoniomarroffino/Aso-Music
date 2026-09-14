package com.asomusic.backend.controller;

import com.asomusic.backend.exceptions.LikeLimitReachedException;
import com.asomusic.backend.exceptions.SongNotFoundException;
import com.asomusic.backend.exceptions.UserProfileNotFoundException;
import com.asomusic.backend.model.dto.ErrorResponseDTO;
import com.asomusic.backend.security.FirebaseAuthenticated;
import com.asomusic.backend.security.ICurrentUserService;
import com.asomusic.backend.service.like.ILikeService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.jboss.logging.Logger;

@FirebaseAuthenticated
@Path("/likes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LikeController {

    private static final Logger LOGGER =
            Logger.getLogger(LikeController.class);

    @Inject
    ILikeService likeService;

    @Inject
    ICurrentUserService currentUserService;

    @GET
    @Path("/me")
    @Operation(summary = "Recupera i like lasciati dall'utente")
    public Response fetchUserLikes() {
        return execute(() ->
                likeService.fetchUserLikes(currentUserId())
        );
    }

    @GET
    @Path("/songs/{albumId}/{songId}")
    @Operation(summary = "Recupera numero e utenti dei like di un brano")
    public Response fetchSongLikes(
            @PathParam("albumId") String albumId,
            @PathParam("songId") String songId
    ) {
        return execute(() ->
                likeService.fetchSongLikes(
                        currentUserId(),
                        albumId,
                        songId
                )
        );
    }

    @PUT
    @Path("/songs/{albumId}/{songId}")
    @Operation(summary = "Aggiunge un like al brano")
    public Response addLike(
            @PathParam("albumId") String albumId,
            @PathParam("songId") String songId
    ) {
        return execute(() ->
                likeService.addLike(
                        currentUserId(),
                        albumId,
                        songId
                )
        );
    }

    @DELETE
    @Path("/songs/{albumId}/{songId}")
    @Operation(summary = "Rimuove il like dal brano")
    public Response removeLike(
            @PathParam("albumId") String albumId,
            @PathParam("songId") String songId
    ) {
        return execute(() ->
                likeService.removeLike(
                        currentUserId(),
                        albumId,
                        songId
                )
        );
    }

    private String currentUserId() {
        return currentUserService.getCurrentUserId();
    }

    private Response execute(LikeOperation operation) {
        try {
            return Response.ok(operation.execute()).build();
        } catch (LikeLimitReachedException exception) {
            return error(
                    Response.Status.CONFLICT,
                    "LIKE_LIMIT_REACHED",
                    exception.getMessage()
            );
        } catch (SongNotFoundException exception) {
            return error(
                    Response.Status.NOT_FOUND,
                    "SONG_NOT_FOUND",
                    exception.getMessage()
            );
        } catch (UserProfileNotFoundException exception) {
            return error(
                    Response.Status.FORBIDDEN,
                    "USER_PROFILE_NOT_FOUND",
                    exception.getMessage()
            );
        } catch (IllegalArgumentException exception) {
            return error(
                    Response.Status.BAD_REQUEST,
                    "INVALID_LIKE_REQUEST",
                    exception.getMessage()
            );
        } catch (RuntimeException exception) {
            LOGGER.error("Errore nella gestione dei like", exception);

            return error(
                    Response.Status.INTERNAL_SERVER_ERROR,
                    "LIKE_INTERNAL_ERROR",
                    "Errore interno durante la gestione dei like"
            );
        }
    }

    private Response error(
            Response.Status status,
            String code,
            String message
    ) {
        return Response.status(status)
                .entity(
                        ErrorResponseDTO.builder()
                                .code(code)
                                .message(message)
                                .build()
                )
                .build();
    }

    @FunctionalInterface
    private interface LikeOperation {
        Object execute();
    }
}
