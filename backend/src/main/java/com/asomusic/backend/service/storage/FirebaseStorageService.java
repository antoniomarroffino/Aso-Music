package com.asomusic.backend.service.storage;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Storage;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@ApplicationScoped
public class FirebaseStorageService {

    @Inject
    Storage storage;

    @ConfigProperty(name = "firebase.storage.bucket", defaultValue = "asomusic-d39c4.appspot.com")
    String bucketName;

    @ConfigProperty(name = "firebase.storage.url-expiration-hours", defaultValue = "24")
    long urlExpirationHours;

    public String generateSignedUrl(String gsPath) {
        if (gsPath == null || gsPath.isBlank() || !gsPath.startsWith("gs://")) {
            return gsPath;
        }

        try {
            String filePath = extractFilePath(gsPath);

            Blob blob = storage.get(bucketName, filePath);

            if (blob == null) {
                System.err.println("❌ FILE NON TROVATO in Storage!");
                return gsPath;
            }

            java.net.URL signedUrl = blob.signUrl(
                    urlExpirationHours,
                    TimeUnit.HOURS
            );

            return signedUrl.toString();

        } catch (Exception e) {
            System.err.println("❌ Errore generazione signed URL: " + e.getMessage());
            return gsPath;
        }
    }

    private String extractFilePath(String gsPath) {
        String path = gsPath.substring(5);
        int slashIndex = path.indexOf('/');

        if (slashIndex == -1) {
            return null;
        }

        return path.substring(slashIndex + 1);
    }
}