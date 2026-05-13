import {Track} from 'livekit-client'
import {
    VideoTrack,
    AudioTrack,
    useParticipantTracks,
    useIsSpeaking
} from '@livekit/components-react'
import {MicOff, Monitor} from 'lucide-react'
import {motion, AnimatePresence} from 'motion/react'
import {ParticipantTileProps} from "../types/components.ts"
import {ConnectionQualityIndicator} from "./ConnectionQualityIndicator.tsx"

export function ParticipantTile({participant, isLocal = false}: ParticipantTileProps) {
    const tracks = useParticipantTracks(
        [Track.Source.Camera, Track.Source.Microphone, Track.Source.ScreenShare],
        participant.identity
    )

    const screenShareTrack = tracks.find(t => t.source === Track.Source.ScreenShare)
    const cameraTrack = tracks.find(t => t.source === Track.Source.Camera)
    const audioTrack = tracks.find(t => t.source === Track.Source.Microphone)

    const isScreenSharing = !!screenShareTrack?.publication && !screenShareTrack.publication.isMuted
    const isCameraOn = !!cameraTrack?.publication && !cameraTrack.publication.isMuted
    const isMuted = !audioTrack?.publication || audioTrack?.publication?.isMuted
    const isSpeaking = useIsSpeaking(participant)

    const initials = participant.name
        ? participant.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : participant.identity.slice(0, 2).toUpperCase()

    return (
        <motion.div
            className={`
                relative h-full w-full rounded-[clamp(1rem,2vw,1.5rem)] overflow-hidden bg-[#1A1C22]
                border-2 transition-all duration-300 ease-in-out
                ${isSpeaking ? 'border-brand shadow-brand-glow' : 'border-transparent'}
            `}
            animate={{scale: isSpeaking ? 1.01 : 1}}
        >
            <div className="absolute inset-0 w-full h-full">
                <AnimatePresence mode="wait">
                    {isScreenSharing ? (
                        <motion.div
                            key={`ss-${participant.identity}`}
                            initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
                            className="w-full h-full bg-black"
                        >
                            <VideoTrack
                                trackRef={screenShareTrack}
                                className="w-full h-full object-contain"
                            />
                        </motion.div>
                    ) : isCameraOn ? (
                        <motion.div
                            key={`cam-${participant.identity}`}
                            initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
                            className="w-full h-full"
                        >
                            <VideoTrack
                                trackRef={cameraTrack}
                                className="w-full h-full object-cover"
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="init"
                            initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
                            className="absolute inset-0 flex items-center justify-center bg-avatar-gradient"
                        >
                            <span
                                className="text-[clamp(1.5rem,5vw,3rem)] text-white font-medium tracking-tighter opacity-90">
                                {initials}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div
                className="absolute right-[clamp(0.5rem,1.5vw,1rem)] top-[clamp(0.5rem,1.5vw,1rem)] z-50 flex items-center gap-2">
                <ConnectionQualityIndicator participant={participant}/>
            </div>
            <div
                className="absolute bottom-[clamp(0.5rem,1.5vw,1rem)] right-[clamp(0.5rem,1.5vw,1rem)] z-50 flex items-center gap-2">

                <AnimatePresence>
                    {isMuted && (
                        <motion.div
                            key="mute-icon-top"
                            initial={{opacity: 0, scale: 0.8}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.8}}
                            className="flex size-[clamp(2rem,4.5vw,2.25rem)] items-center justify-center rounded-full border border-white/10 bg-black/50 backdrop-blur-md"
                        >
                            <MicOff className="h-4 w-4 text-white/80"/>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>


            <div
                className="absolute bottom-[clamp(0.5rem,1.5vw,1rem)] left-[clamp(0.5rem,1.5vw,1rem)] z-10 max-w-[calc(100%-1rem)]">
                <div
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/50 px-[clamp(0.625rem,1.8vw,0.75rem)] py-[clamp(0.35rem,1vw,0.45rem)] backdrop-blur-md">
                    {isScreenSharing && <Monitor size={13} className="shrink-0 text-brand"/>}
                    <span className="truncate text-[clamp(0.75rem,1.6vw,0.9375rem)] font-medium text-white">
                        {isLocal ? 'You' : (participant.name ?? participant.identity)}
                    </span>
                </div>
            </div>

            {!isLocal && audioTrack && <AudioTrack trackRef={audioTrack}/>}
        </motion.div>
    )
}
