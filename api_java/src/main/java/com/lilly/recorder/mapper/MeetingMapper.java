package com.lilly.recorder.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lilly.recorder.constants.MeetingStatus;
import com.lilly.recorder.constants.ParticipantRole;
import com.lilly.recorder.dto.CallbackPayloadDto;
import com.lilly.recorder.dto.CreateMeetingDto;
import com.lilly.recorder.dto.CreateMeetingResponse;
import com.lilly.recorder.dto.MeetingDto;
import com.lilly.recorder.dto.ParticipantDto;
import com.lilly.recorder.entity.Meeting;
import com.lilly.recorder.entity.Participant;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class MeetingMapper {
    private final ObjectMapper objectMapper;

    public MeetingMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Meeting toEntity(CreateMeetingDto dto) {
        Meeting meeting = new Meeting();
        meeting.setTitle(dto.getTitle());
        meeting.setScheduledAt(dto.getScheduledAt());
        meeting.setDurationLimitMinutes(dto.getDurationLimitMinutes());
        meeting.setRecordingEnabled(dto.getRecording().isEnabled());
        meeting.setRecordingFormat(dto.getRecording().getFormat());
        meeting.setRecordingWidth(dto.getRecording().getWidth());
        meeting.setRecordingHeight(dto.getRecording().getHeight());
        meeting.setStatus(MeetingStatus.IN_PROGRESS);
        meeting.setStartedAt(java.time.Instant.now());
        if (dto.getMetadata() != null) {
            try {
                meeting.setMetadata(objectMapper.writeValueAsString(dto.getMetadata()));
            } catch (JsonProcessingException ex) {
                throw new IllegalArgumentException("Unable to serialize metadata", ex);
            }
        }

        List<Participant> participants = dto.getParticipants().stream().map(item -> {
            Participant participant = new Participant();
            participant.setMeeting(meeting);
            participant.setName(item.getName());
            participant.setEmail(item.getEmail());
            participant.setInvitationText(item.getInvitationText());
            participant.setRole(ParticipantRole.fromValue(item.getRole()));
            return participant;
        }).collect(java.util.stream.Collectors.toCollection(ArrayList::new));
        meeting.setParticipants(participants);
        return meeting;
    }

    public MeetingDto toDto(Meeting meeting, Map<String, String> participantPresignedUrls, String recordingPresignedUrl) {
        MeetingDto dto = new MeetingDto();
        dto.setId(meeting.getId());
        dto.setDateCreated(meeting.getDateCreated());
        dto.setRoomId(meeting.getRoomId());
        dto.setTitle(meeting.getTitle());
        dto.setStatus(meeting.getStatus().getValue());
        dto.setScheduledAt(meeting.getScheduledAt());
        dto.setDurationLimitMinutes(meeting.getDurationLimitMinutes());
        dto.setRecordingEnabled(meeting.isRecordingEnabled());
        dto.setStartedAt(meeting.getStartedAt());
        dto.setEndedAt(meeting.getEndedAt());
        dto.setParticipants(meeting.getParticipants().stream().map(participant -> toParticipantDto(participant, participantPresignedUrls.get(participant.getName()))).toList());

        if (meeting.getRecordingS3Key() != null) {
            MeetingDto.RecordingDto recordingDto = new MeetingDto.RecordingDto();
            recordingDto.setS3Bucket(meeting.getRecordingS3Bucket());
            recordingDto.setS3Key(meeting.getRecordingS3Key());
            recordingDto.setWidth(meeting.getRecordingWidth());
            recordingDto.setHeight(meeting.getRecordingHeight());
            recordingDto.setPresignedUrl(recordingPresignedUrl);
            recordingDto.setSizeBytes(meeting.getRecordingSizeBytes());
            recordingDto.setDurationSeconds(meeting.getRecordingDurationSeconds());
            recordingDto.setFormat(meeting.getRecordingFormat());
            dto.setRecording(recordingDto);
        }

        return dto;
    }

    public ParticipantDto toParticipantDto(Participant participant, String presignedUrl) {
        ParticipantDto dto = new ParticipantDto();
        dto.setId(participant.getId());
        dto.setDateCreated(participant.getDateCreated());
        dto.setName(participant.getName());
        dto.setRole(participant.getRole().getValue());
        dto.setJoinLink(participant.getJoinLink());
        dto.setJoinedAt(participant.getJoinedAt());
        dto.setLeftAt(participant.getLeftAt());
        dto.setToken(participant.getToken());
        dto.setRecordingPresignedUrl(presignedUrl);
        return dto;
    }

    public CreateMeetingResponse toCreateResponse(Meeting meeting) {
        CreateMeetingResponse response = new CreateMeetingResponse();
        response.setId(meeting.getId());
        response.setRoomId(meeting.getRoomId());
        response.setTitle(meeting.getTitle());
        response.setStatus(meeting.getStatus().getValue());
        response.setRecordingEnabled(meeting.isRecordingEnabled());
        response.setStartedAt(meeting.getStartedAt());
        response.setEndedAt(meeting.getEndedAt());
        response.setParticipants(meeting.getParticipants().stream().map(participant -> {
            CreateMeetingResponse.ParticipantResponse item = new CreateMeetingResponse.ParticipantResponse();
            item.setId(participant.getId());
            item.setName(participant.getName());
            item.setRole(participant.getRole().getValue());
            item.setJoinLink(participant.getJoinLink());
            return item;
        }).toList());
        return response;
    }

    public CallbackPayloadDto toCallbackPayload(Meeting meeting, Object metadataObject, String recordingPresignedUrl, Map<String, String> participantPresignedUrls) {
        CallbackPayloadDto dto = new CallbackPayloadDto();
        dto.setEvent("meeting.ended");
        dto.setMeetingId(meeting.getRoomId().toString());
        dto.setStatus(meeting.getStatus().getValue());
        dto.setStartedAt(meeting.getStartedAt());
        dto.setEndedAt(meeting.getEndedAt());
        if (meeting.getStartedAt() != null && meeting.getEndedAt() != null) {
            dto.setDurationSeconds((int) java.time.Duration.between(meeting.getStartedAt(), meeting.getEndedAt()).getSeconds());
        }
        dto.setMetadata(metadataObject);
        dto.setParticipantsJoined(meeting.getParticipants().stream()
                .filter(participant -> participant.getJoinedAt() != null)
                .map(participant -> {
                    CallbackPayloadDto.CallbackParticipantDto item = new CallbackPayloadDto.CallbackParticipantDto();
                    item.setName(participant.getName());
                    item.setRole(participant.getRole().getValue());
                    item.setJoinedAt(participant.getJoinedAt());
                    item.setLeftAt(participant.getLeftAt());
                    item.setPresignedUrl(participantPresignedUrls.get(participant.getName()));
                    return item;
                }).toList());
        if (meeting.getRecordingS3Key() != null) {
            CallbackPayloadDto.CallbackRecordingDto recording = new CallbackPayloadDto.CallbackRecordingDto();
            recording.setS3Bucket(meeting.getRecordingS3Bucket());
            recording.setS3Key(meeting.getRecordingS3Key());
            recording.setWidth(meeting.getRecordingWidth());
            recording.setHeight(meeting.getRecordingHeight());
            recording.setPresignedUrl(recordingPresignedUrl);
            recording.setSizeBytes(meeting.getRecordingSizeBytes());
            recording.setDurationSeconds(meeting.getRecordingDurationSeconds());
            recording.setFormat(meeting.getRecordingFormat());
            dto.setRecording(recording);
        }
        return dto;
    }

    public Object readMetadata(String metadata) {
        if (metadata == null || metadata.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(metadata, Object.class);
        } catch (JsonProcessingException ex) {
            return metadata;
        }
    }
}
