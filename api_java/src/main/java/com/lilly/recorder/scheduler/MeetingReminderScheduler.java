package com.lilly.recorder.scheduler;

import com.lilly.recorder.service.MeetingService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class MeetingReminderScheduler {
    private final MeetingService meetingService;

    public MeetingReminderScheduler(MeetingService meetingService) {
        this.meetingService = meetingService;
    }

    @Scheduled(fixedDelay = 60000)
    public void execute() {
        meetingService.sendDueMeetingReminders();
    }
}
