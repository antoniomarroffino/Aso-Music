package com.asomusic.backend.service.auth;

import com.asomusic.backend.model.dto.LoginRequestDTO;
import com.asomusic.backend.model.dto.LoginResponseDTO;
import com.asomusic.backend.model.dto.SignupRequestDTO;
import com.asomusic.backend.model.dto.SignupResponseDTO;

public interface IAuthService {

    LoginResponseDTO login(LoginRequestDTO request);

    SignupResponseDTO signup(SignupRequestDTO request);
}