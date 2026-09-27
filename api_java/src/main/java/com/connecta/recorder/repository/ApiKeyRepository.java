package com.connecta.recorder.repository;

import com.connecta.recorder.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
    List<ApiKey> findAllByIsActiveTrueAndDeletedFalse();
}
