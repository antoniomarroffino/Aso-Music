package com.asomusic.backend.service.auth;

import com.asomusic.backend.exceptions.InvalidAuthenticationTokenException;
import com.asomusic.backend.exceptions.UserProfileNotFoundException;
import com.asomusic.backend.model.dto.LoginRequestDTO;
import com.asomusic.backend.model.dto.LoginResponseDTO;
import com.asomusic.backend.model.dto.SignupRequestDTO;
import com.asomusic.backend.model.dto.SignupResponseDTO;
import com.asomusic.backend.model.dto.UserDTO;
import com.asomusic.backend.repository.auth.IAuthRepository;
import com.asomusic.backend.repository.user.IUserRepository;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.concurrent.ExecutionException;

@ApplicationScoped
public class AuthService implements IAuthService {

    @Inject
    IAuthRepository authRepository;

    @Inject
    IUserRepository userRepository;

    @Override
    public LoginResponseDTO login(
            LoginRequestDTO request
    ) {
        validateLoginRequest(request);

        try {
            FirebaseToken decodedToken =
                    authRepository.verifyToken(
                            request.getIdToken(),
                            true
                    );

            String uid = decodedToken.getUid();

            UserDTO user =
                    userRepository.getUserByUid(uid);

            if (user == null) {
                throw new UserProfileNotFoundException(
                        "Profilo utente non trovato"
                );
            }

            return LoginResponseDTO.builder()
                    .uid(uid)
                    .email(user.getEmail())
                    .username(user.getUsername())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .subscriptionType(
                            user.getSubscriptionType()
                    )
                    .build();

        } catch (FirebaseAuthException
                 | IllegalArgumentException exception) {

            throw new InvalidAuthenticationTokenException(
                    "Token Firebase non valido, "
                            + "scaduto o revocato",
                    exception
            );

        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();

            throw new IllegalStateException(
                    "Login interrotto durante "
                            + "il recupero del profilo utente",
                    exception
            );

        } catch (ExecutionException exception) {
            throw new IllegalStateException(
                    "Errore durante il recupero "
                            + "del profilo utente",
                    exception
            );
        }
    }

    @Override
    public SignupResponseDTO signup(
            SignupRequestDTO request
    ) {
        try {
            FirebaseToken decodedToken =
                    authRepository.verifyToken(
                            request.getIdToken(),
                            true
                    );

            String uid = decodedToken.getUid();

            if (
                    userRepository.isUsernameTaken(
                            request.getUsername()
                    )
            ) {
                throw new RuntimeException(
                        "Username già in uso"
                );
            }

            if (userRepository.getUserByUid(uid) == null) {
                userRepository.createUserDocument(
                        uid,
                        request.getEmail(),
                        request.getFirstName(),
                        request.getLastName(),
                        request.getUsername()
                );
            }

            return SignupResponseDTO.builder()
                    .uid(uid)
                    .email(request.getEmail())
                    .username(request.getUsername())
                    .firstName(request.getFirstName())
                    .lastName(request.getLastName())
                    .subscriptionType("free")
                    .idToken(request.getIdToken())
                    .build();

        } catch (RuntimeException exception) {
            throw exception;

        } catch (Exception exception) {
            throw new RuntimeException(
                    "Errore durante la registrazione: "
                            + exception.getMessage(),
                    exception
            );
        }
    }

    private void validateLoginRequest(
            LoginRequestDTO request
    ) {
        if (request == null
                || request.getIdToken() == null
                || request.getIdToken().isBlank()) {

            throw new InvalidAuthenticationTokenException(
                    "Il token Firebase è obbligatorio",
                    null
            );
        }
    }
}