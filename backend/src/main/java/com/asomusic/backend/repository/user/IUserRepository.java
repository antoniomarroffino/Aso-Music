package com.asomusic.backend.repository.user;

import com.asomusic.backend.model.dto.UserDTO;

import java.util.concurrent.ExecutionException;

public interface IUserRepository {

    void createUserDocument(
            String uid,
            String email,
            String firstName,
            String lastName,
            String username
    ) throws ExecutionException, InterruptedException;

    UserDTO getUserByUid(
            String uid
    ) throws ExecutionException, InterruptedException;

    boolean isUsernameTaken(
            String username
    ) throws ExecutionException, InterruptedException;
}