import {Mic, MicOff, Video, VideoOff, MonitorUp, MonitorOff, Phone} from 'lucide-react'
import {motion} from 'motion/react'
import {ToolbarProps} from "../types/components.ts";

export function Toolbar({
                            isMuted,
                            isCameraOff,
                            isScreenSharing,
                            onToggleMute,
                            onToggleCamera,
                            onToggleScreenShare,
                            onEndCall,
                        }: ToolbarProps) {
    return (
        <div
            className="flex w-full shrink-0 items-center justify-center px-[clamp(0.5rem,2vw,1rem)] pb-[clamp(0.5rem,2vh,1rem)] pt-[clamp(0.5rem,1.6vh,0.875rem)]">
            <motion.div
                className="flex max-w-full items-center gap-[clamp(0.5rem,1.5vw,0.75rem)] rounded-[clamp(1rem,2vw,1.5rem)] border border-white/5 bg-[#1A1C22]/80 px-[clamp(0.75rem,2vw,1.5rem)] py-[clamp(0.625rem,1.6vh,0.75rem)] shadow-2xl backdrop-blur-2xl"
                initial={{y: 20, opacity: 0}}
                animate={{y: 0, opacity: 1}}
            >
                <ToolbarButton onClick={onToggleMute} danger={isMuted}>
                    {isMuted ? <MicOff size={20}/> : <Mic size={20}/>}
                </ToolbarButton>

                <ToolbarButton onClick={onToggleCamera} danger={isCameraOff}>
                    {isCameraOff ? <VideoOff size={20}/> : <Video size={20}/>}
                </ToolbarButton>

                <ToolbarButton
                    onClick={onToggleScreenShare}
                    // active={isScreenSharing}
                    danger={isScreenSharing}
                >
                    {isScreenSharing ? <MonitorOff size={20}/> : <MonitorUp size={20}/>}
                </ToolbarButton>

                <motion.button
                    onClick={onEndCall}
                    className="ml-[clamp(0.125rem,0.8vw,0.5rem)] flex size-[clamp(2.75rem,5.5vh,3rem)] items-center justify-center rounded-full bg-[#FF453A] text-white shadow-lg shadow-red-500/20"
                    whileHover={{scale: 1.06}}
                    whileTap={{scale: 0.9}}
                >
                    <Phone size={20} className="rotate-[135deg] fill-current"/>
                </motion.button>
            </motion.div>
        </div>
    )
}

function ToolbarButton({children, onClick, danger, active, className = ""}: {
    children: React.ReactNode,
    onClick?: () => void,
    danger?: boolean,
    active?: boolean,
    className?: string
}) {
    return (
        <motion.button
            onClick={onClick}
            className={`flex size-[clamp(2.625rem,5vh,2.875rem)] items-center justify-center rounded-full transition-all
                ${danger ? 'bg-text-error/20 text-text-error hover:bg-text-error/30' :
                active ? 'bg-brand/20 text-brand' : 'bg-white/10 text-white hover:bg-white/20'} 
                ${className}`}
            whileHover={{scale: 1.04}}
            whileTap={{scale: 0.95}}
        >
            {children}
        </motion.button>
    )
}
