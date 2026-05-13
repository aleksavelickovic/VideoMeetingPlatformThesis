package com.lilly.recorder.repository;

import com.lilly.recorder.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
    List<ApiKey> findAllByIsActiveTrueAndDeletedFalse();
}
