package com.lilly.recorder.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "system-configuration")
public class SystemConfigurationProperties {

    private String frontendUrl = "http://localhost:3002";
    private String egressTemplateUrl = "http://localhost:3002/egress/participant";
    private String redisUrl = "redis://localhost:6379";
    private final LiveKit liveKit = new LiveKit();
    private final S3 s3 = new S3();
    private final RecordingDefaults recordingDefaults = new RecordingDefaults();
    private final Auth auth = new Auth();
    private final Mail mail = new Mail();

    public String getFrontendUrl() {
        return frontendUrl;
    }

    public void setFrontendUrl(String frontendUrl) {
        this.frontendUrl = frontendUrl;
    }

    public String getEgressTemplateUrl() {
        return egressTemplateUrl;
    }

    public void setEgressTemplateUrl(String egressTemplateUrl) {
        this.egressTemplateUrl = egressTemplateUrl;
    }

    public String getRedisUrl() {
        return redisUrl;
    }

    public void setRedisUrl(String redisUrl) {
        this.redisUrl = redisUrl;
    }

    public LiveKit getLiveKit() {
        return liveKit;
    }

    public S3 getS3() {
        return s3;
    }

    public RecordingDefaults getRecordingDefaults() {
        return recordingDefaults;
    }

    public Auth getAuth() {
        return auth;
    }

    public Mail getMail() { return mail; }

    public static class Mail {
        private boolean enabled = true;
        private String from = "no-reply@lillyrecorder.local";

        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public String getFrom() { return from; }
        public void setFrom(String from) { this.from = from; }
    }

    public static class LiveKit {
        @NotBlank
        private String url;
        @NotBlank
        private String apiKey;
        @NotBlank
        private String apiSecret;

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public String getApiSecret() {
            return apiSecret;
        }

        public void setApiSecret(String apiSecret) {
            this.apiSecret = apiSecret;
        }
    }

    public static class S3 {
        @NotBlank
        private String bucket;
        @NotBlank
        private String endpoint;
        @NotBlank
        private String publicEndpoint;
        @NotBlank
        private String accessKey;
        @NotBlank
        private String secretKey;
        private String region = "us-east-1";
        private int presignedUrlExpiryHours = 24;

        public String getBucket() {
            return bucket;
        }

        public void setBucket(String bucket) {
            this.bucket = bucket;
        }

        public String getEndpoint() {
            return endpoint;
        }

        public void setEndpoint(String endpoint) {
            this.endpoint = endpoint;
        }

        public String getPublicEndpoint() {
            return publicEndpoint;
        }

        public void setPublicEndpoint(String publicEndpoint) {
            this.publicEndpoint = publicEndpoint;
        }

        public String getAccessKey() {
            return accessKey;
        }

        public void setAccessKey(String accessKey) {
            this.accessKey = accessKey;
        }

        public String getSecretKey() {
            return secretKey;
        }

        public void setSecretKey(String secretKey) {
            this.secretKey = secretKey;
        }

        public String getRegion() {
            return region;
        }

        public void setRegion(String region) {
            this.region = region;
        }

        public int getPresignedUrlExpiryHours() {
            return presignedUrlExpiryHours;
        }

        public void setPresignedUrlExpiryHours(int presignedUrlExpiryHours) {
            this.presignedUrlExpiryHours = presignedUrlExpiryHours;
        }
    }

    public static class RecordingDefaults {
        private int framerate = 15;
        private int videoBitrate = 2000;
        private int audioBitrate = 64;
        private int audioFrequency = 44100;

        public int getFramerate() {
            return framerate;
        }

        public void setFramerate(int framerate) {
            this.framerate = framerate;
        }

        public int getVideoBitrate() {
            return videoBitrate;
        }

        public void setVideoBitrate(int videoBitrate) {
            this.videoBitrate = videoBitrate;
        }

        public int getAudioBitrate() {
            return audioBitrate;
        }

        public void setAudioBitrate(int audioBitrate) {
            this.audioBitrate = audioBitrate;
        }

        public int getAudioFrequency() {
            return audioFrequency;
        }

        public void setAudioFrequency(int audioFrequency) {
            this.audioFrequency = audioFrequency;
        }
    }

    public static class Auth {
        @NotBlank
        private String jwtSecret;
        private int jwtExpirationHours = 24;

        public String getJwtSecret() {
            return jwtSecret;
        }

        public void setJwtSecret(String jwtSecret) {
            this.jwtSecret = jwtSecret;
        }

        public int getJwtExpirationHours() {
            return jwtExpirationHours;
        }

        public void setJwtExpirationHours(int jwtExpirationHours) {
            this.jwtExpirationHours = jwtExpirationHours;
        }
    }
}
