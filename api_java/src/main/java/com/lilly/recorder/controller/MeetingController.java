package com.lilly.recorder.controller;

import com.lilly.recorder.constants.EndMeetingReason;
import com.lilly.recorder.dto.CreateMeetingDto;
import com.lilly.recorder.dto.CreateMeetingResponse;
import com.lilly.recorder.dto.FilterList;
import com.lilly.recorder.dto.MeetingDto;
import com.lilly.recorder.dto.MeetingFilterRequest;
import com.lilly.recorder.entity.Meeting;
import com.lilly.recorder.mapper.MeetingMapper;
import com.lilly.recorder.service.MeetingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Validated
@RestController
@RequestMapping("/meetings")
public class MeetingController {
    private final MeetingService meetingService;
    private final MeetingMapper meetingMapper;

    public MeetingController(MeetingService meetingService, MeetingMapper meetingMapper) {
        this.meetingService = meetingService;
        this.meetingMapper = meetingMapper;
    }

    @PostMapping
    public ResponseEntity<CreateMeetingResponse> create(@Valid @RequestBody CreateMeetingDto dto) {
        Meeting meeting = meetingService.create(dto);
        return ResponseEntity.ok(meetingMapper.toCreateResponse(meeting));
    }

    @GetMapping
    public ResponseEntity<FilterList<MeetingDto>> getList(@Valid MeetingFilterRequest filter) {
        FilterList<Meeting> list = meetingService.getList(filter);
        return ResponseEntity.ok(new FilterList<>(
                list.getItems().stream().map(meeting -> meetingMapper.toDto(meeting, java.util.Map.of(), null)).toList(),
                list.getTotalCount(),
                list.getPage(),
                list.getPerPage()
        ));
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<MeetingDto> getByRoomId(@PathVariable UUID roomId) {
        Meeting meeting = meetingService.getByRoomId(roomId);
        return ResponseEntity.ok(meetingMapper.toDto(
                meeting,
                meetingService.getParticipantPresignedUrls(meeting),
                meetingService.getMeetingPresignedUrl(meeting)
        ));
    }

    @PostMapping("/{roomId}/end")
    public ResponseEntity<MeetingDto> endMeeting(@PathVariable UUID roomId) {
        Meeting meeting = meetingService.endMeeting(roomId, EndMeetingReason.MANUAL);
        return ResponseEntity.ok(meetingMapper.toDto(
                meeting,
                meetingService.getParticipantPresignedUrls(meeting),
                meetingService.getMeetingPresignedUrl(meeting)
        ));
    }
}
