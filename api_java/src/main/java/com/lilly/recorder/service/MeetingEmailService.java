package com.lilly.recorder.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lilly.recorder.config.SystemConfigurationProperties;
import com.lilly.recorder.entity.Meeting;
import com.lilly.recorder.entity.Participant;
import com.lilly.recorder.constants.ParticipantRole;
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
import java.util.Locale;
import java.util.List;

@Service
public class MeetingEmailService {
    private static final Logger log = LoggerFactory.getLogger(MeetingEmailService.class);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy. HH:mm")
            .withZone(ZoneId.systemDefault());
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("hh:mm:ss a", Locale.ENGLISH)
            .withZone(ZoneId.systemDefault());

    private final JavaMailSender mailSender;
    private final SystemConfigurationProperties properties;
    private final ObjectMapper objectMapper;
    private final S3Service s3Service;

    public MeetingEmailService(JavaMailSender mailSender, SystemConfigurationProperties properties, ObjectMapper objectMapper, S3Service s3Service) {
        this.mailSender = mailSender;
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.s3Service = s3Service;
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
        if (!properties.getMail().isEnabled()) return;
        for (Participant participant : meeting.getParticipants()) {
            if (participant.getEmail() == null || participant.getEmail().isBlank()) continue;
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
                helper.setFrom(properties.getMail().getFrom());
                helper.setTo(participant.getEmail());
                helper.setSubject("Meeting report: " + meeting.getTitle());
                helper.setText(buildReportHtml(meeting, participant), true);
                mailSender.send(message);
            } catch (Exception exception) {
                log.warn("Could not send meeting notes to {}", participant.getEmail(), exception);
            }
        }
    }

    public void sendMeetingUpdate(Meeting meeting, List<String> changes) {
        if (!properties.getMail().isEnabled()) return;
        for (Participant participant : meeting.getParticipants()) {
            if (participant.getEmail() == null || participant.getEmail().isBlank()) continue;
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
                helper.setFrom(properties.getMail().getFrom());
                helper.setTo(participant.getEmail());
                helper.setSubject("Meeting updated: " + meeting.getTitle());
                helper.setText("<p>The meeting <strong>" + escape(meeting.getTitle()) + "</strong> was updated.</p>"
                        + "<p>Changed data: " + escape(String.join(", ", changes)) + ".</p>", true);
                mailSender.send(message);
            } catch (Exception exception) {
                log.warn("Could not send meeting update to {}", participant.getEmail(), exception);
            }
        }
    }

    private String buildReportHtml(Meeting meeting, Participant recipient) {
        String summary = richText(meeting.getMetadata());
        String notes = richText(meeting.getNotes());
        String recordingUrl = meeting.getRecordingS3Bucket() == null || meeting.getRecordingS3Key() == null ? "" :
                s3Service.generatePresignedUrl(meeting.getRecordingS3Bucket(), meeting.getRecordingS3Key());
        String resolution = meeting.isRecordingEnabled() ? meeting.getRecordingHeight() + "p" : "Off";
        String template = """
                <!doctype html><html><body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#172033">
                <div style="max-width:620px;margin:0 auto;padding:32px 16px">
                <div style="background:#172554;padding:24px 28px;border-radius:16px 16px 0 0;color:white">
                    <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:.8">Lilly Meetings</div>
                    <h1 style="margin:12px 0 0;font-size:26px">Meeting ended</h1>
                    <p style="margin:8px 0 0;font-size:17px;opacity:.9">{{title}}</p>
                </div>
                <div style="background:white;padding:28px;border-radius:0 0 16px 16px;box-shadow:0 8px 24px #1e40781c">
                    <p style="margin:0 0 20px;font-size:16px">Hello {{recipient}}, here is your meeting summary.</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                      <td style="width:33%;padding-right:6px"><div style="border-top:3px solid #60a5fa;background:#f8fafc;padding:14px"><div style="font-size:12px;color:#64748b">Duration</div><strong style="display:block;margin-top:8px;font-size:18px">{{duration}}</strong></div></td>
                      <td style="width:33%;padding:0 3px"><div style="border-top:3px solid #34d399;background:#f8fafc;padding:14px"><div style="font-size:12px;color:#64748b">Participants joined</div><strong style="display:block;margin-top:8px;font-size:18px">{{joined}} / {{total}}</strong></div></td>
                      <td style="width:33%;padding-left:6px"><div style="border-top:3px solid #a78bfa;background:#f8fafc;padding:14px"><div style="font-size:12px;color:#64748b">Recording</div><strong style="display:block;margin-top:8px;font-size:15px">{{resolution}}</strong></div></td>
                    </tr></table>
                    <div style="margin-top:12px;padding:13px 16px;border:1px solid #e2e8f0;border-radius:10px;color:#475569;font-size:13px">
                      <strong>Started:</strong> {{started}} &nbsp;·&nbsp; <strong>Ended:</strong> {{ended}}
                    </div>
                    {{summary}}
                    {{notes}}
                    <h2 style="font-size:16px;margin:28px 0 10px">Participant activity</h2>
                    <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">{{participants}}</div>
                    {{recordings}}
                </div>
                </div></body></html>
                """;
        return template.replace("{{title}}", escape(meeting.getTitle()))
                .replace("{{recipient}}", escape(recipient.getName()))
                .replace("{{duration}}", formatElapsedDuration(durationSeconds(meeting)))
                .replace("{{joined}}", String.valueOf(joinedCount(meeting)))
                .replace("{{total}}", String.valueOf(meeting.getParticipants().size()))
                .replace("{{resolution}}", escape(resolution))
                .replace("{{started}}", meetingTime(meeting.getStartedAt()))
                .replace("{{ended}}", meetingTime(meeting.getEndedAt()))
                .replace("{{summary}}", reportSection("Summary", summary))
                .replace("{{notes}}", reportSection("Meeting notes", notes))
                .replace("{{participants}}", participantRows(meeting))
                .replace("{{recordings}}", recordingSection(meeting, recipient, recordingUrl));
    }

    private String reportSection(String heading, String content) {
        return content.isBlank() ? "" : "<section style=\"margin:24px 0\"><h2 style=\"font-size:16px;margin:0 0 10px\">" + heading + "</h2><div style=\"border:1px solid #dbeafe;border-radius:12px;padding:18px;line-height:1.65;color:#475569\">" + content + "</div></section>";
    }

    private String participantRows(Meeting meeting) {
        return meeting.getParticipants().stream().map(participant -> {
            String activity = participant.getJoinedAt() == null ? "Did not join" :
                    "Joined: " + TIME_FORMAT.format(participant.getJoinedAt()) + " · Left: " +
                            (participant.getLeftAt() == null ? "Still in meeting" : TIME_FORMAT.format(participant.getLeftAt()));
            return "<div style=\"padding:13px 16px;border-bottom:1px solid #e2e8f0\"><strong>" + escape(participant.getName()) +
                    (participant.getRole() == ParticipantRole.HOST ? " <span style=\"color:#d97706;font-size:11px\">HOST</span>" : "") +
                    "</strong><div style=\"margin-top:4px;color:#64748b;font-size:12px\">" + escape(activity) + "</div></div>";
        }).collect(java.util.stream.Collectors.joining());
    }

    private String recordingSection(Meeting meeting, Participant recipient, String recordingUrl) {
        if (recipient.getRole() != ParticipantRole.HOST || !meeting.isRecordingEnabled()) return "";
        StringBuilder html = new StringBuilder("<section style=\"margin:26px 0 0\"><h2 style=\"font-size:16px;margin:0 0 10px\">Recordings</h2>");
        if (!recordingUrl.isBlank()) html.append(button(recordingUrl, "Download full meeting recording"));
        for (Participant participant : meeting.getParticipants()) {
            if (meeting.getRecordingS3Bucket() == null || participant.getRecordingS3Key() == null) continue;
            String url = s3Service.generatePresignedUrl(meeting.getRecordingS3Bucket(), participant.getRecordingS3Key());
            html.append(button(url, "Download " + participant.getName() + " recording"));
        }
        return html.append("</section>").toString();
    }

    private String button(String url, String label) {
        return "<a href=\"" + escapeAttribute(url) + "\" style=\"display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:bold;padding:11px 16px;border-radius:8px;margin:0 8px 8px 0;font-size:13px\">" + escape(label) + "</a>";
    }

    private int joinedCount(Meeting meeting) {
        return (int) meeting.getParticipants().stream().filter(participant -> participant.getJoinedAt() != null).count();
    }

    private long durationSeconds(Meeting meeting) {
        if (meeting.getStartedAt() == null || meeting.getEndedAt() == null) return meeting.getDurationLimitMinutes() * 60L;
        return Math.max(0, java.time.Duration.between(meeting.getStartedAt(), meeting.getEndedAt()).getSeconds());
    }

    private String formatElapsedDuration(long seconds) {
        long minutes = seconds / 60;
        long remainingSeconds = seconds % 60;
        return minutes + ":" + String.format("%02d", remainingSeconds);
    }

    private String meetingTime(java.time.Instant value) {
        return value == null ? "—" : DATE_FORMAT.format(value);
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
