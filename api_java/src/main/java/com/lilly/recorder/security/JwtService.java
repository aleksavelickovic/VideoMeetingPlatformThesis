package com.lilly.recorder.security;

import com.lilly.recorder.config.SystemConfigurationProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class JwtService {
    private final SecretKey secretKey;
    private final SystemConfigurationProperties properties;

    public JwtService(SecretKey secretKey, SystemConfigurationProperties properties) {
        this.secretKey = secretKey;
        this.properties = properties;
    }

    public String createToken(String subject) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(subject)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(properties.getAuth().getJwtExpirationHours(), ChronoUnit.HOURS)))
                .signWith(secretKey)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload();
    }
}
