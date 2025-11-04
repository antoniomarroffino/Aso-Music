package com.asomusic.backend.model.dto;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;

@Data
@Builder
@Getter
public class LoginResponseDTO {
    private String uid;
    private String email;
    private String username;
    private String firstName;
    private String lastName;
    private String subscriptionType;
}
