import {CommonModule} from '@angular/common'
import {Component, forwardRef, HostListener} from '@angular/core'
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms'
import {Calendar, ChevronLeft, ChevronRight, Clock, LucideAngularModule} from 'lucide-angular'

const monthFormatter = new Intl.DateTimeFormat('en-US', {month: 'long', year: 'numeric'})
const displayFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
})

type CalendarCell = number | null

@Component({
    selector: 'app-date-time-picker',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateTimePickerComponent), multi: true}],
    template: `
        <div class="relative">
            <button type="button" class="field-control flex items-center justify-between gap-3 text-left"
                    [class.border-brand]="open" [attr.aria-expanded]="open" aria-haspopup="dialog"
                    (click)="toggle()">
                <span class="min-w-0 truncate" [class.text-white]="selectedDate" [class.text-[#60718c]]="!selectedDate">
                    {{ selectedDate ? displayValue() : 'mm/dd/yyyy, --:--' }}
                </span>
                <lucide-icon [img]="Calendar" class="size-4 shrink-0 text-muted"/>
            </button>

            @if (open) {
                <div class="datetime-picker-panel absolute left-0 top-full z-50 mt-2 w-full min-w-[300px] rounded-xl border border-line bg-panel p-4 shadow-panel"
                     role="dialog" aria-label="Choose meeting date and time">
                    <div class="flex items-center justify-between">
                        <button type="button" class="picker-nav" aria-label="Previous month"
                                [disabled]="isPreviousMonthDisabled()" (click)="changeMonth(-1)">
                            <lucide-icon [img]="ChevronLeft" class="size-4"/>
                        </button>
                        <span class="text-sm font-semibold text-white">{{ monthLabel() }}</span>
                        <button type="button" class="picker-nav" aria-label="Next month" (click)="changeMonth(1)">
                            <lucide-icon [img]="ChevronRight" class="size-4"/>
                        </button>
                    </div>

                    <div class="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted">
                        @for (day of weekdays; track day) { <span>{{ day }}</span> }
                    </div>
                    <div class="mt-2 grid grid-cols-7 gap-1">
                        @for (day of calendarCells(); track $index) {
                            @if (day === null) {
                                <span class="size-8"></span>
                            } @else {
                                <button type="button" class="picker-day" [class.selected]="isSelectedDay(day)"
                                        [class.today]="isToday(day)" [disabled]="isDateDisabled(day)"
                                        (click)="selectDay(day)">{{ day }}</button>
                            }
                        }
                    </div>

                    <div class="mt-4 border-t border-line pt-3">
                        <div class="mb-2 flex items-center gap-2 text-xs font-medium text-muted">
                            <lucide-icon [img]="Clock" class="size-3.5 text-brand"/> Time
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <label class="sr-only" for="meeting-hour">Hour</label>
                            <select id="meeting-hour" class="picker-select" [value]="hour"
                                    [disabled]="!selectedDate" (change)="selectHour($event)">
                                @for (item of hours; track item) {
                                    <option [value]="item" [disabled]="isHourDisabled(item)">{{ item }}</option>
                                }
                            </select>
                            <label class="sr-only" for="meeting-minute">Minute</label>
                            <select id="meeting-minute" class="picker-select" [value]="minute"
                                    [disabled]="!selectedDate" (change)="selectMinute($event)">
                                @for (item of minutes; track item) {
                                    <option [value]="item" [disabled]="isMinuteDisabled(item)">{{ item }}</option>
                                }
                            </select>
                        </div>
                    </div>

                    <button type="button" class="btn-primary mt-3 w-full py-2.5" [disabled]="!canConfirm()"
                            (click)="confirm()">Confirm</button>
                </div>
            }
        </div>
    `,
    styles: [`
        .datetime-picker-panel { background: #111a29; }
        .picker-nav { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: .5rem; border: 0; color: #8295b5; background: transparent; transition: background .15s, color .15s; }
        .picker-nav:hover:not(:disabled) { background: #1c293d; color: white; }
        .picker-nav:disabled { cursor: not-allowed; opacity: .3; }
        .picker-day { display: grid; place-items: center; width: 2rem; height: 2rem; border: 0; border-radius: .5rem; color: #b9c9e2; background: transparent; font-size: .75rem; transition: background .15s, color .15s; }
        .picker-day:hover:not(:disabled) { background: #1c293d; color: white; }
        .picker-day:disabled { cursor: not-allowed; color: #40506a; }
        .picker-day.today { border: 1px solid rgb(67 135 255 / .6); }
        .picker-day.selected { background: #397ef6; color: white; font-weight: 600; }
        .picker-day.selected:hover { background: #397ef6; }
        .picker-select { width: 100%; border: 1px solid #26354e; border-radius: .5rem; background: #172235; padding: .5rem .75rem; color: white; font-size: .875rem; outline: none; }
        .picker-select:focus { border-color: #397ef6; box-shadow: 0 0 0 2px rgb(57 126 246 / .2); }
        .picker-select:disabled { cursor: not-allowed; opacity: .4; }
    `]
})
export class DateTimePickerComponent implements ControlValueAccessor {
    readonly Calendar = Calendar
    readonly ChevronLeft = ChevronLeft
    readonly ChevronRight = ChevronRight
    readonly Clock = Clock
    readonly weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    readonly hours = Array.from({length: 24}, (_, index) => this.pad(index))
    readonly minutes = Array.from({length: 60}, (_, index) => this.pad(index))

