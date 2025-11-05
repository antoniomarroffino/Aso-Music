package com.asomusic.backend.service.auth;

import com.asomusic.backend.model.dto.LoginRequestDTO;
import com.asomusic.backend.model.dto.LoginResponseDTO;
import com.asomusic.backend.model.dto.SignupRequestDTO;
import com.asomusic.backend.model.dto.SignupResponseDTO;
import com.asomusic.backend.repository.auth.IAuthRepository;
import com.asomusic.backend.repository.user.IUserRepository;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class AuthService implements IAuthService {

    @Inject
    IAuthRepository authRepository;

    @Inject
    IUserRepository userRepository;

    private final FirebaseAuth firebaseAuth = FirebaseAuth.getInstance();

    @Override
    public LoginResponseDTO login(LoginRequestDTO request) {
        try {
            FirebaseToken decodedToken = authRepository.verifyToken(request.getIdToken());
            String uid = decodedToken.getUid();
            var user = userRepository.getUserByUid(uid);

            if (user == null) {
                throw new RuntimeException("Utente non trovato nel database Firestore");
            }

            return LoginResponseDTO.builder()
                    .uid(uid)
                    .email(user.getEmail())
                    .username(user.getUsername())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .subscriptionType(user.getSubscriptionType())
                    .build();

        } catch (FirebaseAuthException e) {
            System.err.println("❌ Errore autenticazione Firebase: " + e.getMessage());
            throw new RuntimeException("Token non valido o scaduto", e);
        } catch (Exception e) {
            System.err.println("❌ Errore generico nel login: " + e.getMessage());
            throw new RuntimeException("Errore durante il login", e);
        }
    }

    @Override
    public SignupResponseDTO signup(SignupRequestDTO request) {
        try {
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(request.getIdToken());
            String uid = decodedToken.getUid();

            if (userRepository.isUsernameTaken(request.getUsername())) {
                throw new RuntimeException("Username già in uso");
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

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("❌ Errore durante la registrazione: " + e.getMessage());
            throw new RuntimeException("Errore durante la registrazione: " + e.getMessage(), e);
        }
    }
}
