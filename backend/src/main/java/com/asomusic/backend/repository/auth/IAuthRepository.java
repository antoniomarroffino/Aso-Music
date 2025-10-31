package com.asomusic.backend.repository.auth;

import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.FirebaseAuthException;

public interface IAuthRepository {
    FirebaseToken verifyToken(String idToken) throws FirebaseAuthException;
}
