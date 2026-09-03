import {Component, inject, input} from '@angular/core'
import {RouterLink} from '@angular/router'
import {LucideAngularModule, Moon, Sun, Video, UserRound} from 'lucide-angular'
import {ThemeService} from '../core/theme.service'
import {AuthService} from '../core/auth.service'

@Component({
    selector: 'app-sessions-header',
    imports: [RouterLink, LucideAngularModule],
    template: `
        <header class="flex h-[51px] items-center justify-between border-b border-line bg-white px-6 shadow-sm">
            <a routerLink="/" class="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span class="grid size-7 place-items-center rounded-md bg-brand text-white"><lucide-icon [img]="Video"
                                                                                                         class="size-4"/></span>
                Sessions
            </a>
            <div class="flex min-w-0 items-center gap-3">
                @if (title()) {
                    <span class="max-w-[50%] truncate text-xs text-slate-500">{{ title() }}</span>
                }
                @if (auth.loggedIn()) {
                    <a routerLink="/my-meetings" class="text-xs font-medium text-brand hover:underline">My meetings</a>
                }
                @if (!auth.loggedIn()) {
                    <!-- <button type="button" class="btn-secondary px-3 py-1.5 text-xs" (click)="auth.login()">Log in</button> -->
                    <button type="button" class="btn-primary px-3 py-1.5 text-xs" (click)="auth.register()">Log in or
                        Register
                    </button>
                }
                @if (auth.loggedIn()) {
                    <a routerLink="/profile" class="text-xs text-muted hover:text-brand">
                        <lucide-icon [img]="UserRound" class="mr-1 inline size-4"/>
                        Profile</a>
                    <button type="button" class="text-xs text-muted hover:text-danger" (click)="auth.logout()">Log out
                    </button>
                }
                <button type="button" class="theme-toggle" (click)="toggleTheme($event)"
                        [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'">
                    @if (theme.isDark()) {
                        <lucide-icon [img]="Sun" class="size-4"/>
                    } @else {
                        <lucide-icon [img]="Moon" class="size-4"/>
                    }
                </button>
            </div>
        </header>
    `
})
export class SessionsHeaderComponent {
    protected readonly theme = inject(ThemeService)
    protected readonly auth = inject(AuthService)
    readonly title = input('');
    protected readonly Video = Video
    protected readonly Moon = Moon
    protected readonly Sun = Sun
    protected readonly UserRound = UserRound

    toggleTheme(event: Event): void {
        this.theme.toggle(event.currentTarget as HTMLElement)
    }
}
