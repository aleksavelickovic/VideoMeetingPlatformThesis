package com.lilly.recorder.dto;

import java.time.Instant;

public abstract class EntityDto {
    private Long id;
    private Instant dateCreated;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Instant getDateCreated() {
        return dateCreated;
    }

    public void setDateCreated(Instant dateCreated) {
        this.dateCreated = dateCreated;
    }
}
