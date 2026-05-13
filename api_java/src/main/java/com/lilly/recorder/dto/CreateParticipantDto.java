package com.lilly.recorder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateParticipantDto {
    @NotBlank
    @Size(max = 100)
    private String name;

    @NotBlank
    private String role = "guest";

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
}
