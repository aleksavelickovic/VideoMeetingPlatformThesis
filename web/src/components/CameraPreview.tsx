import {CameraPreviewProps} from "../types/components.ts";

export function CameraPreview({videoRef, stream, participantName, mounted}: CameraPreviewProps) {
    const initials = participantName
        ? participantName.slice(0, 2).toUpperCase()
        : "YO";

    return (
        <div
            className={`
        relative mx-auto aspect-video w-full max-w-[44rem] rounded-[clamp(1rem,2.5vw,1.5rem)] overflow-hidden
        bg-preview-gradient border border-border
        transition-all duration-500 shadow-[0_32px_90px_rgba(0,0,0,0.28)]
        ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}
      `}
        >
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${stream ? "opacity-100" : "opacity-0"}`}
            />

            <div
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${stream ? "opacity-0" : "opacity-100"}`}>
                <div
                    className="flex size-[clamp(4.75rem,12vw,8rem)] items-center justify-center rounded-full bg-avatar-gradient">
                    <span className="text-[clamp(1.6rem,4vw,3rem)] text-text-primary font-semibold">{initials}</span>
                </div>
            </div>

            {participantName && (
                <div
                    className="absolute bottom-[clamp(0.75rem,2vw,1rem)] left-1/2 max-w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-full border border-border bg-surface px-[clamp(0.625rem,1.8vw,0.75rem)] py-[clamp(0.25rem,1vw,0.375rem)] backdrop-blur-[10px]">
                    <span className="block truncate text-[clamp(0.75rem,1.8vw,0.875rem)] text-text-primary">
                        {participantName}
                    </span>
                </div>
            )}
        </div>
    );
}
