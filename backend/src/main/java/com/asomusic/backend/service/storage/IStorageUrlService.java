package com.asomusic.backend.service.storage;

import com.asomusic.backend.model.dto.SignedStorageUrl;

public interface IStorageUrlService {
    String getSignedUrl(String storagePath);
    SignedStorageUrl generateFreshSignedUrl(String storagePath);
}