package com.lilly.recorder.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
    private final ObjectMapper objectMapper;
    public AuthController(KeycloakAccountService accountService, ObjectMapper objectMapper) { this.accountService = accountService; this.objectMapper = objectMapper; }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<JsonNode> profile(JwtAuthenticationToken authentication) {
        return ResponseEntity.ok(accountService.getProfile(
                authentication.getToken().getSubject(),
                authentication.getToken().getClaimAsString("email")));
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<JsonNode> update(@Valid @RequestBody UpdateProfileDto dto, JwtAuthenticationToken authentication) { return ResponseEntity.ok(accountService.update(authentication.getToken().getSubject(), authentication.getToken().getClaimAsString("email"), dto)); }
}
