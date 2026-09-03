package com.lilly.recorder.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lilly.recorder.config.SystemConfigurationProperties;
import com.lilly.recorder.dto.UpdateProfileDto;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class KeycloakAccountService {
    private final RestClient client;
    private final ObjectMapper objectMapper;

    public KeycloakAccountService(SystemConfigurationProperties properties, ObjectMapper objectMapper) {
        this.client = RestClient.builder().baseUrl(properties.getKeycloak().getUrl() + "/realms/" + properties.getKeycloak().getRealm() + "/account").build();
        this.objectMapper = objectMapper;
    }

    public JsonNode get(String token) {
        try { return client.get().header(HttpHeaders.AUTHORIZATION, "Bearer " + token).retrieve().body(JsonNode.class); }
        catch (Exception exception) { throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not load profile from Keycloak", exception); }
    }

    public JsonNode update(String token, UpdateProfileDto dto) {
        try {
            return client.post().header(HttpHeaders.AUTHORIZATION, "Bearer " + token).contentType(MediaType.APPLICATION_JSON).body(objectMapper.createObjectNode().put("firstName", dto.getFirstName()).put("lastName", dto.getLastName()).put("email", dto.getEmail())).retrieve().body(JsonNode.class);
        } catch (Exception exception) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not update profile", exception); }
    }
}
