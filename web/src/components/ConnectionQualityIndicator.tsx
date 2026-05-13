import {ConnectionQuality, Participant} from 'livekit-client'
import {useConnectionQualityIndicator} from '@livekit/components-react'
import {motion} from 'motion/react'
import {ParticipantProps} from "../types/components.ts";

export function ConnectionQualityIndicator({participant}: ParticipantProps) {
    const {quality} = useConnectionQualityIndicator({participant})

    const getColor = () => {
        switch (quality) {
            case ConnectionQuality.Excellent:
            case ConnectionQuality.Good:
                return 'var(--color-quality-good)'
            case ConnectionQuality.Poor:
                return 'var(--color-quality-poor)'
            case ConnectionQuality.Lost:
                return 'var(--color-quality-lost)'
            default:
                return 'var(--color-quality-unknown)'
        }
    }

    const activeColor = getColor()

    return (
        <div className="flex size-[clamp(1.25rem,3vw,1.5rem)] items-center justify-center">
            <div className="relative flex items-center justify-center">
                <motion.div
                    className="absolute w-full h-full rounded-full"
                    style={{backgroundColor: activeColor}}
                    animate={{
                        scale: [1, 1.8],
                        opacity: [0.5, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut",
                    }}
                />

                <div
                    className="size-[clamp(0.5rem,1.3vw,0.625rem)] rounded-full border border-white/20 shadow-[0_0_8px_rgba(0,0,0,0.4)]"
                    style={{backgroundColor: activeColor}}
                />
            </div>
        </div>
    )
}
