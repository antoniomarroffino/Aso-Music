package com.asomusic.backend.controller;

import com.asomusic.backend.model.dto.NewsDTO;
import com.asomusic.backend.service.news.INewsService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;

import java.util.List;

@Path("/news")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class NewsController {

    @Inject
    INewsService newsService;

    @GET
    @Path("/all")
    @Operation(summary = "Recupera tutte le news presenti nel database")
    public Response fetchAllNews() {
        List<NewsDTO> newsList = newsService.fetchAllNews();
        return Response.ok(newsList).build();
    }
}
