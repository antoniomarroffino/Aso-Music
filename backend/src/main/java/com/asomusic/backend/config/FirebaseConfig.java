package com.asomusic.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import io.quarkus.runtime.Startup;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.InputStream;

@Startup
@ApplicationScoped
public class FirebaseConfig {

    @PostConstruct
    void init() {
        try (InputStream serviceAccount = getClass().getClassLoader()
                .getResourceAsStream("serviceAccountKey.json")) {

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                System.out.println("✅ Firebase initialized");
            }
        } catch (Exception e) {
            throw new RuntimeException("❌ Failed to initialize Firebase", e);
        }
    }
}
