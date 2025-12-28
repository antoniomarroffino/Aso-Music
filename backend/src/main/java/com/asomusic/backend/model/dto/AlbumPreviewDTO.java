package com.asomusic.backend.model.dto;

import lombok.*;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlbumPreviewDTO {
    private String id;
    private String name;
    private String artist;
    private String coverURL;
    private OffsetDateTime releaseDate;
    private boolean available;
    private Long availableAt;
}
