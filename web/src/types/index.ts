export interface CreateParticipantDto {
    name: string
    role: string
}

export interface CreateMeetingDto {
    title: string
    scheduledAt: string
    durationLimitMinutes: number
    participants: CreateParticipantDto[]
    recording: {
        enabled: boolean
        format: 'mp4'
        width: number
        height: number
    }
    callbackUrl: string
    joinBaseUrl: string
    metadata: string
}

export interface MeetingFilterRequest {
    page?: number
    perPage?: number
    search?: string
}


export interface ParticipantResponseDto {
    id: number
    name: string
    role: string
    joinLink: string
}

export interface RecordingDto {
    s3Bucket: string | null
    s3Key: string | null
    sizeBytes?: number | null
    durationSeconds?: number | null
    format?: 'mp4'
    width: number
    height: number
    presignedUrl: string | null
}

export interface MeetingDto {
    id: number
    roomId: string
    title: string
    status: 'scheduled' | 'active' | 'ended' | 'in_progress'
    recordingEnabled: boolean
    callbackUrl: string
    startedAt: string
    endedAt: string | null
    participants: ParticipantResponseDto[]
    recording: RecordingDto | null
    durationLimitMinutes: number
}

export type CreateMeetingResponse = MeetingDto

export interface FilterList<T> {
    items: T[]
    totalCount: number
    page: number
    perPage: number
}
