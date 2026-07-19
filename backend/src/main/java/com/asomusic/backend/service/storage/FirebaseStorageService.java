package com.asomusic.backend.service.storage;

import com.asomusic.backend.model.dto.SignedStorageUrl;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URL;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.concurrent.TimeUnit;

@ApplicationScoped
public class FirebaseStorageService {

    private static final String GS_PREFIX = "gs://";
    private static final long MAX_V4_EXPIRATION_HOURS = 168;

    @Inject
    Storage storage;

    @ConfigProperty(
            name = "firebase.storage.bucket",
            defaultValue = "asomusic-d39c4.appspot.com"
    )
    String configuredBucketName;

    @ConfigProperty(
            name = "firebase.storage.url-expiration-hours",
            defaultValue = "24"
    )
    long urlExpirationHours;

    @PostConstruct
    void validateConfiguration() {
        if (configuredBucketName == null
                || configuredBucketName.isBlank()) {
            throw new IllegalStateException(
                    "Firebase Storage bucket name cannot be empty"
            );
        }

        if (urlExpirationHours <= 0) {
            throw new IllegalStateException(
                    "Firebase Storage URL expiration "
                            + "must be greater than zero"
            );
        }

        if (urlExpirationHours > MAX_V4_EXPIRATION_HOURS) {
            throw new IllegalStateException(
                    "Firebase Storage V4 signed URL expiration "
                            + "cannot exceed "
                            + MAX_V4_EXPIRATION_HOURS
                            + " hours"
            );
        }
    }

    public String generateSignedUrl(String storagePath) {
        return generateSignedUrlDetails(storagePath).url();
    }

    /**
     * Genera l'URL e restituisce anche la sua scadenza.
     */
    public SignedStorageUrl generateSignedUrlDetails(
            String storagePath
    ) {
        if (storagePath == null || storagePath.isBlank()) {
            return new SignedStorageUrl(
                    null,
                    null
            );
        }

        /*
         * Un URL HTTP/HTTPS già risolto non viene firmato.
         * Non conoscendone la scadenza, expiresAt resta null.
         */
        if (!storagePath.startsWith(GS_PREFIX)) {
            return new SignedStorageUrl(
                    storagePath,
                    null
            );
        }

        StorageObjectReference objectReference =
                parseStorageReference(storagePath);

        BlobId blobId = BlobId.of(
                objectReference.bucketName(),
                objectReference.objectName()
        );

        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .build();

        /*
         * Calcolato prima della firma: l'eventuale differenza
         * di pochi millisecondi rende la scadenza restituita
         * leggermente conservativa.
         */
        OffsetDateTime expiresAt =
                OffsetDateTime
                        .now(ZoneOffset.UTC)
                        .plusHours(urlExpirationHours);

        URL signedUrl = storage.signUrl(
                blobInfo,
                urlExpirationHours,
                TimeUnit.HOURS,
                Storage.SignUrlOption.withV4Signature()
        );

        return new SignedStorageUrl(
                signedUrl.toString(),
                expiresAt
        );
    }

    private StorageObjectReference parseStorageReference(
            String storagePath
    ) {
        String pathWithoutScheme =
                storagePath.substring(GS_PREFIX.length());

        int firstSlashIndex =
                pathWithoutScheme.indexOf('/');

        if (firstSlashIndex <= 0
                || firstSlashIndex
                == pathWithoutScheme.length() - 1) {
            throw new IllegalArgumentException(
                    "Invalid Google Storage path: "
                            + storagePath
            );
        }

        String bucketName =
                pathWithoutScheme.substring(
                        0,
                        firstSlashIndex
                );

        String objectName =
                pathWithoutScheme.substring(
                        firstSlashIndex + 1
                );

        if (!configuredBucketName.equals(bucketName)) {
            throw new IllegalArgumentException(
                    "Unexpected storage bucket: "
                            + bucketName
                            + ". Expected: "
                            + configuredBucketName
            );
        }

        return new StorageObjectReference(
                bucketName,
                objectName
        );
    }

    private record StorageObjectReference(
            String bucketName,
            String objectName
    ) {
    }
}