package com.lilly.recorder.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class MeetingDto extends EntityDto {
    private UUID roomId;
    private String title;
    private String status;
    private Instant scheduledAt;
    private int durationLimitMinutes;
    private boolean recordingEnabled;
    private Instant startedAt;
    private Instant endedAt;
    private String notes;
    private List<ParticipantDto> participants = new ArrayList<>();
    private RecordingDto recording;

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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
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

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<ParticipantDto> getParticipants() {
        return participants;
    }

    public void setParticipants(List<ParticipantDto> participants) {
        this.participants = participants;
    }

    public RecordingDto getRecording() {
        return recording;
    }

    public void setRecording(RecordingDto recording) {
        this.recording = recording;
    }

    public static class RecordingDto {
        private String s3Bucket;
        private String s3Key;
        private int width;
        private int height;
        private String presignedUrl;
        private Long sizeBytes;
        private Integer durationSeconds;
        private String format = "mp4";

        public String getS3Bucket() {
            return s3Bucket;
        }

        public void setS3Bucket(String s3Bucket) {
            this.s3Bucket = s3Bucket;
        }

        public String getS3Key() {
            return s3Key;
        }

        public void setS3Key(String s3Key) {
            this.s3Key = s3Key;
        }

        public int getWidth() {
            return width;
        }

        public void setWidth(int width) {
            this.width = width;
        }

        public int getHeight() {
            return height;
        }

        public void setHeight(int height) {
            this.height = height;
        }

        public String getPresignedUrl() {
            return presignedUrl;
        }

        public void setPresignedUrl(String presignedUrl) {
            this.presignedUrl = presignedUrl;
        }

        public Long getSizeBytes() {
            return sizeBytes;
        }

        public void setSizeBytes(Long sizeBytes) {
            this.sizeBytes = sizeBytes;
        }

        public Integer getDurationSeconds() {
            return durationSeconds;
        }

        public void setDurationSeconds(Integer durationSeconds) {
            this.durationSeconds = durationSeconds;
        }

        public String getFormat() {
            return format;
        }

        public void setFormat(String format) {
            this.format = format;
        }
    }
}
