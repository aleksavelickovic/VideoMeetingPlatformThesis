package com.lilly.recorder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public class CreateParticipantDto {
    @NotBlank
    @Size(max = 100)
    private String name;

    @NotBlank
    private String role = "guest";

    @Email
    @Size(max = 254)
    private String email;

    @Size(max = 2000)
    private String invitationText;

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

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getInvitationText() { return invitationText; }
    public void setInvitationText(String invitationText) { this.invitationText = invitationText; }
}
