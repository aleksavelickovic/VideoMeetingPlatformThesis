package com.lilly.recorder.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lilly.recorder.config.SystemConfigurationProperties;
import com.lilly.recorder.dto.UpdateProfileDto;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class KeycloakAccountService {
    private static final Logger log = LoggerFactory.getLogger(KeycloakAccountService.class);
    private final RestClient client;
    private final RestClient keycloakClient;
    private final ObjectMapper objectMapper;
    private final SystemConfigurationProperties properties;

    public KeycloakAccountService(SystemConfigurationProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.keycloakClient = RestClient.builder().baseUrl(properties.getKeycloak().getUrl()).build();
        this.client = RestClient.builder().baseUrl(properties.getKeycloak().getUrl() + "/admin/realms/" + properties.getKeycloak().getRealm()).build();
        this.objectMapper = objectMapper;
    }

    public JsonNode update(String subject, String email, UpdateProfileDto dto) {
        try {
            String adminToken = getAdminToken();
            String userId = findUserId(adminToken, subject, email);
            client.put().uri("/users/" + userId).header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(objectMapper.createObjectNode().put("firstName", dto.getFirstName()).put("lastName", dto.getLastName()).put("email", dto.getEmail()))
                    .retrieve().toBodilessEntity();
            return objectMapper.createObjectNode().put("firstName", dto.getFirstName()).put("lastName", dto.getLastName()).put("email", dto.getEmail());
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (RestClientResponseException exception) {
            log.warn("Keycloak profile update rejected: status={}, body={}", exception.getStatusCode(), exception.getResponseBodyAsString());
            throw new ResponseStatusException(HttpStatus.valueOf(exception.getStatusCode().value()), "Keycloak rejected profile update", exception);
        } catch (Exception exception) { throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not update profile in Keycloak", exception); }
    }

    private String findUserId(String adminToken, String subject, String email) {
        if (email != null && !email.isBlank()) {
            JsonNode users = client.get().uri(uriBuilder -> uriBuilder.path("/users").queryParam("email", email).queryParam("exact", true).build())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken).retrieve().body(JsonNode.class);
            if (users != null && users.isArray() && !users.isEmpty()) return users.get(0).get("id").asText();
        }
        return subject;
    }

    private String getAdminToken() {
        if (properties.getKeycloak().getAdminUsername() == null || properties.getKeycloak().getAdminPassword() == null
                || properties.getKeycloak().getAdminUsername().isBlank() || properties.getKeycloak().getAdminPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Keycloak admin credentials are not configured");
        }
        org.springframework.util.LinkedMultiValueMap<String, String> form = new org.springframework.util.LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("client_id", "admin-cli");
        form.add("username", properties.getKeycloak().getAdminUsername());
        form.add("password", properties.getKeycloak().getAdminPassword());
        JsonNode response = keycloakClient.post().uri("/realms/master/protocol/openid-connect/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form).retrieve().body(JsonNode.class);
        return response.get("access_token").asText();
    }
}
