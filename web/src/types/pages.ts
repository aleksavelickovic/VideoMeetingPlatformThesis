import type {CreateParticipantDto} from "./index.ts";

export interface Attendee {
    name: string;
    initials: string;
    JoinedAt?: string | null;
    LeftAt?: string | null;
}

export interface PostCallState {
    durationSeconds?: number
    participants?: Attendee[]
    recordingUrl?: string | null
    participantRecordings?: { name: string; url: string }[]
    isHost?: boolean
}

export interface FormErrors {
    title?: string
    scheduledAt?: string
    durationLimitMinutes?: string
    joinBaseUrl?: string
    callbackUrl?: string
    recordingWidth?: string
    recordingHeight?: string
    participants?: string
    participantNames?: Record<number, string>
}

export interface ParticipantRowProps {
    index: number
    participant: CreateParticipantDto
    onChange: (index: number, field: keyof CreateParticipantDto, value: string) => void
    onRemove: (index: number) => void
    nameError?: string
    canRemove: boolean
}
