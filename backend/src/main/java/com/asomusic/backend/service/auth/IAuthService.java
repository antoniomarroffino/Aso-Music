package com.asomusic.backend.service.auth;

import com.asomusic.backend.model.dto.LoginRequestDTO;
import com.asomusic.backend.model.dto.LoginResponseDTO;

public interface IAuthService {
    LoginResponseDTO login(LoginRequestDTO request);
}
