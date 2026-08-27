import {DOCUMENT} from '@angular/common'
import {inject, Injectable, signal} from '@angular/core'

@Injectable({providedIn: 'root'})
export class ThemeService {
    private readonly document = inject(DOCUMENT)
    readonly isDark = signal(false)

    constructor() {
        const savedTheme = this.readSavedTheme()
        this.isDark.set(savedTheme === 'dark')
        this.applyTheme(this.isDark())
    }

    toggle(origin: HTMLElement): void {
        const nextIsDark = !this.isDark()
        const bounds = origin.getBoundingClientRect()
        const root = this.document.documentElement
        root.style.setProperty('--theme-x', `${bounds.left + bounds.width / 2}px`)
        root.style.setProperty('--theme-y', `${bounds.top + bounds.height / 2}px`)

        const viewTransitionDocument = this.document as Document & {
            startViewTransition?: (callback: () => void) => {finished: Promise<void>}
        }
        if (viewTransitionDocument.startViewTransition) {
            viewTransitionDocument.startViewTransition(() => {
                this.isDark.set(nextIsDark)
                this.applyTheme(nextIsDark)
            })
        } else {
            this.isDark.set(nextIsDark)
            this.applyTheme(nextIsDark)
            root.classList.add('theme-fallback-transition')
            window.setTimeout(() => root.classList.remove('theme-fallback-transition'), 500)
        }
    }

    private applyTheme(dark: boolean): void {
        const root = this.document.documentElement
        root.classList.toggle('theme-dark', dark)
        try {
            localStorage.setItem('sessions-theme', dark ? 'dark' : 'light')
        } catch {
            // Storage can be unavailable in private browsing contexts.
        }
    }

    private readSavedTheme(): 'dark' | 'light' {
        try {
            return localStorage.getItem('sessions-theme') === 'dark' ? 'dark' : 'light'
        } catch {
            return 'light'
        }
    }
}
