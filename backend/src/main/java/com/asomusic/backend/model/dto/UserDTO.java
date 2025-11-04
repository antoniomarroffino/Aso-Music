package com.asomusic.backend.model.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserDTO {
    private String uid;
    private String email;
    private String username;
    private String firstName;
    private String lastName;
    private String subscriptionType;
}
