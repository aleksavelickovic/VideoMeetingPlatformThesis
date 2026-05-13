package com.lilly.recorder.dto;

import java.time.Instant;

public class ParticipantDto extends EntityDto {
    private String name;
    private String role;
    private String joinLink;
    private Instant joinedAt;
    private Instant leftAt;
    private String token;
    private String recordingPresignedUrl;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getJoinLink() {
        return joinLink;
    }

    public void setJoinLink(String joinLink) {
        this.joinLink = joinLink;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(Instant joinedAt) {
        this.joinedAt = joinedAt;
    }

    public Instant getLeftAt() {
        return leftAt;
    }

    public void setLeftAt(Instant leftAt) {
        this.leftAt = leftAt;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRecordingPresignedUrl() {
        return recordingPresignedUrl;
    }

    public void setRecordingPresignedUrl(String recordingPresignedUrl) {
        this.recordingPresignedUrl = recordingPresignedUrl;
    }
}
