package com.asomusic.backend.controller;

import com.asomusic.backend.model.dto.MarkNewsSeenRequestDTO;
import com.asomusic.backend.model.dto.NewsFeedDTO;
import com.asomusic.backend.model.dto.UnreadNewsCountDTO;
import com.asomusic.backend.security.FirebaseAuthenticated;
import com.asomusic.backend.security.ICurrentUserService;
import com.asomusic.backend.service.news.INewsService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;

@FirebaseAuthenticated
@Path("/news")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class NewsController {

    @Inject
    INewsService newsService;

    @Inject
    ICurrentUserService currentUserService;

    @GET
    @Path("/all")
    @Operation(
            summary = "Recupera tutte le news con lo stato di lettura"
    )
    public Response fetchAllNews() {
        String userId =
                currentUserService.getCurrentUserId();

        NewsFeedDTO response =
                newsService.fetchAllNews(userId);

        return Response.ok(response)
                .build();
    }

    @GET
    @Path("/unread-count")
    @Operation(
            summary = "Recupera il numero di news non lette"
    )
    public Response fetchUnreadCount() {
        String userId =
                currentUserService.getCurrentUserId();

        UnreadNewsCountDTO response =
                newsService.fetchUnreadCount(userId);

        return Response.ok(response)
                .build();
    }

    @POST
    @Path("/mark-seen")
    @Operation(
            summary = "Marca come viste le news fino al cursore indicato"
    )
    public Response markSeen(
            @NotNull(
                    message = "La richiesta è obbligatoria"
            )
            @Valid
            MarkNewsSeenRequestDTO request
    ) {
        String userId =
                currentUserService.getCurrentUserId();

        UnreadNewsCountDTO response =
                newsService.markSeen(
                        userId,
                        request
                );

        return Response.ok(response)
                .build();
    }
}