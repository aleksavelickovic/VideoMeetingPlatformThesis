package com.lilly.recorder.service;

import com.lilly.recorder.entity.ApiKey;
import com.lilly.recorder.repository.ApiKeyRepository;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Service
public class ApiKeyService {
    private final ApiKeyRepository apiKeyRepository;

    public ApiKeyService(ApiKeyRepository apiKeyRepository) {
        this.apiKeyRepository = apiKeyRepository;
    }

    @Transactional
    public boolean validateKey(String rawKey) {
        for (ApiKey key : apiKeyRepository.findAllByIsActiveTrueAndDeletedFalse()) {
            if (BCrypt.checkpw(rawKey, key.getKeyHash())) {
                key.setLastUsedAt(Instant.now());
                apiKeyRepository.save(key);
                return true;
            }
        }
        return false;
    }

    @Transactional
    public CreatedApiKey createKey(String name) {
        byte[] raw = new byte[32];
        new SecureRandom().nextBytes(raw);
        String rawKey = Base64.getEncoder().encodeToString(raw);
        ApiKey apiKey = new ApiKey();
        apiKey.setName(name);
        apiKey.setKeyHash(BCrypt.hashpw(rawKey, BCrypt.gensalt()));
        apiKey.setActive(true);
        return new CreatedApiKey(apiKeyRepository.save(apiKey), rawKey);
    }

    public record CreatedApiKey(ApiKey record, String rawKey) {
    }
}
