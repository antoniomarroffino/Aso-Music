package com.asomusic.backend.controller;

import com.asomusic.backend.exceptions.InvalidAuthenticationTokenException;
import com.asomusic.backend.exceptions.UserProfileNotFoundException;
import com.asomusic.backend.model.dto.ErrorResponseDTO;
import com.asomusic.backend.model.dto.LoginRequestDTO;
import com.asomusic.backend.model.dto.LoginResponseDTO;
import com.asomusic.backend.model.dto.SignupRequestDTO;
import com.asomusic.backend.model.dto.SignupResponseDTO;
import com.asomusic.backend.service.auth.IAuthService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthController {

    private static final Logger LOGGER =
            Logger.getLogger(AuthController.class);

    @Inject
    IAuthService authService;

    @POST
    @Path("/login")
    public Response login(
            @NotNull(message = "La richiesta di login è obbligatoria")
            @Valid
            LoginRequestDTO request
    ) {
        try {
            LoginResponseDTO response =
                    authService.login(request);

            return Response.ok(response)
                    .build();

        } catch (
                InvalidAuthenticationTokenException exception
        ) {
            return Response
                    .status(Response.Status.UNAUTHORIZED)
                    .entity(
                            ErrorResponseDTO.builder()
                                    .code("INVALID_ID_TOKEN")
                                    .message(
                                            exception.getMessage()
                                    )
                                    .build()
                    )
                    .build();

        } catch (
                UserProfileNotFoundException exception
        ) {
            return Response
                    .status(Response.Status.FORBIDDEN)
                    .entity(
                            ErrorResponseDTO.builder()
                                    .code(
                                            "USER_PROFILE_NOT_FOUND"
                                    )
                                    .message(
                                            exception.getMessage()
                                    )
                                    .build()
                    )
                    .build();

        } catch (Exception exception) {
            LOGGER.error(
                    "Errore interno durante il login",
                    exception
            );

            return Response
                    .status(
                            Response.Status.INTERNAL_SERVER_ERROR
                    )
                    .entity(
                            ErrorResponseDTO.builder()
                                    .code("LOGIN_INTERNAL_ERROR")
                                    .message(
                                            "Errore interno durante "
                                                    + "il login"
                                    )
                                    .build()
                    )
                    .build();
        }
    }

    @POST
    @Path("/signup")
    public Response signup(
            SignupRequestDTO request
    ) {
        try {
            SignupResponseDTO response =
                    authService.signup(request);

            return Response.ok(response)
                    .build();

        } catch (RuntimeException exception) {
            return Response
                    .status(Response.Status.BAD_REQUEST)
                    .entity(exception.getMessage())
                    .build();
        }
    }
}