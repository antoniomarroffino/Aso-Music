package com.asomusic.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import io.quarkus.runtime.Startup;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;

import java.io.InputStream;

@Startup
@ApplicationScoped
public class FirebaseConfig {

    private Storage storage;
    private GoogleCredentials credentials;

    @PostConstruct
    void init() {
        try (InputStream serviceAccount = getClass().getClassLoader()
                .getResourceAsStream("serviceAccountKey.json")) {

            // ✅ Salva le credenziali come variabile di classe
            this.credentials = GoogleCredentials.fromStream(serviceAccount);

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                System.out.println("✅ Firebase initialized");
            }

            // ✅ Inizializza Storage (il bucket si specifica dopo, nella richiesta)
            this.storage = StorageOptions.newBuilder()
                    .setCredentials(credentials)
                    .setProjectId("asomusic-d39c4")
                    .build()
                    .getService();

            System.out.println("✅ Firebase Storage initialized");

        } catch (Exception e) {
            throw new RuntimeException("❌ Failed to initialize Firebase", e);
        }
    }

    // ✅ Producer che ritorna lo storage già inizializzato
    @Produces
    @ApplicationScoped
    public Storage getStorage() {
        if (storage == null) {
            throw new RuntimeException("❌ Storage not initialized");
        }
        return storage;
    }
}