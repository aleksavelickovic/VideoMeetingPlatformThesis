package com.lilly.recorder.service;

import com.lilly.recorder.config.SystemConfigurationProperties;
import com.lilly.recorder.constants.EndMeetingReason;
import com.lilly.recorder.constants.MeetingStatus;
import com.lilly.recorder.dto.CreateMeetingDto;
import com.lilly.recorder.dto.FilterList;
import com.lilly.recorder.dto.MeetingFilterRequest;
import com.lilly.recorder.entity.Meeting;
import com.lilly.recorder.entity.Participant;
import com.lilly.recorder.mapper.MeetingMapper;
import com.lilly.recorder.repository.MeetingRepository;
import com.lilly.recorder.repository.ParticipantRepository;
import jakarta.persistence.criteria.Predicate;
import livekit.LivekitEgress;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class MeetingService {
    private final MeetingRepository meetingRepository;
    private final ParticipantRepository participantRepository;
    private final LiveKitService liveKitService;
    private final CallbackService callbackService;
    private final S3Service s3Service;
    private final MeetingMapper meetingMapper;
    private final SystemConfigurationProperties properties;

    public MeetingService(
            MeetingRepository meetingRepository,
            ParticipantRepository participantRepository,
            LiveKitService liveKitService,
            CallbackService callbackService,
            S3Service s3Service,
            MeetingMapper meetingMapper,
            SystemConfigurationProperties properties
    ) {
        this.meetingRepository = meetingRepository;
        this.participantRepository = participantRepository;
        this.liveKitService = liveKitService;
        this.callbackService = callbackService;
        this.s3Service = s3Service;
        this.meetingMapper = meetingMapper;
        this.properties = properties;
    }

    @Transactional
    public Meeting create(CreateMeetingDto dto) {
        if (dto.getParticipants() == null || dto.getParticipants().size() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least 2 participants are required");
        }
        if (dto.getCallbackUrl() == null || dto.getCallbackUrl().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Callback URL is required");
        }
        if (dto.getParticipants().stream().anyMatch(item -> item.getName() == null || item.getName().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All meeting participants must have names");
        }

        Meeting meeting = meetingMapper.toEntity(dto);
        meeting.setRoomId(UUID.randomUUID());
        meeting.setStatus(MeetingStatus.SCHEDULED);
        meeting = meetingRepository.save(meeting);
        meetingRepository.flush();

        liveKitService.createRoom(meeting.getRoomId().toString());

        for (Participant participant : meeting.getParticipants()) {
            String token = liveKitService.generateToken(
                    meeting.getRoomId().toString(),
                    participant.getName(),
                    true,
                    true,
                    participant.getRole().getValue()
            );
            participant.setToken(token);
            participant.setJoinLink(dto.getJoinBaseUrl() + "/room/" + meeting.getRoomId() + "?token=" + token);
        }
        meeting.setStatus(MeetingStatus.IN_PROGRESS);
        meeting.setStartedAt(Instant.now());

        if (dto.getRecording().isEnabled()) {
            String s3Key = "recordings/" + meeting.getRoomId() + "/" + java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss").withZone(java.time.ZoneOffset.UTC).format(Instant.now()) + ".mp4";
            String egressId = liveKitService.startRecording(
                    meeting.getRoomId().toString(),
                    properties.getS3().getBucket(),
                    s3Key,
                    meeting.getRecordingWidth(),
                    meeting.getRecordingHeight()
            );
            meeting.setLiveKitEgressId(egressId);
            meeting.setRecordingS3Bucket(properties.getS3().getBucket());
            meeting.setRecordingS3Key(s3Key);
        }
        return meetingRepository.save(meeting);
    }

    @Transactional(readOnly = true)
    public FilterList<Meeting> getList(MeetingFilterRequest filter) {
        Specification<Meeting> specification = (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.isFalse(root.get("deleted")));
            if (filter.getStatus() != null && !filter.getStatus().isBlank()) {
                predicates.add(builder.equal(root.get("status"), MeetingStatus.fromValue(filter.getStatus())));
            }
            if (filter.getFrom() != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("dateCreated"), filter.getFrom()));
            }
            if (filter.getTo() != null) {
                predicates.add(builder.lessThanOrEqualTo(root.get("dateCreated"), filter.getTo()));
            }
            return builder.and(predicates.toArray(new Predicate[0]));
        };

        var page = meetingRepository.findAll(specification, PageRequest.of(filter.getPage() - 1, filter.getPerPage()));
        return new FilterList<>(page.getContent(), page.getTotalElements(), filter.getPage(), filter.getPerPage());
    }

    @Transactional(readOnly = true)
    public Meeting getByRoomId(UUID roomId) {
        return meetingRepository.findByRoomIdAndDeletedFalse(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meeting not found"));
    }

    @Transactional(readOnly = true)
    public Optional<Meeting> getByEgressId(String egressId) {
        return meetingRepository.findByLiveKitEgressIdAndDeletedFalse(egressId);
    }

    @Transactional
    public Meeting endMeeting(UUID roomId, EndMeetingReason reason) {
        if (roomId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Validation failed");
        }
        Meeting meeting = getByRoomId(roomId);
        if (meeting.getStatus() != MeetingStatus.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Meeting is not in progress");
        }

        for (Participant participant : meeting.getParticipants()) {
            if (participant.getLiveKitEgressId() != null && !participant.getLiveKitEgressId().isBlank()) {
                liveKitService.stopRecording(participant.getLiveKitEgressId());
            }
        }

        if (meeting.getLiveKitEgressId() != null && !meeting.getLiveKitEgressId().isBlank()) {
            try {
                LivekitEgress.EgressInfo egressInfo = liveKitService.stopRecording(meeting.getLiveKitEgressId());
                if (egressInfo != null) {
                    if (egressInfo.getFile() != null) {
                        meeting.setRecordingDurationSeconds((int) (egressInfo.getFile().getDuration() / 1_000_000_000L));
                        meeting.setRecordingSizeBytes(egressInfo.getFile().getSize());
                    }
                }
            } catch (RuntimeException ex) {
                meeting.setStatus(MeetingStatus.RECORDING_FAILED);
                Meeting saved = meetingRepository.save(meeting);
                callbackService.dispatch(saved);
                liveKitService.deleteRoom(roomId.toString());
                return saved;
            }
        }

        liveKitService.deleteRoom(roomId.toString());
        meeting.setStatus(MeetingStatus.COMPLETED);
        meeting.setEndedAt(Instant.now());
        Meeting saved = meetingRepository.save(meeting);
        if (!saved.isRecordingEnabled() || saved.getLiveKitEgressId() == null || saved.getLiveKitEgressId().isBlank()) {
            callbackService.dispatch(saved);
        }
        return saved;
    }

    @Transactional
    public void updateRecordingInfo(Long meetingId, LivekitEgress.EgressInfo egressInfo) {
        Meeting meeting = meetingRepository.findByIdAndDeletedFalse(meetingId).orElse(null);
        if (meeting == null) {
            return;
        }
        if (egressInfo.getFileResultsCount() > 0) {
            LivekitEgress.FileInfo fileInfo = egressInfo.getFileResults(0);
            if (!fileInfo.getFilename().isBlank()) {
                meeting.setRecordingS3Key(fileInfo.getFilename());
            }
            if (fileInfo.getSize() > 0) {
                meeting.setRecordingSizeBytes(fileInfo.getSize());
            }
        }
        meeting.setRecordingS3Bucket(properties.getS3().getBucket());
        if (egressInfo.getFile() != null && egressInfo.getFile().getDuration() > 0) {
            meeting.setRecordingDurationSeconds((int) (egressInfo.getFile().getDuration() / 1_000_000_000L));
        }
        meetingRepository.save(meeting);
    }

    @Transactional
    public boolean updateParticipantRecordingInfo(LivekitEgress.EgressInfo egressInfo) {
        if (egressInfo.getFileResultsCount() == 0) {
            return false;
        }
        Participant participant = participantRepository.findByLiveKitEgressIdAndDeletedFalse(egressInfo.getEgressId()).orElse(null);
        if (participant == null) {
            return false;
        }
        LivekitEgress.FileInfo fileInfo = egressInfo.getFileResults(0);
        if (fileInfo.getSize() > 0) {
            participant.setRecordingSizeBytes(fileInfo.getSize());
        }
        if (egressInfo.getFile() != null && egressInfo.getFile().getDuration() > 0) {
            participant.setRecordingDurationSeconds((int) (egressInfo.getFile().getDuration() / 1_000_000_000L));
        }
        participantRepository.save(participant);
        return true;
    }

    @Transactional
    public void setInProgressByRoom(String roomName) {
        if (roomName == null || roomName.isBlank()) {
            return;
        }
        UUID roomId = UUID.fromString(roomName);
        meetingRepository.findByRoomIdAndDeletedFalse(roomId).ifPresent(meeting -> {
            if (meeting.getStatus() == MeetingStatus.SCHEDULED) {
                meeting.setStatus(MeetingStatus.IN_PROGRESS);
                meeting.setStartedAt(Instant.now());
                meetingRepository.save(meeting);
            }
        });
    }

    @Transactional
    public void updateParticipantTimestamp(String identity, String roomName, boolean joined) {
        Meeting meeting = meetingRepository.findByRoomIdAndDeletedFalse(UUID.fromString(roomName)).orElse(null);
        if (meeting == null) {
            return;
        }
        meeting.getParticipants().stream()
                .filter(participant -> participant.getName().equals(identity))
                .findFirst()
                .ifPresent(participant -> {
                    if (joined) {
                        participant.setJoinedAt(Instant.now());
                    } else {
                        participant.setLeftAt(Instant.now());
                    }
                    participantRepository.save(participant);
                });
    }

    @Transactional
    public void saveParticipantEgressId(String identity, String roomName, String egressId, String s3Key) {
        Meeting meeting = meetingRepository.findByRoomIdAndDeletedFalse(UUID.fromString(roomName)).orElse(null);
        if (meeting == null) {
            return;
        }
        meeting.getParticipants().stream()
                .filter(participant -> participant.getName().equals(identity))
                .findFirst()
                .ifPresent(participant -> {
                    participant.setLiveKitEgressId(egressId);
                    participant.setRecordingS3Key(s3Key);
                    participantRepository.save(participant);
                });
    }

    @Transactional
    public void cancelIfNotStarted(Long meetingId) {
        meetingRepository.findByIdAndDeletedFalse(meetingId).ifPresent(meeting -> {
            if (meeting.getStatus() == MeetingStatus.SCHEDULED) {
                meeting.setStatus(MeetingStatus.FAILED);
                Meeting saved = meetingRepository.save(meeting);
                callbackService.dispatch(saved);
            }
        });
    }

    @Transactional(readOnly = true)
    public List<Meeting> getActiveMeetings() {
        return meetingRepository.findAllByStatusAndDeletedFalse(MeetingStatus.IN_PROGRESS);
    }

    @Transactional(readOnly = true)
    public List<Meeting> getScheduledMeetings() {
        return meetingRepository.findAllByStatusAndDeletedFalse(MeetingStatus.SCHEDULED);
    }

    @Transactional(readOnly = true)
    public String getMeetingPresignedUrl(Meeting meeting) {
        if (meeting.getRecordingS3Bucket() != null && meeting.getRecordingS3Key() != null) {
            return s3Service.generatePresignedUrl(meeting.getRecordingS3Bucket(), meeting.getRecordingS3Key());
        }
        return null;
    }

    @Transactional(readOnly = true)
    public Map<String, String> getParticipantPresignedUrls(Meeting meeting) {
        java.util.Map<String, String> result = new java.util.HashMap<>();
        for (Participant participant : meeting.getParticipants()) {
            if (participant.getRecordingS3Key() != null && meeting.getRecordingS3Bucket() != null) {
                result.put(participant.getName(), s3Service.generatePresignedUrl(meeting.getRecordingS3Bucket(), participant.getRecordingS3Key()));
            }
        }
        return result;
    }
}
