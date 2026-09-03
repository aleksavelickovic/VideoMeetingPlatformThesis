package com.lilly.recorder.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public class UpdateMeetingDto {
    @NotBlank
    private String title;
    @Future
    private Instant scheduledAt;
    @Min(1)
    private int durationLimitMinutes;
    private boolean recordingEnabled;
    private int recordingWidth = 1280;
    private int recordingHeight = 720;
    private String metadata;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Instant getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(Instant scheduledAt) { this.scheduledAt = scheduledAt; }
    public int getDurationLimitMinutes() { return durationLimitMinutes; }
    public void setDurationLimitMinutes(int durationLimitMinutes) { this.durationLimitMinutes = durationLimitMinutes; }
    public boolean isRecordingEnabled() { return recordingEnabled; }
    public void setRecordingEnabled(boolean recordingEnabled) { this.recordingEnabled = recordingEnabled; }
    public int getRecordingWidth() { return recordingWidth; }
    public void setRecordingWidth(int recordingWidth) { this.recordingWidth = recordingWidth; }
    public int getRecordingHeight() { return recordingHeight; }
    public void setRecordingHeight(int recordingHeight) { this.recordingHeight = recordingHeight; }
    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }
}
