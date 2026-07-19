package com.asomusic.backend.model.dto;

import java.time.OffsetDateTime;

public record NewsRecord(
        String id,
        String message,
        OffsetDateTime createdAt,
        long sequence
) {
}