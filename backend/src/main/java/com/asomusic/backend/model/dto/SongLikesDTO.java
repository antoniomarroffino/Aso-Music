package com.asomusic.backend.model.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@RegisterForReflection
public class SongLikesDTO {

    private String albumId;
    private String songId;
    private long likeCount;
    private boolean likedByCurrentUser;
    private List<LikeUserDTO> users;
}
