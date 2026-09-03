package com.lilly.recorder.repository;

import com.lilly.recorder.constants.MeetingStatus;
import com.lilly.recorder.entity.Meeting;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MeetingRepository extends JpaRepository<Meeting, Long>, JpaSpecificationExecutor<Meeting> {
    @EntityGraph(attributePaths = {"participants"})
    Optional<Meeting> findByIdAndDeletedFalse(Long id);

    @EntityGraph(attributePaths = {"participants"})
    Optional<Meeting> findByRoomIdAndDeletedFalse(UUID roomId);

    @EntityGraph(attributePaths = {"participants"})
    Optional<Meeting> findByLiveKitEgressIdAndDeletedFalse(String liveKitEgressId);

    List<Meeting> findAllByStatusAndDeletedFalse(MeetingStatus status);

    @EntityGraph(attributePaths = {"participants"})
    List<Meeting> findAllByOwnerSubjectAndDeletedFalseOrderByDateCreatedDesc(String ownerSubject);
}
