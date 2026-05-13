package com.lilly.recorder.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lilly.recorder.constants.CallbackStatus;
import com.lilly.recorder.constants.MeetingStatus;
import com.lilly.recorder.dto.CallbackPayloadDto;
import com.lilly.recorder.entity.CallbackAttempt;
import com.lilly.recorder.entity.Meeting;
import com.lilly.recorder.entity.Participant;
import com.lilly.recorder.mapper.MeetingMapper;
import com.lilly.recorder.repository.CallbackAttemptRepository;
import com.lilly.recorder.repository.MeetingRepository;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;

@Service
public class CallbackService {
    private static final int[] BACKOFF_MINUTES = {1, 5, 30};
    private static final int MAX_ATTEMPTS = 3;

    private final MeetingRepository meetingRepository;
    private final CallbackAttemptRepository callbackAttemptRepository;
    private final MeetingMapper meetingMapper;
    private final S3Service s3Service;
    private final TaskScheduler taskScheduler;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    public CallbackService(
            MeetingRepository meetingRepository,
            CallbackAttemptRepository callbackAttemptRepository,
            MeetingMapper meetingMapper,
            S3Service s3Service,
            TaskScheduler taskScheduler,
            ObjectMapper objectMapper
    ) {
        this.meetingRepository = meetingRepository;
        this.callbackAttemptRepository = callbackAttemptRepository;
        this.meetingMapper = meetingMapper;
        this.s3Service = s3Service;
        this.taskScheduler = taskScheduler;
        this.objectMapper = objectMapper;
    }

    public void dispatch(Meeting meeting) {
        if (meeting == null || meeting.getCallbackUrl() == null || meeting.getCallbackUrl().isBlank()) {
            return;
        }
        scheduleSend(meeting.getId(), 1, Instant.now());
    }

    public void scheduleSend(Long meetingId, int attemptNumber, Instant when) {
        taskScheduler.schedule(() -> send(meetingId, attemptNumber), when);
    }

    @Transactional
    public boolean send(Long meetingId, int attemptNumber) {
        Meeting meeting = meetingRepository.findByIdAndDeletedFalse(meetingId).orElse(null);
        if (meeting == null || meeting.getCallbackUrl() == null || meeting.getCallbackUrl().isBlank()) {
            return false;
        }

        String recordingUrl = null;
        if (meeting.getRecordingS3Bucket() != null && meeting.getRecordingS3Key() != null) {
            recordingUrl = safePresignedUrl(meeting.getRecordingS3Bucket(), meeting.getRecordingS3Key());
        }
        Map<String, String> participantUrls = new HashMap<>();
        for (Participant participant : meeting.getParticipants()) {
            if (participant.getRecordingS3Key() != null && meeting.getRecordingS3Bucket() != null) {
                participantUrls.put(participant.getName(), safePresignedUrl(meeting.getRecordingS3Bucket(), participant.getRecordingS3Key()));
            }
        }

        CallbackPayloadDto payload = meetingMapper.toCallbackPayload(
                meeting,
                meetingMapper.readMetadata(meeting.getMetadata()),
                recordingUrl,
                participantUrls
        );
        String json = serialize(payload);
        String signature = sign(meeting.getCallbackSecret(), json);

        Integer statusCode = null;
        boolean success = false;
        String errorMessage = null;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.add("X-Signature", signature);
            ResponseEntity<String> response = restTemplate.postForEntity(meeting.getCallbackUrl(), new HttpEntity<>(json, headers), String.class);
            statusCode = response.getStatusCode().value();
            success = response.getStatusCode().is2xxSuccessful();
            if (!success) {
                errorMessage = "HTTP " + statusCode;
            }
        } catch (RestClientException ex) {
            errorMessage = ex.getMessage();
        }

        CallbackAttempt attempt = new CallbackAttempt();
        attempt.setMeeting(meeting);
        attempt.setAttemptNumber(attemptNumber);
        attempt.setStatusCode(statusCode);
        attempt.setSuccess(success);
        attempt.setErrorMessage(errorMessage);
        callbackAttemptRepository.save(attempt);

        if (!success) {
            if (attemptNumber < MAX_ATTEMPTS) {
                scheduleSend(meeting.getId(), attemptNumber + 1, Instant.now().plusSeconds(BACKOFF_MINUTES[attemptNumber - 1] * 60L));
            } else {
                meeting.setStatus(MeetingStatus.CALLBACK_FAILED);
                meetingRepository.save(meeting);
            }
        }

        return success;
    }

    private String safePresignedUrl(String bucket, String key) {
        try {
            return s3Service.generatePresignedUrl(bucket, key);
        } catch (Exception ex) {
            return null;
        }
    }

    private String serialize(CallbackPayloadDto payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Unable to serialize callback payload", ex);
        }
    }

    private String sign(String secret, String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return "sha256=" + HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to sign callback payload", ex);
        }
    }
}
