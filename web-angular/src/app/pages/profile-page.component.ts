import {Component, inject, signal} from '@angular/core'
import {RouterLink} from '@angular/router'
import {ReactiveFormsModule, FormBuilder, Validators} from '@angular/forms'
import {AuthService} from '../core/auth.service'
import {SessionsHeaderComponent} from '../shared/sessions-header.component'
import {MeetingApiService} from '../core/meeting-api.service'

@Component({selector: 'app-profile-page', imports: [RouterLink, ReactiveFormsModule, SessionsHeaderComponent], template: `<div class="min-h-screen bg-page"><app-sessions-header title="Profile"/><main class="mx-auto max-w-xl px-5 py-10"><section class="session-card p-6"><h1 class="text-2xl font-semibold text-slate-900">Profile</h1><p class="mt-2 text-sm text-muted">Change your name and email without leaving the application.</p><form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="save()"><label><span class="field-label">First name</span><input class="field-control" formControlName="firstName"></label><label><span class="field-label">Last name</span><input class="field-control" formControlName="lastName"></label><label><span class="field-label">Email</span><input class="field-control" type="email" formControlName="email"></label>@if (error()) {<p class="text-sm text-danger">{{error()}}</p>}@if (saved()) {<p class="text-sm text-success">Profile updated.</p>}@if (passwordResetSent()) {<p class="text-sm text-success">Password reset email sent.</p>}<button class="btn-primary w-full" [disabled]="loading()">{{loading() ? 'Saving…' : 'Save changes'}}</button></form><button class="btn-secondary mt-3 w-full" [disabled]="passwordResetLoading()" (click)="sendPasswordResetEmail()">{{passwordResetLoading() ? 'Sending…' : 'Change password by email'}}</button><a routerLink="/" class="btn-secondary mt-3 w-full">Back to meetings</a></section></main></div>`})
export class ProfilePageComponent {
    protected readonly auth = inject(AuthService)
    private readonly api = inject(MeetingApiService)
    private readonly fb = inject(FormBuilder)
    readonly loading = signal(false); readonly saved = signal(false); readonly error = signal(''); readonly passwordResetLoading = signal(false); readonly passwordResetSent = signal(false)
    readonly form = this.fb.nonNullable.group({firstName: ['', Validators.required], lastName: ['', Validators.required], email: ['', [Validators.required, Validators.email]]})
    constructor() { this.api.getProfile().subscribe({next: value => this.form.patchValue(value), error: () => this.error.set('Could not load profile.')}) }
    save(): void { this.saved.set(false); this.error.set(''); if (this.form.invalid) { this.form.markAllAsTouched(); return } this.loading.set(true); this.api.updateProfile(this.form.getRawValue()).subscribe({next: value => { this.form.patchValue(value); this.auth.profile.set(value); this.saved.set(true); this.loading.set(false) }, error: e => { this.error.set(e.error?.message || 'Could not update profile.'); this.loading.set(false) }}) }
    sendPasswordResetEmail(): void { this.error.set(''); this.passwordResetSent.set(false); this.passwordResetLoading.set(true); this.api.sendPasswordResetEmail().subscribe({next: () => { this.passwordResetSent.set(true); this.passwordResetLoading.set(false) }, error: e => { this.error.set(e.error?.message || 'Could not send password reset email.'); this.passwordResetLoading.set(false) }}) }
}
