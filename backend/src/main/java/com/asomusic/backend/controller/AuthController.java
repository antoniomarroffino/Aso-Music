package com.asomusic.backend.controller;

import com.asomusic.backend.model.dto.LoginRequestDTO;
import com.asomusic.backend.model.dto.LoginResponseDTO;
import com.asomusic.backend.model.dto.SignupRequestDTO;
import com.asomusic.backend.model.dto.SignupResponseDTO;
import com.asomusic.backend.service.auth.IAuthService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthController {

    @Inject
    IAuthService authService;

    @POST
    @Path("/login")
    public Response login(LoginRequestDTO request) {
        try {
            LoginResponseDTO response = authService.login(request);
            return Response.ok(response).build();
        } catch (RuntimeException e) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(e.getMessage())
                    .build();
        }
    }

    @POST
    @Path("/signup")
    public Response signup(SignupRequestDTO request) {
        try {
            SignupResponseDTO response = authService.signup(request);
            return Response.ok(response).build();
        } catch (RuntimeException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(e.getMessage())
                    .build();
        }
    }
}
