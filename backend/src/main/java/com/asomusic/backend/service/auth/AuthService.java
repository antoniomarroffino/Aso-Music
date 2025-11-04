package com.asomusic.backend.service.auth;

import com.asomusic.backend.model.dto.LoginRequestDTO;
import com.asomusic.backend.model.dto.LoginResponseDTO;
import com.asomusic.backend.model.dto.SignupRequestDTO;
import com.asomusic.backend.model.dto.SignupResponseDTO;
import com.asomusic.backend.repository.auth.IAuthRepository;
import com.asomusic.backend.repository.user.IUserRepository;
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

    @Inject
    IUserRepository userRepository;

    @Override
    public LoginResponseDTO login(LoginRequestDTO request) {
        try {
            // 1️⃣ Verifica token Firebase
            var decodedToken = authRepository.verifyToken(request.getIdToken());
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
            // 🔹 1️⃣ Verifica che l'username non sia già usato
            if (userRepository.isUsernameTaken(request.getUsername())) {
                throw new RuntimeException("Username già in uso");
            }

            // 🔹 2️⃣ Crea utente su Firebase Auth
            UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
                    .setEmail(request.getEmail())
                    .setPassword(request.getPassword())
                    .setDisplayName(request.getUsername());

            UserRecord userRecord = firebaseAuth.createUser(createRequest);

            // 🔹 3️⃣ Crea documento su Firestore
            userRepository.createUserDocument(
                    userRecord,
                    request.getFirstName(),
                    request.getLastName(),
                    request.getUsername()
            );

            // 🔹 4️⃣ Genera custom token
            String customToken = firebaseAuth.createCustomToken(userRecord.getUid());

            // 🔹 5️⃣ Ritorna risposta
            return SignupResponseDTO.builder()
                    .uid(userRecord.getUid())
                    .email(userRecord.getEmail())
                    .username(request.getUsername())
                    .idToken(customToken)
                    .build();

        } catch (RuntimeException e) {
            // Rilancia eccezioni custom (come “Username già in uso”)
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Errore durante la registrazione: " + e.getMessage(), e);
        }
    }


}
