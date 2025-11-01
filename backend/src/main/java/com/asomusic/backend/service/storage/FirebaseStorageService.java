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

    // ✅ Per le cover: Signed URLs (come prima)
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

            String result = signedUrl.toString();
            System.out.println("🔗 Signed URL generato: " + result);
            return result;

        } catch (Exception e) {
            System.err.println("❌ Errore generazione signed URL: " + e.getMessage());
            return gsPath;
        }
    }

    // ✅ Per gli audio: URL pubblici corretti
    public String convertToPublicUrl(String gsPath) {
        if (gsPath == null || gsPath.isBlank() || !gsPath.startsWith("gs://")) {
            return gsPath;
        }

        try {
            String path = gsPath.substring(5); // Rimuovi "gs://"
            int slashIndex = path.indexOf('/');

            if (slashIndex == -1) return gsPath;

            String bucket = path.substring(0, slashIndex);
            String filePath = path.substring(slashIndex + 1);

            // ✅ IMPORTANTE: Rimuovi .appspot.com dal bucket name
            if (bucket.endsWith(".appspot.com")) {
                bucket = bucket.replace(".appspot.com", "");
            }

            System.out.println("📎 Bucket corretto: " + bucket);
            System.out.println("📁 File path: " + filePath);

            // ✅ Encode SOLO il path del file, mantenendo gli slash
            String[] parts = filePath.split("/");
            String encodedPath = Arrays.stream(parts)
                    .map(part -> URLEncoder.encode(part, StandardCharsets.UTF_8)
                            .replace("+", "%20"))
                    .collect(Collectors.joining("%2F"));

            String publicUrl = String.format(
                    "https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media",
                    bucket, encodedPath
            );

            System.out.println("🔗 Public URL: " + publicUrl);
            return publicUrl;

        } catch (Exception e) {
            System.err.println("❌ Errore conversione public URL: " + e.getMessage());
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