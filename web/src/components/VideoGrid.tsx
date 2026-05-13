import {ParticipantTile} from './ParticipantTile'
import {VideoGridProps} from "../types/components.ts";

function getColumnCount(total: number): number {
    if (total <= 1) return 1
    if (total <= 2) return 2
    if (total <= 4) return 2
    if (total <= 9) return 3
    return 4
}

export function VideoGrid({localParticipant, remoteParticipants}: VideoGridProps) {
    const participants = [
        ...(localParticipant ? [localParticipant] : []),
        ...remoteParticipants,
    ]

    if (participants.length === 0) {
        return (
            <div className="flex min-h-0 flex-1 w-full items-center justify-center p-[clamp(0.75rem,2vw,1.5rem)]">
                <div
                    className="flex h-full min-h-[10rem] w-full max-w-[1400px] items-center justify-center rounded-[clamp(1rem,2vw,1.5rem)] border-2 border-dashed border-white/10 px-4">
                    <p className="text-center font-medium text-text-secondary">No one has joined yet</p>
                </div>
            </div>
        )
    }

    const cols = getColumnCount(participants.length)

    const rows: typeof participants[] = []
    for (let i = 0; i < participants.length; i += cols) {
        rows.push(participants.slice(i, i + cols))
    }

    return (
        <div className="flex min-h-0 flex-1 w-full items-center justify-center p-[clamp(0.75rem,2vw,1.5rem)]">
            <div className="flex h-full w-full max-w-[1400px] min-h-0 flex-col gap-[clamp(0.5rem,1.4vw,1rem)]">
                {rows.map((row, rowIndex) => (
                    <div
                        key={rowIndex}
                        className="grid min-h-0 flex-1 gap-[clamp(0.5rem,1.4vw,1rem)] self-center"
                        style={{
                            gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`,
                            width: `${(row.length / cols) * 100}%`,
                        }}
                    >
                        {row.map((participant) => (
                            <div
                                key={participant.identity}
                                className="min-h-0 min-w-0"
                            >
                                <ParticipantTile
                                    participant={participant}
                                    isLocal={participant.identity === localParticipant?.identity}
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
