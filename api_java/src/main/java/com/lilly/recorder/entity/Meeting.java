package com.lilly.recorder.entity;

import com.lilly.recorder.constants.MeetingStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import org.hibernate.annotations.ColumnTransformer;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "meetings", indexes = {
        @Index(name = "idx_meeting_room_id", columnList = "roomId", unique = true),
        @Index(name = "idx_meeting_status", columnList = "status"),
        @Index(name = "idx_meeting_created", columnList = "dateCreated")
})
public class Meeting extends BaseEntity {

    @Column(nullable = false, unique = true)
    private UUID roomId = UUID.randomUUID();

    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private MeetingStatus status = MeetingStatus.SCHEDULED;

    private Instant scheduledAt;
    private int durationLimitMinutes = 120;
    private boolean recordingEnabled = true;
    private int recordingWidth = 1280;
    private int recordingHeight = 720;
    private String recordingS3Bucket;
    private String recordingS3Key;
    private Long recordingSizeBytes;
    private Integer recordingDurationSeconds;

    @Column(nullable = false)
    private String recordingFormat = "mp4";

    @Column(nullable = false)
    private String callbackUrl;

    @Column(nullable = false)
    private String callbackSecret = UUID.randomUUID().toString().replace("-", "");

    @Column(columnDefinition = "jsonb")
    @ColumnTransformer(write = "?::jsonb")
    private String metadata;

    private Instant startedAt;
    private Instant endedAt;
    private String liveKitEgressId;

    @OneToMany(mappedBy = "meeting", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Participant> participants = new ArrayList<>();

    @OneToMany(mappedBy = "meeting", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CallbackAttempt> callbackAttempts = new ArrayList<>();

    public UUID getRoomId() {
        return roomId;
    }

    public void setRoomId(UUID roomId) {
        this.roomId = roomId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public MeetingStatus getStatus() {
        return status;
    }

    public void setStatus(MeetingStatus status) {
        this.status = status;
    }

    public Instant getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(Instant scheduledAt) {
        this.scheduledAt = scheduledAt;
    }

    public int getDurationLimitMinutes() {
        return durationLimitMinutes;
    }

    public void setDurationLimitMinutes(int durationLimitMinutes) {
        this.durationLimitMinutes = durationLimitMinutes;
    }

    public boolean isRecordingEnabled() {
        return recordingEnabled;
    }

    public void setRecordingEnabled(boolean recordingEnabled) {
        this.recordingEnabled = recordingEnabled;
    }

    public int getRecordingWidth() {
        return recordingWidth;
    }

    public void setRecordingWidth(int recordingWidth) {
        this.recordingWidth = recordingWidth;
    }

    public int getRecordingHeight() {
        return recordingHeight;
    }

    public void setRecordingHeight(int recordingHeight) {
        this.recordingHeight = recordingHeight;
    }

    public String getRecordingS3Bucket() {
        return recordingS3Bucket;
    }

    public void setRecordingS3Bucket(String recordingS3Bucket) {
        this.recordingS3Bucket = recordingS3Bucket;
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

    public String getRecordingFormat() {
        return recordingFormat;
    }

    public void setRecordingFormat(String recordingFormat) {
        this.recordingFormat = recordingFormat;
    }

    public String getCallbackUrl() {
        return callbackUrl;
    }

    public void setCallbackUrl(String callbackUrl) {
        this.callbackUrl = callbackUrl;
    }

    public String getCallbackSecret() {
        return callbackSecret;
    }

    public void setCallbackSecret(String callbackSecret) {
        this.callbackSecret = callbackSecret;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(Instant endedAt) {
        this.endedAt = endedAt;
    }

    public String getLiveKitEgressId() {
        return liveKitEgressId;
    }

    public void setLiveKitEgressId(String liveKitEgressId) {
        this.liveKitEgressId = liveKitEgressId;
    }

    public List<Participant> getParticipants() {
        return participants;
    }

    public void setParticipants(List<Participant> participants) {
        this.participants = participants == null ? new ArrayList<>() : new ArrayList<>(participants);
    }

    public List<CallbackAttempt> getCallbackAttempts() {
        return callbackAttempts;
    }
}
