package com.asomusic.backend.service.auth;

import com.asomusic.backend.model.dto.LoginRequestDTO;
import com.asomusic.backend.model.dto.LoginResponseDTO;
import com.asomusic.backend.repository.auth.IAuthRepository;
import com.google.firebase.auth.FirebaseAuthException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class AuthService implements IAuthService {

    @Inject
    IAuthRepository authRepository;

    @Override
    public LoginResponseDTO login(LoginRequestDTO request) {
        try {
            var decodedToken = authRepository.verifyToken(request.getIdToken());

            return LoginResponseDTO.builder()
                    .uid(decodedToken.getUid())
                    .email(decodedToken.getEmail())
                    .build();

        } catch (FirebaseAuthException e) {
            System.err.println("❌ Errore autenticazione Firebase: " + e.getMessage());
            throw new RuntimeException("Token non valido o scaduto", e);
        }
    }
}
