export interface JoinIdentity {
    name: string;
    isHost: boolean
}

export function readJoinIdentity(token: string | null): JoinIdentity {
    if (!token) return {name: '', isHost: false}
    try {
        const segment = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(segment)) as Record<string, unknown>
        return {name: String(payload['name'] ?? payload['sub'] ?? ''), isHost: payload['metadata'] === 'host'}
    } catch {
        return {name: '', isHost: false}
    }
}
