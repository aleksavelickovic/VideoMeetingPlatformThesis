import {Injectable, signal} from '@angular/core'
import {RuntimeConfigService} from './runtime-config.service'
import {ThemeService} from './theme.service'

@Injectable({providedIn: 'root'})
export class AuthService {
    private readonly config: RuntimeConfigService
    private readonly theme: ThemeService
    readonly ready = signal(false)
    readonly loggedIn = signal(false)
    readonly profile = signal<{firstName: string; lastName: string; email: string}>({firstName: '', lastName: '', email: ''})

    constructor(config: RuntimeConfigService, theme: ThemeService) {
        this.config = config
        this.theme = theme
        void this.initialize()
    }

    token(): string | undefined { return localStorage.getItem('sessions_access_token') || undefined }

    login(): void {
        this.clearLocalSession()
        this.redirectToKeycloak()
    }

    register(): void {
        this.clearLocalSession()
        this.redirectToKeycloak('register')
    }

    logout(): void {
        const idToken = localStorage.getItem('sessions_id_token')
        this.clearLocalSession()
        this.loggedIn.set(false)
        const logoutUrl = `${this.config.keycloakUrl}/realms/${encodeURIComponent(this.config.keycloakRealm)}/protocol/openid-connect/logout`
        const params = new URLSearchParams({post_logout_redirect_uri: window.location.origin, client_id: this.config.keycloakClientId})
        if (idToken) params.set('id_token_hint', idToken)
        window.location.assign(`${logoutUrl}?${params}`)
    }

    account(): void {
        const redirect = encodeURIComponent(`${window.location.origin}/profile`)
        window.location.assign(`${this.config.keycloakUrl}/realms/${encodeURIComponent(this.config.keycloakRealm)}/account/?referrer=${encodeURIComponent(this.config.keycloakClientId)}&referrer_uri=${redirect}`)
    }

    updateToken(): Promise<boolean> { return Promise.resolve(!!this.token()) }

    private async initialize(): Promise<void> {
        const query = new URLSearchParams(window.location.search)
        const code = query.get('code')
        if (code) {
            try {
                const response = await fetch(`${this.config.keycloakUrl}/realms/${encodeURIComponent(this.config.keycloakRealm)}/protocol/openid-connect/token`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    body: new URLSearchParams({grant_type: 'authorization_code', client_id: this.config.keycloakClientId, code, redirect_uri: window.location.origin})
                })
                if (!response.ok) throw new Error('Keycloak token exchange failed')
                const tokens = await response.json() as {access_token: string; id_token?: string}
                localStorage.setItem('sessions_access_token', tokens.access_token)
                if (tokens.id_token) localStorage.setItem('sessions_id_token', tokens.id_token)
                window.history.replaceState({}, document.title, window.location.pathname)
            } catch { localStorage.removeItem('sessions_access_token') }
        }
        const token = this.token()
        this.loggedIn.set(!!token)
        this.readProfile(token)
        this.ready.set(true)
    }

    private redirectToKeycloak(action?: string): void {
        const endpoint = `${this.config.keycloakUrl}/realms/${encodeURIComponent(this.config.keycloakRealm)}/protocol/openid-connect/auth`
        const params = new URLSearchParams({client_id: this.config.keycloakClientId, redirect_uri: window.location.origin, response_type: 'code', scope: 'openid profile email', prompt: 'login', max_age: '0', theme: this.theme.isDark() ? 'dark' : 'light'})
        if (action) {
            params.set('kc_action', action)
            params.set('action', action)
        }
        window.location.assign(`${endpoint}?${params}`)
    }

    private clearLocalSession(): void {
        localStorage.removeItem('sessions_access_token')
        localStorage.removeItem('sessions_id_token')
        this.loggedIn.set(false)
    }

    private readProfile(value = this.token()): void {
        if (!value) return
        const token = JSON.parse(atob(value.split('.')[1])) as Record<string, string>
        if (!token) return
        this.profile.set({firstName: token['given_name'] || '', lastName: token['family_name'] || '', email: token['email'] || ''})
    }
}
