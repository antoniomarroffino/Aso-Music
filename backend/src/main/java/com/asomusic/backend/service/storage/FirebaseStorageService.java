package com.asomusic.backend.service.storage;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URL;
import java.util.concurrent.TimeUnit;

@ApplicationScoped
public class FirebaseStorageService {

    private static final String GS_PREFIX = "gs://";

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

    public String generateSignedUrl(String gsPath) {
        if (gsPath == null || gsPath.isBlank()) {
            return null;
        }

        if (!gsPath.startsWith(GS_PREFIX)) {
            return gsPath;
        }

        StorageObjectReference objectReference =
                parseStorageReference(gsPath);

        BlobInfo blobInfo = BlobInfo.newBuilder(
                BlobId.of(
                        objectReference.bucketName(),
                        objectReference.objectName()
                )
        ).build();

        URL signedUrl = storage.signUrl(
                blobInfo,
                urlExpirationHours,
                TimeUnit.HOURS
        );

        return signedUrl.toString();
    }

    private StorageObjectReference parseStorageReference(String gsPath) {
        String pathWithoutScheme =
                gsPath.substring(GS_PREFIX.length());

        int firstSlashIndex = pathWithoutScheme.indexOf('/');

        if (firstSlashIndex <= 0
                || firstSlashIndex == pathWithoutScheme.length() - 1) {
            throw new IllegalArgumentException(
                    "Invalid Google Storage path: " + gsPath
            );
        }

        String bucketName =
                pathWithoutScheme.substring(0, firstSlashIndex);

        String objectName =
                pathWithoutScheme.substring(firstSlashIndex + 1);

        if (!configuredBucketName.equals(bucketName)) {
            throw new IllegalArgumentException(
                    "Unexpected storage bucket: " + bucketName
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