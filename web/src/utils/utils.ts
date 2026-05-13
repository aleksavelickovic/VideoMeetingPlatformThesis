export function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay()
}

export function pad(n: number) {
    return String(n).padStart(2, '0')
}

export function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

export function formatTime(iso: string | null | undefined): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'})
}
