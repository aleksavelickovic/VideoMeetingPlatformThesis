import {ReconnectingOverlayProps} from "../types/components.ts";

export function ReconnectOverlay({isReconnecting}: ReconnectingOverlayProps) {
    if (!isReconnecting) return null

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-page/80 backdrop-blur-[6px]">

            <div
                className="mb-6 size-[clamp(2.75rem,8vw,3.5rem)] rounded-full border-4 border-border border-t-brand animate-spin"/>

            <p className="mb-1 text-[clamp(1rem,2.2vw,1.125rem)] font-semibold text-text-primary">Reconnecting...</p>
            <p className="px-4 text-center text-[clamp(0.75rem,1.7vw,0.875rem)] text-text-secondary">
                Please wait while we restore your connection.
            </p>

        </div>
    )
}
