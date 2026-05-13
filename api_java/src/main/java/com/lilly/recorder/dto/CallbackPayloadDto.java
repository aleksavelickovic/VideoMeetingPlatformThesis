package com.lilly.recorder.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class CallbackPayloadDto {
    private String event;
    private String meetingId;
    private String status;
    private Instant startedAt;
    private Instant endedAt;
    private Integer durationSeconds;
    private List<CallbackParticipantDto> participantsJoined = new ArrayList<>();
    private CallbackRecordingDto recording;
    private Object metadata;

    public String getEvent() {
        return event;
    }

    public void setEvent(String event) {
        this.event = event;
    }

    public String getMeetingId() {
        return meetingId;
    }

    public void setMeetingId(String meetingId) {
        this.meetingId = meetingId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public Integer getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Integer durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public List<CallbackParticipantDto> getParticipantsJoined() {
        return participantsJoined;
    }

    public void setParticipantsJoined(List<CallbackParticipantDto> participantsJoined) {
        this.participantsJoined = participantsJoined;
    }

    public CallbackRecordingDto getRecording() {
        return recording;
    }

    public void setRecording(CallbackRecordingDto recording) {
        this.recording = recording;
    }

    public Object getMetadata() {
        return metadata;
    }

    public void setMetadata(Object metadata) {
        this.metadata = metadata;
    }

    public static class CallbackParticipantDto {
        private String name;
        private String role;
        private Instant joinedAt;
        private Instant leftAt;
        private String presignedUrl;

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

        public String getPresignedUrl() {
            return presignedUrl;
        }

        public void setPresignedUrl(String presignedUrl) {
            this.presignedUrl = presignedUrl;
        }
    }

    public static class CallbackRecordingDto {
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
