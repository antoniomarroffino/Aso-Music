package com.asomusic.backend.security;

import com.asomusic.backend.model.dto.ErrorResponseDTO;
import com.asomusic.backend.repository.auth.IAuthRepository;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@Provider
@ApplicationScoped
@FirebaseAuthenticated
@Priority(Priorities.AUTHENTICATION)
public class FirebaseAuthenticationFilter
        implements ContainerRequestFilter {

    private static final Logger LOGGER =
            Logger.getLogger(
                    FirebaseAuthenticationFilter.class
            );

    private static final String BEARER_SCHEME = "Bearer";

    private static final String AUTHENTICATION_CHALLENGE =
            "Bearer realm=\"asomusic-api\"";

    @Inject
    IAuthRepository authRepository;

    @Inject
    CurrentUserService currentUserService;

    /**
     * Se true, Firebase controlla anche se il token
     * è stato revocato.
     *
     * Questo comporta una richiesta aggiuntiva al backend
     * Firebase Authentication per ogni chiamata protetta.
     */
    @ConfigProperty(
            name = "firebase.auth.check-revoked-tokens",
            defaultValue = "false"
    )
    boolean checkRevokedTokens;

    @Override
    public void filter(
            ContainerRequestContext requestContext
    ) {
        String authorizationHeader =
                requestContext.getHeaderString(
                        HttpHeaders.AUTHORIZATION
                );

        if (
                authorizationHeader == null
                        || authorizationHeader.isBlank()
        ) {
            abortUnauthorized(
                    requestContext,
                    "AUTHORIZATION_HEADER_MISSING",
                    "Header Authorization mancante"
            );

            return;
        }

        String idToken =
                extractBearerToken(authorizationHeader);

        if (idToken == null) {
            abortUnauthorized(
                    requestContext,
                    "INVALID_AUTHORIZATION_HEADER",
                    "Header Authorization non valido"
            );

            return;
        }

        try {
            FirebaseToken decodedToken =
                    authRepository.verifyToken(
                            idToken,
                            checkRevokedTokens
                    );

            AuthenticatedUser authenticatedUser =
                    new AuthenticatedUser(
                            decodedToken.getUid(),
                            decodedToken.getEmail(),
                            decodedToken.isEmailVerified()
                    );

            currentUserService.initialize(
                    authenticatedUser
            );

        } catch (
                FirebaseAuthException
                | IllegalArgumentException exception
        ) {
            LOGGER.debug(
                    "Firebase ID token non valido",
                    exception
            );

            abortUnauthorized(
                    requestContext,
                    "INVALID_ID_TOKEN",
                    "Token Firebase non valido, "
                            + "scaduto o revocato"
            );

        } catch (RuntimeException exception) {
            LOGGER.error(
                    "Errore interno durante "
                            + "l'autenticazione Firebase",
                    exception
            );

            abortInternalServerError(requestContext);
        }
    }

    private String extractBearerToken(
            String authorizationHeader
    ) {
        int separatorIndex =
                authorizationHeader.indexOf(' ');

        if (
                separatorIndex <= 0
                        || separatorIndex
                        == authorizationHeader.length() - 1
        ) {
            return null;
        }

        String scheme =
                authorizationHeader
                        .substring(0, separatorIndex)
                        .trim();

        String token =
                authorizationHeader
                        .substring(separatorIndex + 1)
                        .trim();

        if (
                !BEARER_SCHEME.equalsIgnoreCase(scheme)
                        || token.isBlank()
        ) {
            return null;
        }

        return token;
    }

    private void abortUnauthorized(
            ContainerRequestContext requestContext,
            String errorCode,
            String message
    ) {
        ErrorResponseDTO error =
                ErrorResponseDTO.builder()
                        .code(errorCode)
                        .message(message)
                        .build();

        Response response =
                Response.status(
                                Response.Status.UNAUTHORIZED
                        )
                        .header(
                                HttpHeaders.WWW_AUTHENTICATE,
                                AUTHENTICATION_CHALLENGE
                        )
                        .type(MediaType.APPLICATION_JSON_TYPE)
                        .entity(error)
                        .build();

        requestContext.abortWith(response);
    }

    private void abortInternalServerError(
            ContainerRequestContext requestContext
    ) {
        ErrorResponseDTO error =
                ErrorResponseDTO.builder()
                        .code(
                                "AUTHENTICATION_INTERNAL_ERROR"
                        )
                        .message(
                                "Errore interno durante "
                                        + "l'autenticazione"
                        )
                        .build();

        Response response =
                Response.status(
                                Response.Status
                                        .INTERNAL_SERVER_ERROR
                        )
                        .type(MediaType.APPLICATION_JSON_TYPE)
                        .entity(error)
                        .build();

        requestContext.abortWith(response);
    }
}