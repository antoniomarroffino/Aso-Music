package com.asomusic.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignupRequestDTO {
    private String email;
    private String firstName;
    private String lastName;
    private String username;
    private String idToken;
}
