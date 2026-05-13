import {useState, useEffect} from 'react'
import {UseParticipantNameResult} from "../types/hooks.ts";

function parseJwtPayload(token: string): Record<string, unknown> {
    try {
        const payload = token.split('.')[1]
        return JSON.parse(atob(payload))
    } catch {
        return {}
    }
}

export function useParticipantName(token: string | null): UseParticipantNameResult {
    const [participantName, setParticipantName] = useState('')
    const [isHost, setIsHost] = useState(false)

    useEffect(() => {
        if (!token) return
        const payload = parseJwtPayload(token)
        const name = (payload.name as string) ?? (payload.sub as string) ?? ''
        if (name) setParticipantName(name)
        setIsHost(payload.metadata === 'host')
    }, [token])

    return {participantName, setParticipantName, isHost}
}