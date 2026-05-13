package com.lilly.recorder.controller;

import com.lilly.recorder.constants.MeetingStatus;
import com.lilly.recorder.constants.ParticipantRole;
import com.lilly.recorder.entity.Meeting;
import com.lilly.recorder.entity.Participant;
import com.lilly.recorder.service.CallbackService;
import com.lilly.recorder.service.LiveKitService;
import com.lilly.recorder.service.MeetingService;
import jakarta.servlet.http.HttpServletRequest;
import livekit.LivekitEgress;
import livekit.LivekitModels;
import livekit.LivekitWebhook;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/webhook")
public class WebhookController {
    private final MeetingService meetingService;
    private final CallbackService callbackService;
    private final LiveKitService liveKitService;

    public WebhookController(MeetingService meetingService, CallbackService callbackService, LiveKitService liveKitService) {
        this.meetingService = meetingService;
        this.callbackService = callbackService;
        this.liveKitService = liveKitService;
    }

    @PostMapping("/livekit")
    public ResponseEntity<Void> livekitWebhook(@RequestBody String body, HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        LivekitWebhook.WebhookEvent event;
        try {
            event = liveKitService.parseWebhook(body, authorization == null ? "" : authorization);
        } catch (Exception ex) {
            return ResponseEntity.ok().build();
        }

        try {
            if ("egress_ended".equals(event.getEvent()) && event.hasEgressInfo()) {
                handleEgressEnded(event.getEgressInfo());
            }
            if ("participant_joined".equals(event.getEvent()) && event.hasParticipant()) {
                handleParticipantJoined(event.getParticipant(), event.hasRoom() ? event.getRoom().getName() : "");
            }
            if ("participant_left".equals(event.getEvent()) && event.hasParticipant()) {
                handleParticipantLeft(event.getParticipant(), event.hasRoom() ? event.getRoom().getName() : "");
            }
        } catch (Exception ignored) {
        }

        return ResponseEntity.ok().build();
    }

    void handleEgressEnded(LivekitEgress.EgressInfo egressInfo) {
        if (egressInfo.getRequestCase() == LivekitEgress.EgressInfo.RequestCase.PARTICIPANT) {
            meetingService.updateParticipantRecordingInfo(egressInfo);
            return;
        }

        Meeting meeting = meetingService.getByEgressId(egressInfo.getEgressId()).orElse(null);
        if (meeting == null) {
            return;
        }

        meetingService.updateRecordingInfo(meeting.getId(), egressInfo);
        Meeting refreshed = meetingService.getByEgressId(egressInfo.getEgressId()).orElse(null);
        if (refreshed != null && refreshed.getStatus() == MeetingStatus.COMPLETED) {
            callbackService.dispatch(refreshed);
        }
    }

    void handleParticipantJoined(LivekitModels.ParticipantInfo participant, String roomName) {
        if (participant.getIdentity().startsWith("EG_")) {
            return;
        }
        meetingService.setInProgressByRoom(roomName);
        meetingService.updateParticipantTimestamp(participant.getIdentity(), roomName, true);

        Meeting meeting = meetingService.getByRoomId(java.util.UUID.fromString(roomName));
        if (!meeting.isRecordingEnabled()) {
            return;
        }

        Participant dbParticipant = meeting.getParticipants().stream()
                .filter(item -> item.getName().equals(participant.getIdentity()))
                .findFirst()
                .orElse(null);
        if (dbParticipant == null || dbParticipant.getRole() != ParticipantRole.GUEST) {
            return;
        }

        String s3Key = "recordings/" + meeting.getRoomId() + "/participants/" + participant.getIdentity() + "-" +
                java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss").withZone(java.time.ZoneOffset.UTC).format(Instant.now()) + ".mp4";
        String egressId = liveKitService.startParticipantRecording(
                roomName,
                participant.getIdentity(),
                meeting.getRecordingS3Bucket(),
                s3Key,
                meeting.getRecordingWidth(),
                meeting.getRecordingHeight()
        );
        meetingService.saveParticipantEgressId(participant.getIdentity(), roomName, egressId, s3Key);
    }

    void handleParticipantLeft(LivekitModels.ParticipantInfo participant, String roomName) {
        if (participant.getIdentity().startsWith("EG_")) {
            return;
        }
        meetingService.updateParticipantTimestamp(participant.getIdentity(), roomName, false);
    }
}
