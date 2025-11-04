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
            // 1️⃣ Verifica token Firebase
            FirebaseToken decodedToken = authRepository.verifyToken(request.getIdToken());
            String uid = decodedToken.getUid();

            System.out.println("✅ Token verificato per UID: " + uid);

            // 2️⃣ Recupera utente da Firestore tramite UserRepository
            var user = userRepository.getUserByUid(uid);

            if (user == null) {
                throw new RuntimeException("Utente non trovato nel database Firestore");
            }

            // 3️⃣ Ritorna response completa
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
            // 1️⃣ Verifica il token inviato dal frontend
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(request.getIdToken());
            String uid = decodedToken.getUid();

            System.out.println("✅ Token verificato correttamente per UID: " + uid);

            // 2️⃣ Controlla se lo username è già in uso
            if (userRepository.isUsernameTaken(request.getUsername())) {
                throw new RuntimeException("Username già in uso");
            }

            // 3️⃣ Controlla se l’utente esiste già in Firestore (es. retry del frontend)
            if (userRepository.getUserByUid(uid) != null) {
                System.out.println("⚠️ Utente già presente in Firestore, skip creazione");
            } else {
                // 4️⃣ Crea documento utente su Firestore
                userRepository.createUserDocument(
                        uid,
                        request.getEmail(),
                        request.getFirstName(),
                        request.getLastName(),
                        request.getUsername()
                );
                System.out.println("✅ Utente creato su Firestore con UID: " + uid);
            }

            // 5️⃣ Ritorna la response
            return SignupResponseDTO.builder()
                    .uid(uid)
                    .email(request.getEmail())
                    .username(request.getUsername())
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
