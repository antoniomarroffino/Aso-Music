package com.asomusic.backend.repository.auth;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.FirebaseAuthException;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class AuthRepository implements IAuthRepository {

    @Override
    public FirebaseToken verifyToken(String idToken) throws FirebaseAuthException {
        FirebaseAuth auth = FirebaseAuth.getInstance();
        FirebaseToken decodedToken = auth.verifyIdToken(idToken);

        System.out.println("🔐 Token verificato per UID: " + decodedToken.getUid());
        return decodedToken;
    }
}
