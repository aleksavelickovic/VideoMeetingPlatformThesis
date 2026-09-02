package com.lilly.recorder.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lilly.recorder.config.SystemConfigurationProperties;
import com.lilly.recorder.entity.Meeting;
import com.lilly.recorder.entity.Participant;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
public class MeetingEmailService {
    private static final Logger log = LoggerFactory.getLogger(MeetingEmailService.class);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy. HH:mm")
            .withZone(ZoneId.systemDefault());

    private final JavaMailSender mailSender;
    private final SystemConfigurationProperties properties;
    private final ObjectMapper objectMapper;

    public MeetingEmailService(JavaMailSender mailSender, SystemConfigurationProperties properties, ObjectMapper objectMapper) {
        this.mailSender = mailSender;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public void sendInvitations(Meeting meeting) {
        if (!properties.getMail().isEnabled()) return;
        for (Participant participant : meeting.getParticipants()) {
            if (participant.getEmail() == null || participant.getEmail().isBlank()) continue;
            try {
                sendInvitation(meeting, participant);
            } catch (Exception ex) {
                log.warn("Could not send meeting invitation to {}", participant.getEmail(), ex);
            }
        }
    }

    public void sendNotes(Meeting meeting) {
        String notes = richText(meeting.getNotes());
        if (notes.isBlank()) return;
        for (Participant participant : meeting.getParticipants()) {
            if (participant.getEmail() == null || participant.getEmail().isBlank()) continue;
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
                helper.setFrom(properties.getMail().getFrom());
                helper.setTo(participant.getEmail());
                helper.setSubject("Meeting notes: " + meeting.getTitle());
                helper.setText(buildNotesHtml(meeting, participant, notes), true);
                mailSender.send(message);
            } catch (Exception exception) {
                log.warn("Could not send meeting notes to {}", participant.getEmail(), exception);
            }
        }
    }

    private String buildNotesHtml(Meeting meeting, Participant participant, String notes) {
        return """
                <!doctype html><html><body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#172033">
                <div style="max-width:620px;margin:0 auto;padding:32px 16px">
                  <div style="background:#172554;padding:24px 28px;border-radius:16px 16px 0 0;color:white">
                    <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:.8">Lilly Meetings</div>
                    <h1 style="margin:12px 0 0;font-size:26px">Notes from %s</h1>
                  </div>
                  <div style="background:white;padding:28px;border-radius:0 0 16px 16px;box-shadow:0 8px 24px #1e40781c">
                    <p style="margin:0 0 20px;font-size:16px">Hello %s, here are the notes from the meeting.</p>
                    <div style="border:1px solid #dbeafe;border-radius:12px;padding:20px;line-height:1.65;color:#475569">%s</div>
                    <p style="margin:24px 0 0;font-size:13px;color:#64748b">Meeting ended: %s</p>
                  </div>
                </div></body></html>
                """.formatted(escape(meeting.getTitle()), escape(participant.getName()), notes,
                meeting.getEndedAt() == null ? "—" : DATE_FORMAT.format(meeting.getEndedAt()));
    }

    private void sendInvitation(Meeting meeting, Participant participant) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
        helper.setFrom(properties.getMail().getFrom());
        helper.setTo(participant.getEmail());
        helper.setSubject("Invitation: " + meeting.getTitle());
        helper.setText(buildHtml(meeting, participant), true);
        mailSender.send(message);
    }

    private String buildHtml(Meeting meeting, Participant participant) {
        String title = escape(meeting.getTitle());
        String invitation = participant.getInvitationText() == null ? "" :
                nl2br(escape(participant.getInvitationText()));
        String summary = richText(meeting.getMetadata());
        String start = meeting.getScheduledAt() == null ? "—" : DATE_FORMAT.format(meeting.getScheduledAt());
        String end = meeting.getScheduledAt() == null ? "—" : DATE_FORMAT.format(meeting.getScheduledAt().plusSeconds(meeting.getDurationLimitMinutes() * 60L));
        String duration = formatDuration(meeting.getDurationLimitMinutes());

        return """
                <!doctype html><html><body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#172033">
                <div style="max-width:620px;margin:0 auto;padding:32px 16px">
                  <div style="background:#2563eb;padding:24px 28px;border-radius:16px 16px 0 0;color:white">
                    <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:.8">Lilly Meetings</div>
                    <h1 style="margin:12px 0 0;font-size:26px;line-height:1.2">You're invited to %s</h1>
                  </div>
                  <div style="background:white;padding:28px;border-radius:0 0 16px 16px;box-shadow:0 8px 24px #1e40781c">
                    <p style="margin:0 0 20px;font-size:16px">Hello %s, you have been invited to join this meeting.</p>
                    %s
                    <div style="background:#eff6ff;border-radius:12px;padding:16px;margin:20px 0">
                      <div style="font-size:13px;color:#64748b;margin-bottom:8px">MEETING DETAILS</div>
                      <div style="margin:5px 0"><strong>Starts:</strong> %s</div>
                      <div style="margin:5px 0"><strong>Ends:</strong> %s</div>
                      <div style="margin:5px 0"><strong>Duration:</strong> %s</div>
                    </div>
                    %s
                    <div style="text-align:center;margin:28px 0"><a href="%s" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:bold;padding:13px 26px;border-radius:9px">Join meeting</a></div>
                    <p style="font-size:12px;color:#64748b;word-break:break-all">If the button does not work, copy this link into your browser:<br><br>%s</p>
                  </div>
                  <p style="text-align:center;color:#94a3b8;font-size:12px;margin:18px 0">This invitation was sent by Lilly Meetings.</p>
                </div></body></html>
                """.formatted(title, escape(participant.getName()), invitationBlock(invitation), start, end, duration,
                summaryBlock(summary), escapeAttribute(participant.getJoinLink()), escape(participant.getJoinLink()));
    }

    private String invitationBlock(String invitation) {
        return invitation.isBlank() ? "" : "<div style=\"border-left:3px solid #93c5fd;padding:4px 0 4px 14px;margin:18px 0;color:#475569\">" + invitation + "</div>";
    }

    private String summaryBlock(String summary) {
        return summary.isBlank() ? "" : "<div style=\"margin:22px 0\"><div style=\"font-size:13px;color:#64748b;margin-bottom:8px\">SUMMARY</div><div style=\"line-height:1.6;color:#475569\">" + summary + "</div></div>";
    }

    private String richText(String storedMetadata) {
        if (storedMetadata == null || storedMetadata.isBlank()) return "";
        String html = storedMetadata;
        try {
            html = objectMapper.readValue(storedMetadata, String.class);
        } catch (Exception ignored) {
        }
        return html.replaceAll("(?is)<!--.*?-->|<\\s*(script|style)[^>]*>.*?<\\s*/\\s*\\1\\s*>", "")
                .replaceAll("(?i)\\s+on[a-z]+\\s*=\\s*(\"[^\"]*\"|'[^']*'|[^\\s>]+)", "")
                .replaceAll("(?i)javascript:", "");
    }

    private String formatDuration(int minutes) {
        return minutes + (minutes == 1 ? " minute" : " minutes");
    }

    private String nl2br(String text) {
        return text.replace("\n", "<br>");
    }

    private String escape(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }

    private String escapeAttribute(String value) {
        return escape(value).replace("'", "&#39;");
    }
}
