package com.lilly.recorder.constants;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ParticipantRole {
    HOST("host"),
    GUEST("guest");

    private final String value;

    ParticipantRole(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static ParticipantRole fromValue(String value) {
        for (ParticipantRole role : values()) {
            if (role.value.equalsIgnoreCase(value)) {
                return role;
            }
        }
        throw new IllegalArgumentException("Unknown participant role: " + value);
    }
}
