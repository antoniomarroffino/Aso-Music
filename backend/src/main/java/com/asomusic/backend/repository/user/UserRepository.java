package com.asomusic.backend.repository.user;

import com.asomusic.backend.model.dto.UserDTO;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@ApplicationScoped
public class UserRepository implements IUserRepository {

    @Override
    public void createUserDocument(String uid, String email, String firstName, String lastName, String username)
            throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();

        Map<String, Object> userData = new HashMap<>();
        userData.put("uid", uid);
        userData.put("email", email);
        userData.put("username", username);
        userData.put("firstName", firstName);
        userData.put("lastName", lastName);
        userData.put("subscriptionType", "free");
        userData.put("createdAt", System.currentTimeMillis());
        userData.put("isVerified", false);

        db.collection("users").document(uid).set(userData).get();
    }


    @Override
    public UserDTO getUserByUid(String uid) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        var snapshot = db.collection("users").document(uid).get().get();

        if (!snapshot.exists()) {
            return null;
        }

        var data = snapshot.getData();

        return UserDTO.builder()
                .uid(uid)
                .email((String) data.get("email"))
                .username((String) data.get("username"))
                .firstName((String) data.get("firstName"))
                .lastName((String) data.get("lastName"))
                .subscriptionType((String) data.get("subscriptionType"))
                .build();
    }

    @Override
    public boolean isUsernameTaken(String username) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        var query = db.collection("users")
                .whereEqualTo("username", username)
                .limit(1)
                .get()
                .get();

        return !query.isEmpty();
    }
}
