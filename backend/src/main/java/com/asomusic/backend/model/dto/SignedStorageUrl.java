package com.asomusic.backend.model.dto;

import java.time.OffsetDateTime;

public record SignedStorageUrl(
        String url,
        OffsetDateTime expiresAt
) {
}