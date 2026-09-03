export type ParticipantRole = 'host' | 'guest'
export type MeetingStatus =
    'scheduled'
    | 'in_progress'
    | 'completed'
    | 'failed'
    | 'callback_failed'
    | 'recording_failed'

export interface CreateParticipantDto {
    name: string;
    role: ParticipantRole
    email?: string | null
    invitationText?: string | null
}

export interface RecordingConfig {
    enabled: boolean;
    format: 'mp4';
    width: number;
    height: number
}

export interface CreateMeetingDto {
    title: string
    scheduledAt: string
    durationLimitMinutes: number
    participants: CreateParticipantDto[]
    recording: RecordingConfig
    metadata: string | null
}

export interface ParticipantDto {
    id: number
    name: string
    role: ParticipantRole
    joinLink: string
    joinedAt: string | null
    leftAt: string | null
    token?: string
    recordingPresignedUrl?: string | null
}

export interface RecordingDto {
    s3Bucket: string | null
    s3Key: string | null
    width: number
    height: number
    presignedUrl: string | null
    sizeBytes?: number | null
    durationSeconds?: number | null
    format: 'mp4'
}

export interface MeetingDto {
    id: number
    roomId: string
    title: string
    status: MeetingStatus
    scheduledAt: string
    durationLimitMinutes: number
    recordingEnabled: boolean
    startedAt: string | null
    endedAt: string | null
    notes: string | null
    metadata: string | null
    recordingWidth?: number
    recordingHeight?: number
    participants: ParticipantDto[]
    recording: RecordingDto | null
}

export interface CreateMeetingResponse {
    id: number
    roomId: string
    title: string
    status: MeetingStatus
    recordingEnabled: boolean
    startedAt: string | null
    endedAt: string | null
    participants: Array<Pick<ParticipantDto, 'id' | 'name' | 'role' | 'joinLink'>>
    recording: RecordingDto | null
}

export interface FilterList<T> {
    items: T[];
    totalCount: number;
    page: number;
    perPage: number
}

export interface CallSummary {
    roomId: string;
    durationSeconds: number;
    isHost: boolean;
    meeting: MeetingDto | null
}
