package com.lilly.recorder.repository;

import com.lilly.recorder.entity.Participant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ParticipantRepository extends JpaRepository<Participant, Long> {
    Optional<Participant> findByLiveKitEgressIdAndDeletedFalse(String liveKitEgressId);
}