    open = false
    disabled = false
    selectedDate: Date | null = null
    viewDate = this.startOfDay(new Date())
    hour = this.pad(new Date().getHours())
    minute = this.pad(new Date().getMinutes())

    private onChange: (value: string) => void = () => undefined
    private onTouched: () => void = () => undefined

    @HostListener('document:mousedown', ['$event'])
    closeWhenClickedOutside(event: MouseEvent): void {
        if (this.open && event.target instanceof Node && !this.elementContains(event.target)) this.open = false
    }

    private elementContains(target: Node): boolean {
        return (target as HTMLElement).closest('app-date-time-picker') !== null
    }

    toggle(): void {
        if (this.disabled) return
        this.open = !this.open
        if (this.open) {
            this.onTouched()
            if (this.selectedDate) this.viewDate = this.startOfMonth(this.selectedDate)
            else this.viewDate = this.startOfMonth(new Date())
        }
    }

    monthLabel(): string {
        return monthFormatter.format(this.viewDate)
    }

    calendarCells(): CalendarCell[] {
        const firstDay = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1).getDay()
        const daysInMonth = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 0).getDate()
        return Array.from({length: firstDay + daysInMonth}, (_, index) => index < firstDay ? null : index - firstDay + 1)
    }

    changeMonth(offset: number): void {
        const next = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + offset, 1)
        if (next < this.startOfMonth(new Date())) return
        this.viewDate = next
    }

    isPreviousMonthDisabled(): boolean {
        return this.viewDate.getFullYear() === new Date().getFullYear() && this.viewDate.getMonth() === new Date().getMonth()
    }

    isDateDisabled(day: number): boolean {
        return this.startOfDay(new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), day)) < this.startOfDay(new Date())
    }

    isToday(day: number): boolean {
        const today = new Date()
        return this.viewDate.getFullYear() === today.getFullYear() && this.viewDate.getMonth() === today.getMonth() && day === today.getDate()
    }

    isSelectedDay(day: number): boolean {
        return !!this.selectedDate && this.selectedDate.getFullYear() === this.viewDate.getFullYear() && this.selectedDate.getMonth() === this.viewDate.getMonth() && this.selectedDate.getDate() === day
    }

    selectDay(day: number): void {
        if (this.isDateDisabled(day)) return
        this.selectedDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), day)
        this.ensureValidTime()
    }

    isHourDisabled(item: string): boolean {
        if (!this.selectedDate || !this.isTodayDate(this.selectedDate)) return false
        return Number(item) < new Date().getHours()
    }

    isMinuteDisabled(item: string): boolean {
        if (!this.selectedDate || !this.isTodayDate(this.selectedDate)) return false
        const current = new Date()
        return Number(this.hour) < current.getHours() || (Number(this.hour) === current.getHours() && Number(item) <= current.getMinutes())
    }

    selectHour(event: Event): void {
        const value = (event.target as HTMLSelectElement).value
        if (!this.isHourDisabled(value)) {
            this.hour = value
            this.ensureValidTime()
        }
    }

    selectMinute(event: Event): void {
        const value = (event.target as HTMLSelectElement).value
        if (!this.isMinuteDisabled(value)) this.minute = value
    }

    canConfirm(): boolean {
        return !!this.selectedDate && !this.isHourDisabled(this.hour) && !this.isMinuteDisabled(this.minute)
    }

    confirm(): void {
        if (!this.canConfirm() || !this.selectedDate) return
        this.onChange(this.toLocalValue())
        this.open = false
    }

    displayValue(): string {
        if (!this.selectedDate) return ''
        return `${displayFormatter.format(this.selectedDate)} · ${this.hour}:${this.minute}`
    }

    writeValue(value: string | null): void {
        if (!value) {
            this.selectedDate = null
            return
        }
        const parsed = new Date(value)
        if (Number.isNaN(parsed.getTime())) return
        this.selectedDate = this.startOfDay(parsed)
        this.viewDate = this.startOfMonth(parsed)
        this.hour = this.pad(parsed.getHours())
        this.minute = this.pad(parsed.getMinutes())
    }

    registerOnChange(fn: (value: string) => void): void { this.onChange = fn }
    registerOnTouched(fn: () => void): void { this.onTouched = fn }
    setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled }

    private ensureValidTime(): void {
        if (!this.selectedDate || !this.isTodayDate(this.selectedDate)) return
        const now = new Date()
        if (Number(this.hour) < now.getHours()) this.hour = this.pad(now.getHours())
        if (Number(this.hour) === now.getHours() && Number(this.minute) <= now.getMinutes()) {
            this.minute = this.pad(Math.min(59, now.getMinutes() + 1))
            if (Number(this.minute) === 59 && now.getMinutes() === 59) this.hour = this.pad(now.getHours() + 1)
        }
    }

    private toLocalValue(): string {
        return `${this.selectedDate!.getFullYear()}-${this.pad(this.selectedDate!.getMonth() + 1)}-${this.pad(this.selectedDate!.getDate())}T${this.hour}:${this.minute}`
    }

    private isTodayDate(value: Date): boolean {
        const today = new Date()
        return value.getFullYear() === today.getFullYear() && value.getMonth() === today.getMonth() && value.getDate() === today.getDate()
    }

    private startOfDay(value: Date): Date { return new Date(value.getFullYear(), value.getMonth(), value.getDate()) }
    private startOfMonth(value: Date): Date { return new Date(value.getFullYear(), value.getMonth(), 1) }
    private pad(value: number): string { return String(value).padStart(2, '0') }
}
