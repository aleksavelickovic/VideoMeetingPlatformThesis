package com.lilly.recorder.dto;

import jakarta.validation.constraints.Size;

public class EndMeetingDto {
    @Size(max = 100000)
    private String notes;

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
