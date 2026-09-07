import {Component, inject} from '@angular/core'
import {Router, RouterLink} from '@angular/router'
import {ArrowRight, Link2, LucideAngularModule} from 'lucide-angular'
import {AuthService} from '../core/auth.service'
import {SessionsHeaderComponent} from '../shared/sessions-header.component'

@Component({
    selector: 'app-landing-page',
    imports: [RouterLink, SessionsHeaderComponent, LucideAngularModule],
    template: `
        <div class="landing-page min-h-screen overflow-hidden bg-page">
            <app-sessions-header [showGuestAuth]="false"/>
            <main class="landing-main relative isolate flex min-h-[calc(100svh-51px)] items-center justify-center px-5 py-12 sm:px-8">
                <svg class="connection-field" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    @for (path of connectionPaths; track path) {
                        <path class="connection-line" [attr.d]="path" pathLength="1"/>
                    }
                </svg>
                <div class="landing-glow landing-glow-one" aria-hidden="true"></div>
                <div class="landing-glow landing-glow-two" aria-hidden="true"></div>

                <section
                        class="landing-card relative z-10 w-full max-w-[700px] rounded-[2rem] px-6 py-10 text-center sm:px-14 sm:py-14">
                    <div class="mx-auto inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/35 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.16em] text-brand shadow-sm backdrop-blur-md">
                        <lucide-icon [img]="Link2" class="size-3.5"/>
                        Reliable meetings, beautifully simple
                        <lucide-icon [img]="Link2" class="size-3.5"/>
                    </div>
                    <h1 class="mt-7 text-5xl font-semibold tracking-[-.06em] text-slate-900 sm:text-7xl">Connecta</h1>
                    <p class="mx-auto mt-5 max-w-[500px] text-base leading-7 text-slate-600 sm:text-lg">
                        Meet, capture and stay connected without the friction. No account required to get started.
                    </p>
                    <a routerLink="/create-meeting"
                       class="group btn-primary mx-auto mt-9 min-h-14 w-full max-w-[360px] rounded-2xl px-5 text-sm shadow-xl shadow-blue-500/20 sm:text-base">
                        Get started with your first meeting
                        <lucide-icon [img]="ArrowRight"
                                     class="size-4 transition-transform group-hover:translate-x-0.5"/>
                    </a>
                    <div class="mx-auto mt-10 h-px w-24 bg-gradient-to-r from-transparent via-brand/40 to-transparent"></div>
                    <p class="mx-auto mt-8 max-w-[440px] text-sm leading-6 text-slate-500">
                        Not sure about the details of your meeting yet? Create an account so you can edit it later.
                    </p>
                    <button type="button" class="landing-secondary-button mt-5" (click)="register()">
                        Register / Log in
                    </button>
                </section>
            </main>
        </div>
    `
})
export class LandingPageComponent {
    private readonly auth = inject(AuthService)
    private readonly router = inject(Router)
    protected readonly ArrowRight = ArrowRight
    protected readonly Link2 = Link2
    protected readonly connectionPaths = [
        'M -8 16 C 10 16, 18 5, 34 8 S 53 22, 72 13 S 91 4, 108 9',
        'M -8 74 C 10 70, 18 82, 31 73 S 52 50, 67 61 S 87 82, 108 67',
        'M 8 108 C 10 85, 22 76, 35 68 S 55 40, 63 25 S 82 2, 88 -8',
        'M 34 108 C 41 91, 36 78, 47 66 S 67 53, 73 38 S 73 13, 69 -8',
        'M 108 28 C 91 27, 88 39, 75 37 S 54 26, 44 36 S 29 58, 14 51 S 0 41, -8 44',
        'M 108 90 C 93 83, 84 91, 71 84 S 53 67, 42 76 S 24 101, 12 92 S 0 80, -8 86',
        'M 18 -8 C 21 9, 14 21, 25 31 S 46 43, 43 57 S 25 83, 32 108',
        'M 82 -8 C 74 10, 87 21, 78 34 S 57 45, 61 60 S 84 83, 76 108',
        'M -8 34 C 12 39, 19 29, 34 35 S 53 53, 68 45 S 87 27, 108 34',
        'M -8 59 C 10 53, 22 63, 36 57 S 54 39, 70 48 S 91 67, 108 57',
        'M 4 -8 C 12 10, 5 25, 18 38 S 40 57, 35 73 S 18 94, 24 108',
        'M 48 -8 C 42 12, 51 25, 45 40 S 31 61, 42 76 S 62 95, 57 108',
        'M 104 6 C 88 10, 86 21, 72 18 S 51 3, 40 14 S 23 32, 8 25 S -2 15, -8 18',
        'M 108 48 C 92 42, 84 52, 72 58 S 53 77, 39 67 S 19 46, 6 55 S -2 72, -8 69',
        'M 62 108 C 68 91, 58 82, 66 68 S 88 50, 82 34 S 67 11, 75 -8',
        'M 96 108 C 88 91, 98 76, 87 65 S 69 49, 76 34 S 97 13, 91 -8',
        'M -8 7 C 14 13, 24 1, 41 10 S 60 29, 77 20 S 96 4, 108 2',
        'M -8 91 C 8 84, 21 96, 36 88 S 57 67, 73 78 S 93 96, 108 87',
        'M 12 108 C 19 88, 8 74, 21 61 S 44 45, 39 29 S 23 6, 31 -8',
        'M 52 108 C 59 91, 48 78, 57 64 S 79 43, 70 28 S 53 8, 61 -8',
        'M 108 17 C 91 23, 82 12, 67 20 S 47 39, 32 29 S 13 10, -8 15',
        'M 108 76 C 92 70, 83 82, 69 73 S 50 53, 34 62 S 13 84, -8 77',
        'M 26 -8 C 34 9, 27 22, 38 36 S 58 51, 52 66 S 34 91, 40 108',
        'M 90 -8 C 81 9, 91 24, 80 39 S 61 59, 69 73 S 88 94, 83 108',
        'M -8 47 C 9 43, 22 49, 37 43 S 57 25, 72 34 S 91 51, 108 45',
        'M -8 67 C 11 73, 21 65, 37 71 S 56 91, 73 82 S 93 62, 108 70',
        'M 43 -8 C 37 8, 47 20, 40 34 S 22 57, 31 71 S 50 94, 46 108',
        'M 71 -8 C 65 9, 76 24, 68 39 S 47 58, 55 74 S 74 95, 70 108',
        'M 108 38 C 91 32, 80 43, 66 37 S 47 19, 33 28 S 12 48, -8 41',
        'M 108 61 C 91 67, 81 56, 67 63 S 48 83, 34 74 S 13 54, -8 63',
        'M 6 -8 C 2 12, 16 24, 9 39 S -2 65, 8 81 S 18 99, 14 108',
        'M 108 101 C 94 91, 84 101, 71 91 S 53 71, 39 81 S 18 101, -8 95'
    ]

    register(): void {
        if (this.auth.loggedIn()) {
            void this.router.navigateByUrl('/profile')
            return
        }
        this.auth.register()
    }
}
