package com.connecta.recorder.scheduler;

import com.connecta.recorder.service.MeetingService;
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
