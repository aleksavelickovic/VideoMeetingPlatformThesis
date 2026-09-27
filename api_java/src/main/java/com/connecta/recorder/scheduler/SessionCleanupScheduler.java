package com.connecta.recorder.scheduler;

import com.connecta.recorder.constants.EndMeetingReason;
import com.connecta.recorder.entity.Meeting;
import com.connecta.recorder.service.MeetingService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class SessionCleanupScheduler {
    private final MeetingService meetingService;

    public SessionCleanupScheduler(MeetingService meetingService) {
        this.meetingService = meetingService;
    }

    @Scheduled(fixedDelay = 60000)
    public void execute() {
        for (Meeting meeting : meetingService.getActiveMeetings()) {
            if (meeting.getStartedAt() == null) {
                continue;
            }
            Instant scheduledEnd = meeting.getStartedAt().plusSeconds(meeting.getDurationLimitMinutes() * 60L);
            if (!Instant.now().isBefore(scheduledEnd)) {
                try {
                    meetingService.endMeeting(meeting.getRoomId(), EndMeetingReason.TIMEOUT);
                } catch (Exception ignored) {
                }
            }
        }

        for (Meeting meeting : meetingService.getScheduledMeetings()) {
            Instant meetingStart = meeting.getScheduledAt() != null ? meeting.getScheduledAt() : meeting.getDateCreated();
            Instant timeout = meetingStart.plusSeconds((meeting.getDurationLimitMinutes() + 15L) * 60L);
            if (!Instant.now().isBefore(timeout)) {
                try {
                    meetingService.cancelIfNotStarted(meeting.getId());
                } catch (Exception ignored) {
                }
            }
        }
    }
}
