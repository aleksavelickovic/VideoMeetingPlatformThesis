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
    readonly keycloakUrl = this.env['VITE_KEYCLOAK_URL'] || 'http://localhost:8080'
    readonly keycloakRealm = this.env['VITE_KEYCLOAK_REALM'] || 'lilly'
    readonly keycloakClientId = this.env['VITE_KEYCLOAK_CLIENT_ID'] || 'lilly-web'
}
