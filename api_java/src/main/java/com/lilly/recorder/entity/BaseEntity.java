package com.lilly.recorder.entity;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

import java.time.Instant;

@MappedSuperclass
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private Instant dateCreated;

    @Column(nullable = false)
    private Instant dateUpdated;

    @Column(nullable = false)
    private boolean deleted = false;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.dateCreated = now;
        this.dateUpdated = now;
    }

    @PreUpdate
    void onUpdate() {
        this.dateUpdated = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Instant getDateCreated() {
        return dateCreated;
    }

    public Instant getDateUpdated() {
        return dateUpdated;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }
}
