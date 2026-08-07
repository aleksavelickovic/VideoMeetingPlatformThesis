import {Injectable} from '@angular/core'

declare global {
    interface Window {
        __env?: Record<string, string>
    }
}

@Injectable({providedIn: 'root'})
export class RuntimeConfigService {
    private readonly env = window.__env ?? {}
    readonly apiUrl = this.env['VITE_API_URL'] || '/api'
    readonly liveKitUrl = this.env['VITE_LIVEKIT_URL'] || 'ws://localhost:7880'
    readonly apiKey = this.env['VITE_API_KEY'] || ''
}
