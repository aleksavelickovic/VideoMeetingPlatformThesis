import {AfterViewInit, Component, ElementRef, forwardRef, ViewChild} from '@angular/core'
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms'
import {Bold, Italic, List, ListOrdered, LucideAngularModule, Underline} from 'lucide-angular'

@Component({
    selector: 'app-rich-text-editor',
    standalone: true,
    imports: [LucideAngularModule],
    providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RichTextEditorComponent), multi: true}],
    template: `
        <div class="overflow-hidden rounded-lg border border-line bg-field shadow-sm focus-within:border-brand focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/20">
            <div class="flex flex-wrap items-center gap-1 border-b border-line bg-blue-50/70 px-2 py-1.5"
                 role="toolbar" aria-label="Description formatting">
                <button type="button" title="Bold (Ctrl/Cmd+B)" aria-label="Bold"
                        (mousedown)="format($event, 'bold')" [class.bg-blue-100]="formatting.bold"
                        class="grid size-8 place-items-center rounded text-slate-600 hover:bg-blue-50">
                    <lucide-icon [img]="Bold" class="size-4"/>
                </button>
                <button type="button" title="Italic (Ctrl/Cmd+I)" aria-label="Italic"
                        (mousedown)="format($event, 'italic')" [class.bg-blue-100]="formatting.italic"
                        class="grid size-8 place-items-center rounded text-slate-600 hover:bg-blue-50">
                    <lucide-icon [img]="Italic" class="size-4"/>
                </button>
                <button type="button" title="Underline (Ctrl/Cmd+U)" aria-label="Underline"
                        (mousedown)="format($event, 'underline')" [class.bg-blue-100]="formatting.underline"
                        class="grid size-8 place-items-center rounded text-slate-600 hover:bg-blue-50">
                    <lucide-icon [img]="Underline" class="size-4"/>
                </button>
                <span class="mx-1 h-5 w-px bg-line"></span>
                <button type="button" title="Bulleted list" aria-label="Bulleted list"
                        (mousedown)="format($event, 'insertUnorderedList')"
                        class="grid size-8 place-items-center rounded text-slate-600 hover:bg-blue-50">
                    <lucide-icon [img]="List" class="size-4"/>
                </button>
                <button type="button" title="Numbered list" aria-label="Numbered list"
                        (mousedown)="format($event, 'insertOrderedList')"
                        class="grid size-8 place-items-center rounded text-slate-600 hover:bg-blue-50">
                    <lucide-icon [img]="ListOrdered" class="size-4"/>
                </button>
            </div>
            <div #editor contenteditable="true" role="textbox" aria-multiline="true" spellcheck="true"
                 data-placeholder="Provide a short description of the meeting"
                 class="meeting-editor min-h-[112px] max-h-56 overflow-y-auto px-3 py-2.5 text-sm text-slate-900 outline-none"
                 (input)="sync()" (keyup)="refreshFormatting()" (mouseup)="refreshFormatting()"
                 (paste)="pasteAsText($event)"></div>
        </div>
    `
})
export class RichTextEditorComponent implements ControlValueAccessor, AfterViewInit {
    @ViewChild('editor') private editor?: ElementRef<HTMLElement>
    readonly Bold = Bold
    readonly Italic = Italic
    readonly Underline = Underline
    readonly List = List
    readonly ListOrdered = ListOrdered
    formatting = {bold: false, italic: false, underline: false}
    private value = ''
    private onChange: (value: string) => void = () => undefined
    private onTouched: () => void = () => undefined

    ngAfterViewInit(): void {
        this.setEditorValue()
    }

    writeValue(value: string | null): void {
        this.value = value || ''
        this.setEditorValue()
    }

    registerOnChange(fn: (value: string) => void): void { this.onChange = fn }
    registerOnTouched(fn: () => void): void { this.onTouched = fn }
    setDisabledState(isDisabled: boolean): void { this.editor?.nativeElement.toggleAttribute('contenteditable', !isDisabled) }

    format(event: MouseEvent, command: string): void {
        event.preventDefault()
        document.execCommand(command, false)
        this.sync()
        this.refreshFormatting()
    }

    sync(): void {
        const element = this.editor?.nativeElement
        if (!element) return
        this.value = element.textContent?.trim() ? element.innerHTML : ''
        this.onChange(this.value)
        this.onTouched()
        this.refreshFormatting()
    }

    pasteAsText(event: ClipboardEvent): void {
        event.preventDefault()
        document.execCommand('insertText', false, event.clipboardData?.getData('text/plain') ?? '')
        this.sync()
    }

    refreshFormatting(): void {
        this.formatting = {
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline')
        }
    }

    private setEditorValue(): void {
        if (this.editor && this.editor.nativeElement.innerHTML !== this.value) this.editor.nativeElement.innerHTML = this.value
    }
}
