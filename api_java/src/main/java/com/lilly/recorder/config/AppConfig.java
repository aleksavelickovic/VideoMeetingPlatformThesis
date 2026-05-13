package com.lilly.recorder.config;

import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import javax.crypto.SecretKey;
import java.net.URI;
import java.nio.charset.StandardCharsets;

@Configuration
public class AppConfig {

    @Bean
    public SecretKey apiJwtSecretKey(SystemConfigurationProperties properties) {
        byte[] raw = properties.getAuth().getJwtSecret().getBytes(StandardCharsets.UTF_8);
        if (raw.length < 32) {
            raw = String.format("%-32s", properties.getAuth().getJwtSecret()).replace(' ', '_').getBytes(StandardCharsets.UTF_8);
        }
        return Keys.hmacShaKeyFor(raw);
    }

    @Bean
    public S3Client s3Client(SystemConfigurationProperties properties) {
        return S3Client.builder()
                .endpointOverride(URI.create(properties.getS3().getEndpoint()))
                .region(Region.of(properties.getS3().getRegion()))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(
                        properties.getS3().getAccessKey(),
                        properties.getS3().getSecretKey()
                )))
                .forcePathStyle(true)
                .build();
    }

    @Bean
    public S3Presigner s3Presigner(SystemConfigurationProperties properties) {
        return S3Presigner.builder()
                .endpointOverride(URI.create(properties.getS3().getEndpoint()))
                .region(Region.of(properties.getS3().getRegion()))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(
                        properties.getS3().getAccessKey(),
                        properties.getS3().getSecretKey()
                )))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build();
    }

    @Bean
    public TaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(4);
        scheduler.setThreadNamePrefix("callback-scheduler-");
        scheduler.initialize();
        return scheduler;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(SystemConfigurationProperties properties) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowCredentials(true);
        configuration.addAllowedHeader("*");
        configuration.addAllowedMethod("*");
        configuration.addAllowedOrigin(properties.getFrontendUrl());

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
