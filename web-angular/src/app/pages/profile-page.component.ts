import {Component, inject} from '@angular/core'
import {RouterLink} from '@angular/router'
import {AuthService} from '../core/auth.service'
import {SessionsHeaderComponent} from '../shared/sessions-header.component'

@Component({selector: 'app-profile-page', imports: [RouterLink, SessionsHeaderComponent], template: `<div class="min-h-screen bg-page"><app-sessions-header title="Profile"/><main class="mx-auto max-w-xl px-5 py-10"><section class="session-card p-6"><h1 class="text-2xl font-semibold text-slate-900">Profile</h1><p class="mt-2 text-sm text-muted">Manage your personal data and password in your secure Keycloak account.</p><dl class="mt-6 space-y-3 text-sm"><div><dt class="text-xs text-muted">Name</dt><dd class="text-slate-900">{{auth.profile().firstName}} {{auth.profile().lastName}}</dd></div><div><dt class="text-xs text-muted">Email</dt><dd class="text-slate-900">{{auth.profile().email}}</dd></div></dl><button class="btn-primary mt-7 w-full" (click)="auth.account()">Edit profile or change password</button><a routerLink="/" class="btn-secondary mt-3 w-full">Back to meetings</a></section></main></div>`})
export class ProfilePageComponent { protected readonly auth = inject(AuthService) }
