package com.asomusic.backend.service.storage;

import com.asomusic.backend.model.dto.SignedStorageUrl;
import io.quarkus.cache.CacheResult;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class StorageUrlService implements IStorageUrlService {

    public static final String SIGNED_URL_CACHE_NAME =
            "storage-signed-urls";

    @Inject
    FirebaseStorageService firebaseStorageService;

    @Override
    @CacheResult(cacheName = SIGNED_URL_CACHE_NAME)
    public String getSignedUrl(String storagePath) {
        return firebaseStorageService.generateSignedUrl(
                storagePath
        );
    }

    @Override
    public SignedStorageUrl generateFreshSignedUrl(
            String storagePath
    ) {
        return firebaseStorageService.generateSignedUrlDetails(
                storagePath
        );
    }
}