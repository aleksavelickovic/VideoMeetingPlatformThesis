import {useState, useRef, useEffect} from 'react'
import {createPortal} from 'react-dom'
import {Calendar, Clock, ChevronLeft, ChevronRight} from 'lucide-react'
import '../styles/datetimepicker.css'
import {DateTimePickerProps} from "../types/components.ts";
import {MONTHS, DAYS} from "../constants/constants.ts";
import {getDaysInMonth, getFirstDayOfMonth, pad} from "../utils/utils.ts";

function formatDisplay(value: string): string {
    if (!value) return ''
    const d = new Date(value)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    }) + ' · ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

export function DateTimePicker({value, onChange, error}: DateTimePickerProps) {
    const [open, setOpen] = useState(false)
    const triggerRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const minuteRef = useRef<HTMLInputElement>(null)
    const [pos, setPos] = useState({top: 0, left: 0})

    const parsed = value ? new Date(value) : null
    const today = new Date()

    const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear())
    const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth())
    const [selectedDate, setSelectedDate] = useState<{ y: number; m: number; d: number } | null>(
        parsed ? {y: parsed.getFullYear(), m: parsed.getMonth(), d: parsed.getDate()} : null
    )

    const [hour, setHour] = useState(parsed ? pad(parsed.getHours()) : pad(today.getHours()))
    const [minute, setMinute] = useState(parsed ? pad(parsed.getMinutes()) : pad(today.getMinutes()))

    useEffect(() => {
        if (!open || !triggerRef.current) return
        const r = triggerRef.current.getBoundingClientRect()
        setPos({top: r.bottom + window.scrollY + 8, left: r.left + window.scrollX})
    }, [open])

    useEffect(() => {
        function handle(e: MouseEvent) {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
            ) setOpen(false)
        }

        document.addEventListener('mousedown', handle)
        return () => document.removeEventListener('mousedown', handle)
    }, [])

    useEffect(() => {
        if (!selectedDate) return
        const h = Math.min(23, Math.max(0, Number(hour) || 0))
        const m = Math.min(59, Math.max(0, Number(minute) || 0))
        onChange(`${selectedDate.y}-${pad(selectedDate.m + 1)}-${pad(selectedDate.d)}T${pad(h)}:${pad(m)}`)
    }, [selectedDate, hour, minute])

    const daysInMonth = getDaysInMonth(viewYear, viewMonth)
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
    const cells = Array.from({length: firstDay + daysInMonth}, (_, i) => i < firstDay ? null : i - firstDay + 1)

    const isSelected = (d: number) => selectedDate?.y === viewYear && selectedDate?.m === viewMonth && selectedDate?.d === d
    const isToday = (d: number) => today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d

    const dropdown = (
        <div
            ref={dropdownRef}
            className="datetimepicker-portal w-80 rounded-2xl overflow-hidden bg-[rgba(15,18,28,0.92)] backdrop-blur-[40px] border border-white/[0.12] shadow-[0_8px_48px_rgba(0,0,0,0.7)]"
            style={{top: pos.top, left: pos.left}}
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
                <button
                    onClick={() => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1)}
                    className="p-1 rounded-lg bg-white/[0.05] text-text-secondary hover:text-text-primary"><ChevronLeft
                    className="w-4 h-4"/></button>
                <span className="text-text-primary text-sm font-semibold">{MONTHS[viewMonth]} {viewYear}</span>
                <button
                    onClick={() => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1)}
                    className="p-1 rounded-lg bg-white/[0.05] text-text-secondary hover:text-text-primary"><ChevronRight
                    className="w-4 h-4"/></button>
            </div>
            <div className="grid grid-cols-7 px-3 pt-3 pb-1">{DAYS.map(d => <div key={d}
                                                                                 className="text-center text-xs text-text-secondary py-1 font-medium">{d}</div>)}</div>
            <div className="grid grid-cols-7 px-3 pb-3 gap-y-1">
                {cells.map((d, i) => (
                    <div key={i} className="flex items-center justify-center">
                        {d !== null && (
                            <button onClick={() => setSelectedDate({y: viewYear, m: viewMonth, d})}
                                    className={`w-8 h-8 rounded-lg text-sm transition-all ${isSelected(d) ? 'bg-brand text-text-primary font-semibold' : isToday(d) ? 'text-brand border border-brand/50' : 'text-text-primary hover:bg-white/[0.08]'}`}>{d}</button>
                        )}
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border-t border-white/[0.08]">
                <div className="w-8 h-8 rounded-lg bg-brand-muted flex items-center justify-center"><Clock
                    className="w-4 h-4 text-brand"/></div>
                <div className="flex items-center gap-2 ml-auto">
                    <input type="number" value={hour} onFocus={e => e.target.select()} onChange={e => {
                        setHour(pad(Math.min(23, Math.max(0, Number(e.target.value)))));
                        if (e.target.value.length >= 2) minuteRef.current?.select()
                    }}
                           className="w-12 text-center rounded-lg py-1.5 text-text-primary text-sm bg-white/[0.08] border border-white/[0.12] outline-none focus:border-brand"/>
                    <span className="text-text-secondary">:</span>
                    <input ref={minuteRef} type="number" value={minute} onFocus={e => e.target.select()}
                           onChange={e => setMinute(pad(Math.min(59, Math.max(0, Number(e.target.value)))))}
                           className="w-12 text-center rounded-lg py-1.5 text-text-primary text-sm bg-white/[0.08] border border-white/[0.12] outline-none focus:border-brand"/>
                </div>
            </div>
            <div className="px-4 pb-4">
                <button onClick={() => setOpen(false)} disabled={!selectedDate}
                        className="w-full py-2.5 rounded-xl text-text-primary bg-brand shadow-brand-glow text-sm disabled:opacity-40">Confirm
                </button>
            </div>
        </div>
    )

    return (
        <div ref={triggerRef} className="relative w-full">
            <div
                onClick={() => setOpen(o => !o)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer bg-surface border transition-colors h-[72px] ${error ? 'border-text-error' : open ? 'border-brand' : 'border-border'}`}
            >
                <div className="w-8 h-8 rounded-lg bg-brand-muted flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-brand"/>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="text-xs text-text-secondary leading-tight">Scheduled at</div>
                    <div
                        className={`text-sm truncate font-medium ${value ? 'text-text-primary' : 'text-text-secondary'}`}>
                        {value ? formatDisplay(value) : 'Pick a date and time'}
                    </div>
                    <p className={`text-text-error text-[10px] leading-none h-3 mt-0.5 ${error ? 'visible' : 'invisible'}`}>{error ?? ''}</p>
                </div>
            </div>
            {open && createPortal(dropdown, document.body)}
        </div>
    )
}