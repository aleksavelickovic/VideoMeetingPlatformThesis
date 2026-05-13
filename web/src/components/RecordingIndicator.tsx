import {RecordingIndicatorProps} from "../types/components.ts";

export function RecordingIndicator({ isRecording }: RecordingIndicatorProps) {
    if (!isRecording) return null

    return (
        <div
            className="flex items-center gap-2 rounded-full border border-border bg-surface px-[clamp(0.625rem,1.6vw,0.75rem)] py-[clamp(0.3rem,0.8vh,0.4rem)] backdrop-blur-[10px]">
            <span className="size-[clamp(0.4rem,1vw,0.5rem)] rounded-full bg-text-error animate-pulse"/>
            <span
                className="text-[clamp(0.625rem,1.4vw,0.75rem)] font-semibold tracking-wide text-text-error uppercase">
        Recording
      </span>
        </div>
    )
}
