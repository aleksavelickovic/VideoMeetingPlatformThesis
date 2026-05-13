package com.lilly.recorder.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;

import java.time.Instant;
import java.util.Set;

public class MeetingFilterRequest {
    private static final Set<String> VALID_STATUSES = Set.of("scheduled", "in_progress", "completed", "failed");

    @Min(1)
    private int page = 1;

    @Min(1)
    private int perPage = 20;

    private String status;
    private Instant from;
    private Instant to;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    public boolean isStatusValid() {
        return status == null || VALID_STATUSES.contains(status);
    }

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    public boolean isRangeValid() {
        return from == null || to == null || !from.isAfter(to);
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getPerPage() {
        return perPage;
    }

    public void setPerPage(int perPage) {
        this.perPage = perPage;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getFrom() {
        return from;
    }

    public void setFrom(Instant from) {
        this.from = from;
    }

    public Instant getTo() {
        return to;
    }

    public void setTo(Instant to) {
        this.to = to;
    }
}
