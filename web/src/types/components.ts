import {LocalParticipant, Participant, RemoteParticipant} from "livekit-client";
import {DeviceInfo} from "./hooks.ts";
import type {ReactNode} from "react";

export interface DateTimePickerProps {
    value: string
    onChange: (value: string) => void
    error?: string
}

export interface DeviceDropdownProps {
    icon: React.ReactNode;
    label: string;
    devices: DeviceInfo[];
    selectedId: string;
    isLoading: boolean;
    onSelect: (deviceId: string) => void;
}

export interface CameraPreviewProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    stream: MediaStream | null;
    participantName: string;
    mounted: boolean;
}

export interface ParticipantTileProps {
    participant: RemoteParticipant | LocalParticipant
    isLocal?: boolean
}

export interface ReconnectingOverlayProps {
    isReconnecting: boolean
}

export interface RecordingIndicatorProps {
    isRecording: boolean
}

export interface ToolbarProps {
    isMuted: boolean
    isCameraOff: boolean
    isScreenSharing: boolean
    isRecording?: boolean
    participantCount?: number
    onToggleMute: () => void
    onToggleCamera: () => void
    onToggleScreenShare: () => void
    onEndCall: () => void
}

export interface VideoGridProps {
    localParticipant: LocalParticipant | null
    remoteParticipants: RemoteParticipant[]
}

export interface Props {
    children: ReactNode
}

export interface State {
    error: Error | null
}

export interface ParticipantProps {
    participant: Participant
}