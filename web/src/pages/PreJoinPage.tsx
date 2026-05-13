import {useNavigate, useSearchParams, useParams} from "react-router-dom";
import {Video, Mic, User} from "lucide-react";
import {useDevices} from "../hooks/useDevices";
import {useParticipantName} from "../hooks/useParticipantName";
import {useCameraPreview} from "../hooks/useCameraPreview";
import {useMountTransition} from "../hooks/useMountTransition";
import {useViewportScale} from "../hooks/useViewportScale";
import {CameraPreview} from "../components/CameraPreview";
import {DeviceDropdown} from "../components/DeviceDropdown";
import {getMeeting} from "../api/MeetingApi.ts";

export function PreJoinPage() {
    const navigate = useNavigate();
    const {roomId} = useParams<{ roomId: string }>();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const {
        cameras,
        microphones,
        selectedCamera,
        selectedMicrophone,
        setSelectedCamera,
        setSelectedMicrophone,
        isLoading,
        error
    } = useDevices();
    const {participantName, setParticipantName} = useParticipantName(token);
    const {videoRef, stream} = useCameraPreview(selectedCamera);
    const mounted = useMountTransition();
    const {viewportRef, contentRef, scale, contentWidth, scaledWidth, scaledHeight} = useViewportScale();

    const handleJoinMeeting = async () => {
        if (!token || !roomId) return;

        try {
            const meeting = await getMeeting(roomId)
            if (meeting.status !== 'in_progress' && meeting.status !== 'scheduled') {
                alert('This meeting has already ended.')
                return
            }
        } catch {
            alert('Could not verify meeting status.')
            return
        }

        navigate(`/call/${roomId}`, {
            state: {
                token,
                participantName: participantName.trim(),
            },
        });
    };

    return (
        <div className="h-[100dvh] overflow-hidden bg-page">
            <div
                ref={viewportRef}
                className="flex h-full w-full items-center justify-center p-[clamp(0.5rem,2vw,1.5rem)]"
            >
                <div
                    className="relative shrink-0"
                    style={{
                        width: scaledWidth ? `${scaledWidth}px` : '100%',
                        height: scaledHeight ? `${scaledHeight}px` : 'auto',
                    }}
                >
                    <div
                        ref={contentRef}
                        className="absolute left-1/2 top-0 w-full -translate-x-1/2 will-change-transform transition-transform duration-200 ease-out"
                        style={{
                            width: contentWidth ? `${contentWidth}px` : '100%',
                            transform: `translateX(-50%) scale(${scale})`,
                            transformOrigin: 'top center',
                        }}
                    >
                        <div className="mx-auto flex w-full max-w-4xl flex-col gap-[clamp(0.875rem,2.25vh,1.5rem)]">
                        <div className="text-center">
                            <h1 className="mb-2 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-tight text-text-primary">
                                Lilly Recorder
                            </h1>
                            <p className="text-[clamp(0.875rem,2vw,1rem)] text-text-secondary">
                                Premium Video Conferencing
                            </p>
                        </div>

                        <div
                            className="grid items-start gap-[clamp(0.875rem,2.25vw,1.5rem)] lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
                            <CameraPreview
                                videoRef={videoRef}
                                stream={stream}
                                participantName={participantName}
                                mounted={mounted}
                            />

                            <div className="flex flex-col gap-[clamp(0.75rem,2vh,1rem)]">
                                <div
                                    className={`
            relative z-20 flex flex-col gap-[clamp(0.75rem,2vh,1rem)] transition-all duration-500 delay-100
            ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}
          `}
                                >
                                    {error && (
                                        <p className="text-center text-sm text-text-error">
                                            Could not access devices: {error.message}
                                        </p>
                                    )}

                                    <div
                                        className="flex items-center gap-[clamp(0.625rem,1.8vw,0.75rem)] rounded-[clamp(0.875rem,2vw,1rem)] border border-border bg-surface p-[clamp(0.75rem,2vw,1rem)] backdrop-blur-[10px]">
                                        <div
                                            className="flex size-[clamp(2.5rem,5vw,2.75rem)] shrink-0 items-center justify-center rounded-lg bg-brand-muted">
                                            <User className="h-5 w-5 text-brand"/>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 text-xs text-text-secondary">Your name</div>
                                            <input
                                                type="text"
                                                value={participantName}
                                                onChange={e => setParticipantName(e.target.value)}
                                                placeholder="Enter your name"
                                                className="w-full min-w-0 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary sm:text-base"
                                            />
                                        </div>
                                    </div>

                                    <DeviceDropdown
                                        icon={<Video className="h-5 w-5 text-brand"/>}
                                        label="Camera"
                                        devices={cameras}
                                        selectedId={selectedCamera}
                                        isLoading={isLoading}
                                        onSelect={setSelectedCamera}
                                    />

                                    <DeviceDropdown
                                        icon={<Mic className="h-5 w-5 text-brand"/>}
                                        label="Microphone"
                                        devices={microphones}
                                        selectedId={selectedMicrophone}
                                        isLoading={isLoading}
                                        onSelect={setSelectedMicrophone}
                                    />
                                </div>

                                <div
                                    className={`
            transition-all duration-500 delay-200 relative z-0
            ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}
          `}
                                >
                                    {token && roomId ? (
                                        <button
                                            onClick={handleJoinMeeting}
                                            disabled={!participantName.trim()}
                                            className="
                w-full rounded-[clamp(0.875rem,2vw,1rem)] bg-brand px-4 py-[clamp(0.875rem,2vh,1rem)] text-[clamp(0.95rem,2vw,1rem)] font-medium text-text-primary relative overflow-hidden shadow-brand-glow
                transition-transform duration-150
                hover:scale-[1.02] active:scale-[0.98]
                disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100
              "
                                        >
                                            Join Meeting
                                        </button>
                                    ) : (
                                        <p className="text-center text-text-error">Invalid join link.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}
