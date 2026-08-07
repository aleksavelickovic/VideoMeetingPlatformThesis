import {Component, inject} from '@angular/core'
import {Router, RouterLink} from '@angular/router'
import {Check, Copy, ExternalLink, LucideAngularModule, Users, Video} from 'lucide-angular'
import {MeetingStateService} from '../core/meeting-state.service'
import {SessionsHeaderComponent} from '../shared/sessions-header.component'

@Component({
    selector: 'app-meeting-created-page',
    imports: [RouterLink, SessionsHeaderComponent, LucideAngularModule],
    template: `
        <div class="min-h-screen bg-page">
            <app-sessions-header/>
            @if (meeting(); as result) {
                <main class="mx-auto w-full max-w-[632px] px-5 py-12">
                    <div class="text-center"><span
                            class="mx-auto grid size-14 place-items-center rounded-full border-2 border-success bg-success/10"><lucide-icon
                            [img]="Check" class="size-7 text-success"/></span>
                        <h1 class="mt-4 text-2xl font-semibold text-white">Meeting Created</h1>
                        <p class="mt-2 text-sm text-muted">Share the join links below with your participants.</p></div>
                    <section class="session-card mt-8 p-5">
                        <div class="flex items-center gap-3 border-b border-[#1c293d] pb-4">
                            <lucide-icon [img]="Video" class="size-5 text-brand"/>
                            <div><p class="text-xs text-muted">Meeting title</p>
                                <p class="mt-1 text-sm font-semibold text-white">{{ result.title }}</p></div>
                        </div>
                        <div class="mt-4 flex gap-5 text-xs text-[#9db3d5]"><span class="flex items-center gap-1"><lucide-icon
                                [img]="Users" class="size-4"/>
                            {{ result.participants.length }} participants</span>@if (result.recordingEnabled) {
                            <span class="flex items-center gap-1"><i class="size-2 rounded-full bg-danger"></i>Recording enabled</span>
                        }</div>
                    </section>
                    <section class="mt-4 space-y-2">@for (participant of result.participants; track participant.id) {
                        <article class="session-card flex items-center gap-3 p-3"><span
                                class="grid size-9 place-items-center rounded-full border border-brand/40 bg-brand/10 text-xs font-semibold text-[#9bc2ff]">{{ initials(participant.name) }}</span>
                            <div class="min-w-0 flex-1"><p
                                    class="text-sm font-semibold text-white">{{ participant.name }} @if (participant.role === 'host') {
                                <small class="ml-1 rounded border border-amber/50 px-1 py-0.5 text-[9px] text-amber">HOST</small>
                            }</p>
                                <p class="mt-1 truncate text-xs text-muted">{{ participant.joinLink }}</p></div>
                            <a [href]="participant.joinLink" target="_blank" rel="noreferrer"
                               class="text-muted hover:text-white">
                                <lucide-icon [img]="ExternalLink" class="size-4"/>
                            </a>
                            <button (click)="copy(participant.joinLink)" class="text-muted hover:text-white"
                                    [attr.aria-label]="'Copy link for ' + participant.name">
                                <lucide-icon [img]="Copy" class="size-4"/>
                            </button>
                        </article>
                    }</section>
                    <p class="mt-3 h-5 text-center text-xs text-success">{{ copied }}</p><a routerLink="/"
                                                                                            class="btn-secondary mt-3 w-full">Create
                    Another Meeting</a>
                </main>
            } @else {
                <main class="grid min-h-[calc(100vh-51px)] place-items-center p-6 text-center">
                    <div><p class="text-lg text-white">No meeting result is available.</p><a routerLink="/"
                                                                                             class="btn-primary mt-5">Create
                        a meeting</a></div>
                </main>
            }
        </div>
    `
})
export class MeetingCreatedPageComponent {
    private readonly state = inject(MeetingStateService);
    protected readonly meeting = this.state.created;
    copied = ''
    protected readonly Check = Check;
    protected readonly Copy = Copy;
    protected readonly ExternalLink = ExternalLink;
    protected readonly Users = Users;
    protected readonly Video = Video

    initials(value: string): string {
        return value.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()
    }

    copy(value: string): void {
        navigator.clipboard.writeText(value).then(() => {
            this.copied = 'Join link copied';
            setTimeout(() => this.copied = '', 2000)
        })
    }
}
