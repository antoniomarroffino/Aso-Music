package com.asomusic.backend.model.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlbumPreviewDTO {
    private String id;
    private String name;
    private String artist;
    private String coverURL;
    private int releaseYear;
    private boolean available;
    private Long availableAt;
}
