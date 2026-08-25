import {useNavigate, useLocation} from "react-router-dom";
import {Download, Home, Clock, Users, Phone, Plus} from "lucide-react";
import {useMountTransition} from "../hooks/useMountTransition";
import {useIsEmbedded} from "../hooks/useIsEmbedded";
import {useViewportScale} from "../hooks/useViewportScale";
import {PostCallState} from "../types/pages.ts";
import {FALLBACK_ATTENDEES} from "../constants/constants.ts";
import {formatDuration} from "../utils/utils.ts";
import {formatTime} from "../utils/utils.ts";

export function PostCallPage() {
    const navigate = useNavigate();
    const mounted = useMountTransition();
    const isEmbedded = useIsEmbedded();
    const {viewportRef, contentRef, scale, contentWidth, scaledWidth, scaledHeight} = useViewportScale();

    const location = useLocation();
    const state = (location.state ?? {}) as PostCallState;

    const duration = state.durationSeconds != null
        ? formatDuration(state.durationSeconds)
        : "00:00";

    const participants = state.participants ?? FALLBACK_ATTENDEES;
    const recordingUrl = state.recordingUrl ?? null;
    const participantRecordings = state.participantRecordings ?? [];
    const isHost = state.isHost ?? false;
    const showStandaloneActions = !isEmbedded;
    const hasRecordingActions = isHost && (!!recordingUrl || participantRecordings.length > 0);
    const hasActions = hasRecordingActions || showStandaloneActions;

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
                        className={`absolute left-1/2 top-0 transition-all duration-500 will-change-transform ${
                            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
                        }`}
                        style={{
                            width: contentWidth ? `${contentWidth}px` : '100%',
                            transform: `translateX(-50%) scale(${scale})`,
                            transformOrigin: 'top center',
                        }}
                    >
                        <div className="mx-auto flex w-full max-w-5xl flex-col gap-[clamp(0.875rem,2.4vh,1.5rem)]">
                            <div className="text-center">
                                <div
                                    className={`
                            mb-4 inline-flex size-[clamp(4.5rem,10vw,5rem)] items-center justify-center rounded-full
                            border-2 border-brand bg-brand-muted
                            transition-all duration-500 delay-200
                            ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-0"}
                        `}
                                >
                                    <Phone
                                        className="h-[clamp(2rem,4vw,2.5rem)] w-[clamp(2rem,4vw,2.5rem)] text-brand"/>
                                </div>
                                <h1 className="mb-2 text-[clamp(1.75rem,4vw,2.5rem)] text-text-primary">Meeting
                                    Ended</h1>
                                <p className="text-[clamp(0.875rem,2vw,1rem)] text-text-secondary">
                                    Thanks for joining! Here's a summary of your call.
                                </p>
                            </div>

                            <div
                                className={`grid gap-[clamp(0.875rem,2vw,1.25rem)] ${hasActions ? 'lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]' : ''}`}>
                                <div
                                    className={hasActions ? '' : 'mx-auto w-full max-w-3xl'}
                                >
                                    <div
                                    className={`
                        rounded-[clamp(1rem,2vw,1.5rem)] border border-border bg-surface p-[clamp(1rem,2.4vw,2rem)] backdrop-blur-[20px]
                        transition-all duration-500 delay-300
                        ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}
                    `}
                                >
                                    <div className="grid gap-[clamp(0.75rem,1.8vw,1rem)] sm:grid-cols-2">
                                        <div
                                            className="flex items-center gap-[clamp(0.75rem,1.8vw,1rem)] rounded-[clamp(0.875rem,1.8vw,1rem)] border border-border bg-page/20 p-[clamp(0.75rem,1.8vw,1rem)]">
                                            <div
                                                className="flex size-[clamp(2.75rem,5vw,3rem)] shrink-0 items-center justify-center rounded-xl bg-brand-muted">
                                                <Clock className="h-5 w-5 text-brand"/>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="mb-1 text-sm text-text-secondary">Duration</div>
                                                <div
                                                    className="text-[clamp(1.125rem,2.4vw,1.5rem)] text-text-primary">{duration}</div>
                                            </div>
                                        </div>

                                        <div
                                            className="flex items-center gap-[clamp(0.75rem,1.8vw,1rem)] rounded-[clamp(0.875rem,1.8vw,1rem)] border border-border bg-page/20 p-[clamp(0.75rem,1.8vw,1rem)]">
                                            <div
                                                className="flex size-[clamp(2.75rem,5vw,3rem)] shrink-0 items-center justify-center rounded-xl bg-brand-muted">
                                                <Users className="h-5 w-5 text-brand"/>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="mb-1 text-sm text-text-secondary">Participants</div>
                                                <div className="text-[clamp(1rem,2.2vw,1.25rem)] text-text-primary">
                                                    {participants.length} people
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className="mt-[clamp(0.875rem,2vh,1.25rem)] grid gap-[clamp(0.625rem,1.5vw,0.875rem)] sm:grid-cols-2">
                                        {participants.map((attendee, index) => (
                                            <div
                                                key={`${attendee.name}-${index}`}
                                                className={`
                                    flex items-center gap-[clamp(0.625rem,1.5vw,0.75rem)] rounded-[clamp(0.875rem,1.8vw,1rem)] border border-border/70 bg-page/10 p-[clamp(0.625rem,1.5vw,0.875rem)]
                                    transition-all duration-300
                                    ${mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-5"}
                                `}
                                                style={{transitionDelay: `${400 + index * 50}ms`}}
                                            >
                                                <div
                                                    className="flex size-[clamp(2.25rem,4vw,2.5rem)] shrink-0 items-center justify-center rounded-full bg-avatar-gradient">
                                                <span className="text-sm font-semibold text-text-primary">
                                                    {attendee.initials}
                                                </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div
                                                        className="truncate text-[clamp(0.875rem,1.8vw,1rem)] text-text-primary">
                                                        {attendee.name}
                                                    </div>
                                                    {(attendee as any).joinedAt == null ? (
                                                        <div className="text-xs text-text-error">Never joined</div>
                                                    ) : (
                                                        <div className="truncate text-xs text-text-secondary">
                                                            Joined: {formatTime((attendee as any).joinedAt)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                </div>

                                {hasActions && (
                                    <div
                                    className={`
                        grid auto-rows-fr gap-3 transition-all duration-500 delay-500
                        ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}
                    `}
                                >
                                    {isHost && recordingUrl && (
                                        <a
                                            href={recordingUrl}
                                            download
                                            className="
                                flex min-h-[3.5rem] w-full items-center justify-center gap-3 rounded-[clamp(0.875rem,2vw,1rem)] bg-brand px-4 py-[clamp(0.875rem,1.8vh,1rem)] text-text-primary shadow-brand-glow
                                transition-transform duration-150
                                hover:scale-[1.02] active:scale-[0.98]
                            "
                                        >
                                            <Download className="h-5 w-5 shrink-0"/>
                                            <span className="min-w-0 truncate">Download Recording</span>
                                        </a>
                                    )}

                                    {isHost && participantRecordings.map(({name, role, url}) => (
                                        <a
                                            key={name}
                                            href={url}
                                            download
                                            className="
                                flex min-h-[3.5rem] w-full items-center justify-center gap-3 rounded-[clamp(0.875rem,2vw,1rem)] bg-brand px-4 py-[clamp(0.875rem,1.8vh,1rem)] text-text-primary shadow-brand-glow
                                transition-transform duration-150
                                hover:scale-[1.02] active:scale-[0.98]
                            "
                                            title={role === 'host' ? 'Download Host Recording' : `Download ${name}'s Recording`}
                                        >
                                            <Download className="h-5 w-5 shrink-0"/>
                                            <span className="min-w-0 truncate">
                                                {role === 'host' ? 'Download Host Recording' : `Download ${name}'s Recording`}
                                            </span>
                                        </a>
                                    ))}

                                        {showStandaloneActions && (
                                        <button
                                            onClick={() => navigate("/")}
                                            className="
                            flex min-h-[3.5rem] w-full items-center justify-center gap-3 rounded-[clamp(0.875rem,2vw,1rem)] bg-brand px-4 py-[clamp(0.875rem,1.8vh,1rem)] text-text-primary shadow-brand-glow
                            transition-transform duration-150
                            hover:scale-[1.02] active:scale-[0.98]
                        "
                                        >
                                            <Plus className="h-5 w-5 shrink-0"/>
                                            <span className="min-w-0 truncate">Start a New Meeting</span>
                                        </button>
                                    )}

                                        {showStandaloneActions && (
                                        <button
                                            onClick={() => navigate("/")}
                                            className="
                            flex min-h-[3.5rem] w-full items-center justify-center gap-3 rounded-[clamp(0.875rem,2vw,1rem)] border border-border bg-surface px-4 py-[clamp(0.875rem,1.8vh,1rem)] text-text-primary
                            transition-transform duration-150
                            hover:scale-[1.02] active:scale-[0.98]
                        "
                                        >
                                            <Home className="h-5 w-5 shrink-0"/>
                                            <span className="min-w-0 truncate">Back to Dashboard</span>
                                        </button>
                                    )}
                                </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
