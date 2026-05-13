import {useEffect, useRef, useState} from 'react'
import {Room, RoomEvent, RemoteParticipant, LocalParticipant} from 'livekit-client'
import {UseLiveKitRoomResult} from "../types/hooks.ts";

export function useLiveKitRoom(token: string | undefined, participantName?: string): UseLiveKitRoomResult {
    const roomRef = useRef<Room | null>(null)
    const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([])
    const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isReconnecting, setIsReconnecting] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        if (!token) return

        const livekitUrl = import.meta.env.VITE_LIVEKIT_URL as string
        const room = new Room()
        roomRef.current = room

        let cancelled = false

        function syncParticipants() {
            if (cancelled) return
            setLocalParticipant(room.localParticipant)
            setRemoteParticipants([...room.remoteParticipants.values()])
        }

        room.on(RoomEvent.ParticipantConnected, syncParticipants)
        room.on(RoomEvent.ParticipantDisconnected, syncParticipants)
        room.on(RoomEvent.ParticipantNameChanged, syncParticipants)

        room.on(RoomEvent.Reconnecting, () => {
            if (!cancelled) setIsReconnecting(true)
        })

        room.on(RoomEvent.Reconnected, () => {
            if (!cancelled) setIsReconnecting(false)
            syncParticipants()
        })

        room.on(RoomEvent.RecordingStatusChanged, (recording: boolean) => {
            if (!cancelled) setIsRecording(recording)
        })

        room.on(RoomEvent.Disconnected, () => {
            if (!cancelled) {
                setIsConnected(false)
                setRemoteParticipants([])
                setLocalParticipant(null)
            }
        })

        async function connect() {
            try {
                await room.connect(livekitUrl, token!)
                if (cancelled) {
                    room.disconnect()
                    return
                }
                setIsConnected(true)
                setLocalParticipant(room.localParticipant)
                syncParticipants()

                setIsRecording(room.isRecording)

                if (participantName?.trim() && participantName.trim() !== room.localParticipant.name) {
                    await room.localParticipant.setName(participantName.trim())
                    syncParticipants()
                }

                await Promise.all([
                    room.localParticipant.setCameraEnabled(true),
                    room.localParticipant.setMicrophoneEnabled(true),
                ])
            } catch (e) {
                if (!cancelled) setError(e as Error)
            }
        }

        connect()

        return () => {
            cancelled = true
            room.off(RoomEvent.ParticipantConnected, syncParticipants)
            room.off(RoomEvent.ParticipantDisconnected, syncParticipants)
            room.off(RoomEvent.ParticipantNameChanged, syncParticipants)
            room.disconnect()
            roomRef.current = null
        }
    }, [token, participantName])

    return {
        room: roomRef.current,
        localParticipant,
        remoteParticipants,
        isConnected,
        isReconnecting,
        isRecording,
        error,
    }
}
