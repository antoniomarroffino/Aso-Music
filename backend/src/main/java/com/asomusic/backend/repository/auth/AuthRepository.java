package com.asomusic.backend.repository.auth;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
import jakarta.enterprise.context.ApplicationScoped;

/**
 * Repository per la gestione dell'autenticazione tramite Firebase.
 * Qui centralizziamo tutte le chiamate dirette a FirebaseAuth,
 * mantenendo il Service più pulito e testabile.
 */
@ApplicationScoped
public class AuthRepository implements IAuthRepository {

    private final FirebaseAuth firebaseAuth = FirebaseAuth.getInstance();

    /**
     * ✅ Verifica un ID token proveniente dal frontend Firebase.
     * @param idToken token JWT ricevuto dal client (Firebase Auth)
     * @return FirebaseToken decodificato contenente UID, email, ecc.
     * @throws FirebaseAuthException se il token è invalido o scaduto
     */
    @Override
    public FirebaseToken verifyToken(String idToken) throws FirebaseAuthException {
        try {
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(idToken);
            System.out.println("🔐 Token verificato per UID: " + decodedToken.getUid());
            return decodedToken;
        } catch (FirebaseAuthException e) {
            System.err.println("❌ Errore verifica token Firebase: " + e.getMessage());
            throw e;
        }
    }

    /**
     * 🆕 Crea un nuovo utente direttamente su Firebase Authentication.
     * (Opzionale — utile se vuoi gestire la creazione utente anche lato repo)
     */
    public UserRecord createUser(String email, String password, String displayName) throws FirebaseAuthException {
        UserRecord.CreateRequest request = new UserRecord.CreateRequest()
                .setEmail(email)
                .setPassword(password);

        if (displayName != null && !displayName.isBlank()) {
            request.setDisplayName(displayName);
        }

        UserRecord userRecord = firebaseAuth.createUser(request);
        System.out.println("🧾 Utente creato in Firebase con UID: " + userRecord.getUid());
        return userRecord;
    }

    /**
     * 🔍 Recupera un utente Firebase a partire dal suo UID.
     */
    public UserRecord getUserByUid(String uid) throws FirebaseAuthException {
        UserRecord userRecord = firebaseAuth.getUser(uid);
        System.out.println("👤 Utente trovato: " + userRecord.getEmail());
        return userRecord;
    }
}
