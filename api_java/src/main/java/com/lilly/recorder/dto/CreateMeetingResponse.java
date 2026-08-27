package com.lilly.recorder.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class CreateMeetingResponse {
    private Long id;
    private UUID roomId;
    private String title;
    private String status;
    private boolean recordingEnabled;
    private Instant startedAt;
    private Instant endedAt;
    private List<ParticipantResponse> participants = new ArrayList<>();
    private MeetingDto.RecordingDto recording;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public List<ParticipantResponse> getParticipants() {
        return participants;
    }

    public void setParticipants(List<ParticipantResponse> participants) {
        this.participants = participants;
    }

    public MeetingDto.RecordingDto getRecording() {
        return recording;
    }

    public void setRecording(MeetingDto.RecordingDto recording) {
        this.recording = recording;
    }

    public static class ParticipantResponse {
        private Long id;
        private String name;
        private String role;
        private String joinLink;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

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
    }
}
