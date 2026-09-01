package com.lilly.recorder.entity;

import com.lilly.recorder.constants.ParticipantRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "participants", indexes = {
        @Index(name = "idx_participant_meeting_name", columnList = "meeting_id,name")
})
public class Participant extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id", nullable = false)
    private Meeting meeting;

    @Column(nullable = false)
    private String name;

    @Column(length = 254)
    private String email;

    @Column(columnDefinition = "text")
    private String invitationText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ParticipantRole role = ParticipantRole.GUEST;

    @Column(nullable = false, columnDefinition = "text")
    private String token = "";

    @Column(nullable = false, columnDefinition = "text")
    private String joinLink = "";

    private Instant joinedAt;
    private Instant leftAt;
    private String liveKitEgressId;
    private String recordingS3Key;
    private Long recordingSizeBytes;
    private Integer recordingDurationSeconds;

    public Meeting getMeeting() {
        return meeting;
    }

    public void setMeeting(Meeting meeting) {
        this.meeting = meeting;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getInvitationText() { return invitationText; }
    public void setInvitationText(String invitationText) { this.invitationText = invitationText; }

    public ParticipantRole getRole() {
        return role;
    }

    public void setRole(ParticipantRole role) {
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
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

    public String getLiveKitEgressId() {
        return liveKitEgressId;
    }

    public void setLiveKitEgressId(String liveKitEgressId) {
        this.liveKitEgressId = liveKitEgressId;
    }

    public String getRecordingS3Key() {
        return recordingS3Key;
    }

    public void setRecordingS3Key(String recordingS3Key) {
        this.recordingS3Key = recordingS3Key;
    }

    public Long getRecordingSizeBytes() {
        return recordingSizeBytes;
    }

    public void setRecordingSizeBytes(Long recordingSizeBytes) {
        this.recordingSizeBytes = recordingSizeBytes;
    }

    public Integer getRecordingDurationSeconds() {
        return recordingDurationSeconds;
    }

    public void setRecordingDurationSeconds(Integer recordingDurationSeconds) {
        this.recordingDurationSeconds = recordingDurationSeconds;
    }
}
