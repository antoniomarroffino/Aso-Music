package com.asomusic.backend.repository.user;

import com.asomusic.backend.model.dto.UserDTO;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldMask;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@ApplicationScoped
public class UserRepository implements IUserRepository {

    private static final String USERS_COLLECTION = "users";

    private static final String FIELD_UID = "uid";
    private static final String FIELD_EMAIL = "email";
    private static final String FIELD_USERNAME = "username";
    private static final String FIELD_FIRST_NAME = "firstName";
    private static final String FIELD_LAST_NAME = "lastName";
    private static final String FIELD_SUBSCRIPTION_TYPE =
            "subscriptionType";
    private static final String FIELD_CREATED_AT = "createdAt";
    private static final String FIELD_IS_VERIFIED = "isVerified";

    private static final String DEFAULT_SUBSCRIPTION_TYPE = "free";

    private static final FieldMask USER_PROFILE_FIELD_MASK =
            FieldMask.of(
                    FIELD_EMAIL,
                    FIELD_USERNAME,
                    FIELD_FIRST_NAME,
                    FIELD_LAST_NAME,
                    FIELD_SUBSCRIPTION_TYPE
            );

    private final Firestore db =
            FirestoreClient.getFirestore();

    @Override
    public void createUserDocument(
            String uid,
            String email,
            String firstName,
            String lastName,
            String username
    ) throws ExecutionException, InterruptedException {

        Map<String, Object> userData = new HashMap<>();

        userData.put(FIELD_UID, uid);
        userData.put(FIELD_EMAIL, email);
        userData.put(FIELD_USERNAME, username);
        userData.put(FIELD_FIRST_NAME, firstName);
        userData.put(FIELD_LAST_NAME, lastName);
        userData.put(
                FIELD_SUBSCRIPTION_TYPE,
                DEFAULT_SUBSCRIPTION_TYPE
        );
        userData.put(
                FIELD_CREATED_AT,
                System.currentTimeMillis()
        );
        userData.put(FIELD_IS_VERIFIED, false);

        db.collection(USERS_COLLECTION)
                .document(uid)
                .set(userData)
                .get();
    }

    @Override
    public UserDTO getUserByUid(
            String uid
    ) throws ExecutionException, InterruptedException {

        DocumentSnapshot snapshot =
                db.collection(USERS_COLLECTION)
                        .document(uid)
                        .get(USER_PROFILE_FIELD_MASK)
                        .get();

        if (!snapshot.exists()) {
            return null;
        }

        return UserDTO.builder()
                .uid(uid)
                .email(
                        snapshot.getString(FIELD_EMAIL)
                )
                .username(
                        snapshot.getString(FIELD_USERNAME)
                )
                .firstName(
                        snapshot.getString(FIELD_FIRST_NAME)
                )
                .lastName(
                        snapshot.getString(FIELD_LAST_NAME)
                )
                .subscriptionType(
                        snapshot.getString(
                                FIELD_SUBSCRIPTION_TYPE
                        )
                )
                .build();
    }

    @Override
    public boolean isUsernameTaken(
            String username
    ) throws ExecutionException, InterruptedException {

        QuerySnapshot snapshot =
                db.collection(USERS_COLLECTION)
                        .whereEqualTo(
                                FIELD_USERNAME,
                                username
                        )
                        .select(FIELD_USERNAME)
                        .limit(1)
                        .get()
                        .get();

        return !snapshot.isEmpty();
    }
}