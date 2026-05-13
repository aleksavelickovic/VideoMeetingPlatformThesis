package com.lilly.recorder.repository;

import com.lilly.recorder.entity.CallbackAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CallbackAttemptRepository extends JpaRepository<CallbackAttempt, Long> {
}
