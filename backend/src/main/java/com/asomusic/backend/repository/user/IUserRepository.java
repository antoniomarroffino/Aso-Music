package com.asomusic.backend.repository.user;

import com.asomusic.backend.model.dto.UserDTO;
import com.google.firebase.auth.UserRecord;
import java.util.concurrent.ExecutionException;

public interface IUserRepository {
    void createUserDocument(UserRecord userRecord, String firstName, String lastName, String username) throws ExecutionException, InterruptedException;
    UserDTO getUserByUid(String uid) throws ExecutionException, InterruptedException;
    boolean isUsernameTaken(String username) throws ExecutionException, InterruptedException;
}
