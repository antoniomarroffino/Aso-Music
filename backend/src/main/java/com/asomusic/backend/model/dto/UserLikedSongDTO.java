package com.asomusic.backend.model.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@RegisterForReflection
public class UserLikedSongDTO {

    private String albumId;
    private String songId;
    private String title;
    private String albumName;
    private String coverURL;
    private List<String> artistNames;
    private OffsetDateTime likedAt;
}
