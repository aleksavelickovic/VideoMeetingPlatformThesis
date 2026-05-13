package com.lilly.recorder.scheduler;

import com.lilly.recorder.constants.EndMeetingReason;
import com.lilly.recorder.entity.Meeting;
import com.lilly.recorder.service.MeetingService;
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
            Instant timeout = meeting.getScheduledAt() != null ? meeting.getScheduledAt() : meeting.getDateCreated();
            if (!Instant.now().isBefore(timeout)) {
                try {
                    meetingService.cancelIfNotStarted(meeting.getId());
                } catch (Exception ignored) {
                }
            }
        }
    }
}
