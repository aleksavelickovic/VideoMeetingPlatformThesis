package com.lilly.recorder.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.lilly.recorder.dto.UpdateProfileDto;
import com.lilly.recorder.service.KeycloakAccountService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final KeycloakAccountService accountService;
    public AuthController(KeycloakAccountService accountService) { this.accountService = accountService; }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<JsonNode> profile(JwtAuthenticationToken authentication) { return ResponseEntity.ok(accountService.get(authentication.getToken().getTokenValue())); }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<JsonNode> update(@Valid @RequestBody UpdateProfileDto dto, JwtAuthenticationToken authentication) { return ResponseEntity.ok(accountService.update(authentication.getToken().getTokenValue(), dto)); }
}
