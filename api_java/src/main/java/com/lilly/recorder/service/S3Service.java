package com.lilly.recorder.service;

import com.lilly.recorder.config.SystemConfigurationProperties;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.time.Duration;

@Service
public class S3Service {
    private final S3Presigner s3Presigner;
    private final SystemConfigurationProperties properties;

    public S3Service(S3Presigner s3Presigner, SystemConfigurationProperties properties) {
        this.s3Presigner = s3Presigner;
        this.properties = properties;
    }

    public String generatePresignedUrl(String bucket, String key) {
        GetObjectPresignRequest request = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofHours(properties.getS3().getPresignedUrlExpiryHours()))
                .getObjectRequest(GetObjectRequest.builder().bucket(bucket).key(key).build())
                .build();
        return s3Presigner.presignGetObject(request).url().toString();
    }
}
