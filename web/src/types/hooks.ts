import {LocalParticipant, RemoteParticipant, Room} from "livekit-client";

export interface UseCameraPreviewResult {
    videoRef: React.RefObject<HTMLVideoElement>;
    stream: MediaStream | null;
}

export interface DeviceInfo {
    deviceId: string
    label: string
}

export interface UseDevicesResult {
    cameras: DeviceInfo[]
    microphones: DeviceInfo[]
    selectedCamera: string
    selectedMicrophone: string
    setSelectedCamera: (deviceId: string) => void
    setSelectedMicrophone: (deviceId: string) => void
    isLoading: boolean
    error: Error | null
}

export interface UseLiveKitRoomResult {
    room: Room | null
    localParticipant: LocalParticipant | null
    remoteParticipants: RemoteParticipant[]
    isConnected: boolean
    isReconnecting: boolean
    isRecording: boolean
    error: Error | null
}

export interface UseParticipantNameResult {
    participantName: string
    setParticipantName: (name: string) => void
    isHost: boolean
}