package com.asomusic.backend.service.auth;

import com.asomusic.backend.model.dto.LoginRequestDTO;
import com.asomusic.backend.model.dto.LoginResponseDTO;
import com.asomusic.backend.model.dto.SignupRequestDTO;
import com.asomusic.backend.model.dto.SignupResponseDTO;
import com.asomusic.backend.repository.auth.IAuthRepository;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class AuthService implements IAuthService {

    @Inject
    IAuthRepository authRepository;

    private final FirebaseAuth firebaseAuth = FirebaseAuth.getInstance();

    /**
     * 🔐 Verifica un token ID Firebase e restituisce le informazioni utente base.
     */
    @Override
    public LoginResponseDTO login(LoginRequestDTO request) {
        try {
            var decodedToken = authRepository.verifyToken(request.getIdToken());

            System.out.println("✅ Token verificato per UID: " + decodedToken.getUid());

            return LoginResponseDTO.builder()
                    .uid(decodedToken.getUid())
                    .email(decodedToken.getEmail())
                    .build();

        } catch (FirebaseAuthException e) {
            System.err.println("❌ Errore autenticazione Firebase: " + e.getMessage());
            throw new RuntimeException("Token non valido o scaduto", e);
        } catch (Exception e) {
            System.err.println("❌ Errore generico nel login: " + e.getMessage());
            throw new RuntimeException("Errore durante il login", e);
        }
    }

    /**
     * 🆕 Crea un nuovo utente in Firebase Authentication e restituisce il suo token custom.
     */
    @Override
    public SignupResponseDTO signup(SignupRequestDTO request) {
        try {
            // ✅ Crea l'utente su Firebase
            UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
                    .setEmail(request.getEmail())
                    .setPassword(request.getPassword());

            if (request.getDisplayName() != null && !request.getDisplayName().isBlank()) {
                createRequest.setDisplayName(request.getDisplayName());
            }

            UserRecord userRecord = firebaseAuth.createUser(createRequest);

            // 🔐 Genera un custom token per autenticazione immediata lato client
            String customToken = firebaseAuth.createCustomToken(userRecord.getUid());

            System.out.println("🆕 Utente creato con UID: " + userRecord.getUid());

            return SignupResponseDTO.builder()
                    .uid(userRecord.getUid())
                    .email(userRecord.getEmail())
                    .displayName(userRecord.getDisplayName())
                    .idToken(customToken)
                    .build();

        } catch (FirebaseAuthException e) {
            System.err.println("❌ Errore durante la creazione utente Firebase: " + e.getMessage());
            throw new RuntimeException("Errore creazione utente Firebase: " + e.getMessage(), e);
        } catch (Exception e) {
            System.err.println("❌ Errore generico durante signup: " + e.getMessage());
            throw new RuntimeException("Errore durante la registrazione", e);
        }
    }
}
