package com.asomusic.backend.model.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@RegisterForReflection
public class LikeMutationResultDTO {

    private String albumId;
    private String songId;
    private boolean liked;
    private boolean changed;
    private long likeCount;
    private int used;
    private int remaining;
}
