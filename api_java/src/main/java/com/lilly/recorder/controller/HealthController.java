package com.lilly.recorder.controller;

import com.lilly.recorder.config.SystemConfigurationProperties;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/health")
public class HealthController {
    private final JdbcTemplate jdbcTemplate;
    private final RedisConnectionFactory redisConnectionFactory;
    private final SystemConfigurationProperties properties;
    private final RestTemplate restTemplate = new RestTemplate();

    public HealthController(JdbcTemplate jdbcTemplate, RedisConnectionFactory redisConnectionFactory, SystemConfigurationProperties properties) {
        this.jdbcTemplate = jdbcTemplate;
        this.redisConnectionFactory = redisConnectionFactory;
        this.properties = properties;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> get() {
        Map<String, Object> checks = new LinkedHashMap<>();
        boolean healthy = true;

        try {
            jdbcTemplate.execute("SELECT 1");
            checks.put("database", "healthy");
        } catch (Exception ex) {
            checks.put("database", "unhealthy: " + ex.getMessage());
            healthy = false;
        }

        try (var connection = redisConnectionFactory.getConnection()) {
            connection.ping();
            checks.put("redis", "healthy");
        } catch (Exception ex) {
            checks.put("redis", "unhealthy: " + ex.getMessage());
            healthy = false;
        }

        try {
            var response = restTemplate.getForEntity(properties.getLiveKit().getUrl(), String.class);
            checks.put("livekit", response.getStatusCode().is2xxSuccessful() || response.getStatusCode().value() == 401 ? "healthy" : "degraded: HTTP " + response.getStatusCode().value());
        } catch (Exception ex) {
            checks.put("livekit", "degraded (not reachable)");
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", healthy ? "healthy" : "degraded");
        body.put("timestamp", Instant.now());
        body.put("checks", checks);
        return ResponseEntity.status(healthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).body(body);
    }
}
