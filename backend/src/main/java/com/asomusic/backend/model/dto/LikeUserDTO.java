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
public class LikeUserDTO {

    private String uid;
    private String username;
    private String firstName;
    private String lastName;
}
