package com.asomusic.backend.model.dto;

import java.util.List;

public record SongListenIncrementResult(
        String songId,
        String title,
        long listenCount,
        List<String> artistNames
) {

    public SongListenIncrementResult {
        if (songId == null || songId.isBlank()) {
            throw new IllegalArgumentException(
                    "Song ID cannot be empty"
            );
        }

        if (listenCount < 0) {
            throw new IllegalArgumentException(
                    "Listen count cannot be negative"
            );
        }

        artistNames = artistNames == null
                ? List.of()
                : List.copyOf(artistNames);
    }
}