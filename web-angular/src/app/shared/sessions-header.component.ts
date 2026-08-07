import {Component, input} from '@angular/core'
import {RouterLink} from '@angular/router'
import {LucideAngularModule, Video} from 'lucide-angular'

@Component({
    selector: 'app-sessions-header',
    imports: [RouterLink, LucideAngularModule],
    template: `
        <header class="flex h-[51px] items-center justify-between border-b border-[#1c283b] bg-[#0d1119] px-6">
            <a routerLink="/" class="flex items-center gap-2 text-sm font-semibold text-white">
                <span class="grid size-7 place-items-center rounded-md bg-[#3975e6]"><lucide-icon [img]="Video"
                                                                                                  class="size-4"/></span>
                Sessions
            </a>
            @if (title()) {
                <span class="max-w-[50%] truncate text-xs text-[#506889]">{{ title() }}</span>
            }
        </header>
    `
})
export class SessionsHeaderComponent {
    readonly title = input('');
    protected readonly Video = Video
}
