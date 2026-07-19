package com.asomusic.backend.repository.auth;

import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;

public interface IAuthRepository {

    FirebaseToken verifyToken(
            String idToken,
            boolean checkRevoked
    ) throws FirebaseAuthException;

    UserRecord createUser(
            String email,
            String password,
            String displayName
    ) throws FirebaseAuthException;

    UserRecord getUserByUid(
            String uid
    ) throws FirebaseAuthException;
}