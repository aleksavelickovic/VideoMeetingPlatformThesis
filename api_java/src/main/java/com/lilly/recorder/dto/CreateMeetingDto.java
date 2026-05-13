package com.lilly.recorder.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class CreateMeetingDto {
    @Size(max = 200)
    private String title;

    private Instant scheduledAt;

    @Min(1)
    @Max(480)
    private int durationLimitMinutes = 120;

    @NotNull
    @Size(min = 2, max = 6)
    @Valid
    private List<CreateParticipantDto> participants = new ArrayList<>();

    @NotNull
    @Valid
    private RecordingConfigDto recording = new RecordingConfigDto();

    @NotBlank
    private String callbackUrl;

    @NotBlank
    private String joinBaseUrl;

    private Object metadata;

    @AssertTrue(message = "CallbackUrl must be a valid URL.")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    public boolean isCallbackUrlValid() {
        return isValidAbsoluteUrl(callbackUrl);
    }

    @AssertTrue(message = "JoinBaseUrl must be a valid URL.")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    public boolean isJoinBaseUrlValid() {
        return isValidAbsoluteUrl(joinBaseUrl);
    }

    @AssertTrue(message = "ScheduledAt must be in the future.")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    public boolean isScheduledAtValid() {
        return scheduledAt == null || scheduledAt.isAfter(Instant.now());
    }

    private boolean isValidAbsoluteUrl(String value) {
        try {
            URI uri = URI.create(value);
            return uri.getScheme() != null && uri.getHost() != null;
        } catch (Exception ex) {
            return false;
        }
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public List<CreateParticipantDto> getParticipants() {
        return participants;
    }

    public void setParticipants(List<CreateParticipantDto> participants) {
        this.participants = participants;
    }

    public RecordingConfigDto getRecording() {
        return recording;
    }

    public void setRecording(RecordingConfigDto recording) {
        this.recording = recording;
    }

    public String getCallbackUrl() {
        return callbackUrl;
    }

    public void setCallbackUrl(String callbackUrl) {
        this.callbackUrl = callbackUrl;
    }

    public String getJoinBaseUrl() {
        return joinBaseUrl;
    }

    public void setJoinBaseUrl(String joinBaseUrl) {
        this.joinBaseUrl = joinBaseUrl;
    }

    public Object getMetadata() {
        return metadata;
    }

    public void setMetadata(Object metadata) {
        this.metadata = metadata;
    }

    public static class RecordingConfigDto {
        private boolean enabled = true;
        @NotBlank
        private String format = "mp4";
        @Min(1)
        private int width = 1280;
        @Min(1)
        private int height = 720;

        @AssertTrue(message = "Format must be 'mp4'.")
        @JsonProperty(access = JsonProperty.Access.READ_ONLY)
        public boolean isFormatValid() {
            return "mp4".equals(format);
        }

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public String getFormat() {
            return format;
        }

        public void setFormat(String format) {
            this.format = format;
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
    }
}
