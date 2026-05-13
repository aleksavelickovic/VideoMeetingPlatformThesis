import {useEffect, useState, useCallback, useRef} from 'react'
import {useNavigate, useLocation, useParams} from 'react-router-dom'
import {RoomEvent} from 'livekit-client'
import {RoomContext} from '@livekit/components-react'
import {useLiveKitRoom} from '../hooks/useLiveKitRoom'
import {VideoGrid} from '../components/VideoGrid'
import {Toolbar} from '../components/Toolbar'
import {ReconnectOverlay} from '../components/ReconnectOverlay'
import {RecordingIndicator} from '../components/RecordingIndicator'
import {endMeeting, getMeeting} from '../api/MeetingApi.ts'

export function InCallPage() {
    const navigate = useNavigate()
    const {roomId} = useParams<{ roomId: string }>()

    const location = useLocation()
    const callState = (location.state as { token?: string; participantName?: string } | null) ?? null
    const token = callState?.token
    const participantName = callState?.participantName

    const {
        room,
        localParticipant,
        remoteParticipants,
        isConnected,
        isReconnecting,
        isRecording,
        error,
    } = useLiveKitRoom(token, participantName)

    const [isMuted, setIsMuted] = useState(false)
    const [isCameraOff, setIsCameraOff] = useState(false)
    const [isScreenSharing, setIsScreenSharing] = useState(false)
    const [isHost, setIsHost] = useState(false)


    useEffect(() => {
        if (!token) return
        try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            setIsHost(payload.metadata === 'host')
        } catch {
            setIsHost(false)
        }
    }, [token])

    const [durationSeconds, setDurationSeconds] = useState(0)
    const [durationLimitSeconds, setDurationLimitSeconds] = useState<number | null>(null)
    const startedAtRef = useRef<number | null>(null)

    useEffect(() => {
        if (!isConnected || !roomId) return

        getMeeting(roomId).then(meeting => {
            if (meeting.durationLimitMinutes) {
                setDurationLimitSeconds(meeting.durationLimitMinutes * 60)
            }
        }).catch(() => {
        })

        const interval = setInterval(async () => {
            if (startedAtRef.current === null) {
                try {
                    const meeting = await getMeeting(roomId)
                    if (meeting.startedAt) {
                        startedAtRef.current = new Date(meeting.startedAt).getTime()
                    }
                } catch {
                }
            }

            if (startedAtRef.current !== null) {
                setDurationSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000))
            } else {
                setDurationSeconds(s => s + 1)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [isConnected, roomId])

    const navigateToPostCall = useCallback(async () => {
        let participants: { name: string; initials: string }[] = remoteParticipants.map(p => ({
            name: p.name ?? p.identity,
            initials: (p.name ?? p.identity).slice(0, 2).toUpperCase(),
        }))

        let recordingUrl: string | null = null
        let participantRecordings: { name: string; url: string }[] = []

        if (roomId) {
            try {
                const meeting = await getMeeting(roomId)
                recordingUrl = meeting.recording?.presignedUrl ?? null
                participantRecordings = (meeting.participants ?? [])
                    .filter((p: any) => p.recordingPresignedUrl)
                    .map((p: any) => ({name: p.name, url: p.recordingPresignedUrl}))

                if (meeting.participants?.length > 0) {
                    participants = (meeting.participants ?? [])
                        .map((p: any) => ({
                            name: p.name,
                            initials: p.name.slice(0, 2).toUpperCase(),
                            joinedAt: p.joinedAt ?? null,
                            leftAt: p.leftAt ?? null,
                        }))
                }
            } catch {
            }
        }

        navigate('/post-call', {
            state: {durationSeconds, participants, recordingUrl, participantRecordings, isHost},
        })
    }, [roomId, remoteParticipants, localParticipant, durationSeconds, navigate, isHost])

    useEffect(() => {
        if (!room) return
        room.on(RoomEvent.Disconnected, navigateToPostCall)
        return () => {
            room.off(RoomEvent.Disconnected, navigateToPostCall)
        }
    }, [room, navigateToPostCall])

    const handleToggleMute = useCallback(async () => {
        if (!localParticipant) return
        await localParticipant.setMicrophoneEnabled(isMuted)
        setIsMuted(m => !m)
    }, [localParticipant, isMuted])

    const handleToggleCamera = useCallback(async () => {
        if (!localParticipant) return
        await localParticipant.setCameraEnabled(isCameraOff)
        setIsCameraOff(c => !c)
    }, [localParticipant, isCameraOff])

    const handleToggleScreenShare = useCallback(async () => {
        if (!localParticipant) return
        await localParticipant.setScreenShareEnabled(!isScreenSharing)
        setIsScreenSharing(s => !s)
    }, [localParticipant, isScreenSharing])

    const handleEndCall = useCallback(async () => {
        if (!roomId) return
        try {
            if (isHost) {
                endMeeting(roomId)
            }
        } catch {
        } finally {
            room?.disconnect()
        }
    }, [room, roomId, isHost])

    const timerColor = durationLimitSeconds === null
        ? 'text-text-secondary'
        : durationSeconds >= durationLimitSeconds
            ? 'text-red-500'
            : durationSeconds >= durationLimitSeconds - 300
                ? 'text-yellow-400'
                : 'text-text-secondary'

    if (!token) {
        return (
            <div className="h-[100dvh] overflow-hidden bg-page">
                <div className="flex h-full items-center justify-center p-4">
                    <div className="text-center">
                        <p className="mb-4 text-lg text-text-error">Missing join token.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 rounded-xl bg-brand text-text-primary hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
                    >
                        Go back
                    </button>
                </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="h-[100dvh] overflow-hidden bg-page">
                <div className="flex h-full items-center justify-center p-4">
                    <div className="text-center">
                        <p className="mb-2 text-lg text-text-error">Failed to connect to the call.</p>
                        <p className="mb-6 text-sm text-text-secondary">{error.message}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 rounded-xl bg-brand text-text-primary hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
                    >
                        Go back
                    </button>
                </div>
                </div>
            </div>
        )
    }

    return (
        <RoomContext.Provider value={room ?? undefined}>
            <div className="h-[100dvh] overflow-hidden bg-page">
                <div
                    className="flex h-full min-h-0 flex-col">
                    <div
                        className="shrink-0 border-b border-border bg-surface px-[clamp(0.75rem,2vw,1.5rem)] py-[clamp(0.625rem,1.6vh,0.875rem)] backdrop-blur-[20px]">
                        <div className="flex flex-wrap items-center justify-between gap-[clamp(0.5rem,1.5vw,0.75rem)]">
                            <span
                                className="min-w-0 flex-1 truncate text-[clamp(0.75rem,1.7vw,0.875rem)] font-mono text-text-secondary">
                                {roomId}
                            </span>
                            <div className="flex flex-wrap items-center justify-end gap-[clamp(0.5rem,1.5vw,0.75rem)]">
                                <RecordingIndicator isRecording={isRecording}/>
                                <span
                                    className={`text-[clamp(0.75rem,1.7vw,0.875rem)] font-mono tabular-nums ${timerColor}`}>
                                    {String(Math.floor(durationSeconds / 60)).padStart(2, '0')}:
                                    {String(durationSeconds % 60).padStart(2, '0')}
                                    {durationLimitSeconds !== null && (
                                        <> / {String(Math.floor(durationLimitSeconds / 60)).padStart(2, '0')}:00</>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                        <VideoGrid
                            localParticipant={localParticipant}
                            remoteParticipants={remoteParticipants}
                        />
                        <ReconnectOverlay isReconnecting={isReconnecting}/>
                    </div>

                    <Toolbar
                        isMuted={isMuted}
                        isCameraOff={isCameraOff}
                        isScreenSharing={isScreenSharing}
                        onToggleMute={handleToggleMute}
                        onToggleCamera={handleToggleCamera}
                        onToggleScreenShare={handleToggleScreenShare}
                        onEndCall={handleEndCall}
                    />
                </div>
            </div>
        </RoomContext.Provider>
    )
}
