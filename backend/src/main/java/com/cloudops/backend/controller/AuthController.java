package com.cloudops.backend.controller;

import com.cloudops.backend.model.LoginRequest;
import com.cloudops.backend.model.LoginResponse;
import com.cloudops.backend.service.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtService jwtService;
    @Value("${app.auth.username}")
    private String configuredUsername;

    @Value("${app.auth.password}")
    private String configuredPassword;

    public AuthController(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
    if (configuredUsername.equals(request.getUsername()) &&
        configuredPassword.equals(request.getPassword())) {
        String token = jwtService.generateToken(request.getUsername());
        return ResponseEntity.ok(new LoginResponse(token));
    }

        return ResponseEntity.status(401).build();
    }
}