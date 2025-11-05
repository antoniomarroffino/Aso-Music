package com.asomusic.backend.repository.auth;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class AuthRepository implements IAuthRepository {

    private final FirebaseAuth firebaseAuth = FirebaseAuth.getInstance();

    @Override
    public FirebaseToken verifyToken(String idToken) throws FirebaseAuthException {
        try {
            return firebaseAuth.verifyIdToken(idToken);
        } catch (FirebaseAuthException e) {
            System.err.println("❌ Errore verifica token Firebase: " + e.getMessage());
            throw e;
        }
    }

    public UserRecord createUser(String email, String password, String displayName) throws FirebaseAuthException {
        UserRecord.CreateRequest request = new UserRecord.CreateRequest()
                .setEmail(email)
                .setPassword(password);

        if (displayName != null && !displayName.isBlank()) {
            request.setDisplayName(displayName);
        }

        return firebaseAuth.createUser(request);
    }

    public UserRecord getUserByUid(String uid) throws FirebaseAuthException {
        return firebaseAuth.getUser(uid);
    }
}
