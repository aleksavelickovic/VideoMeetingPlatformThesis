import React, {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {Plus, Trash2, Video, Users, Link, Clock, Webhook, FileJson, Crown, Monitor} from 'lucide-react'
import {createMeeting} from '../api/MeetingApi.ts'
import type {CreateParticipantDto} from '../types'
import {useMountTransition} from '../hooks/useMountTransition'
import {DateTimePicker} from '../components/DateTimePicker'
import {FormErrors, ParticipantRowProps} from '../types/pages.ts'
import {RESOLUTION_PRESETS, CUSTOM_RESOLUTION} from "../constants/constants.ts";


function validate(fields: {
    title: string; scheduledAt: string; durationLimitMinutes: string
    joinBaseUrl: string; callbackUrl: string; participants: CreateParticipantDto[]
    recordingWidth: string; recordingHeight: string
}): FormErrors {
    const errors: FormErrors = {}
    const urlRegex = /^https?:\/\/.+/
    if (!fields.title.trim()) errors.title = 'Title is required.'
    if (!fields.scheduledAt) errors.scheduledAt = 'Please select a date and time.'
    const duration = Number(fields.durationLimitMinutes)
    if (!fields.durationLimitMinutes || isNaN(duration) || duration < 1) errors.durationLimitMinutes = 'Enter a valid duration (min 1 minute).'
    if (!fields.joinBaseUrl.trim()) errors.joinBaseUrl = 'Join base URL is required.'
    else if (!urlRegex.test(fields.joinBaseUrl.trim())) errors.joinBaseUrl = 'Must start with http:// or https://'
    if (fields.callbackUrl.trim() && !urlRegex.test(fields.callbackUrl.trim())) errors.callbackUrl = 'Must start with http:// or https://'
    const recordingWidth = Number(fields.recordingWidth)
    const recordingHeight = Number(fields.recordingHeight)
    if (!fields.recordingWidth || isNaN(recordingWidth) || recordingWidth < 1) errors.recordingWidth = 'Enter a valid width.'
    if (!fields.recordingHeight || isNaN(recordingHeight) || recordingHeight < 1) errors.recordingHeight = 'Enter a valid height.'
    if (fields.participants.length === 0) errors.participants = 'Add at least one participant.'
    else if (!fields.participants.some(p => p.role === 'host')) errors.participants = 'At least one participant must be a host.'
    const participantNames: Record<number, string> = {}
    fields.participants.forEach((p, i) => {
        if (!p.name.trim()) participantNames[i] = 'Name is required.'
    })
    if (Object.keys(participantNames).length > 0) errors.participantNames = participantNames
    return errors
}

function getPresetValue(width: string, height: string) {
    const match = RESOLUTION_PRESETS.find(p => String(p.width) === width && String(p.height) === height)
    return match?.value ?? CUSTOM_RESOLUTION
}

function sanitizeDimensionInput(value: string) {
    return value.replace(/\D/g, '').slice(0, 5)
}

function ParticipantRow({index, participant, onChange, onRemove, nameError, canRemove}: ParticipantRowProps) {
    const isHost = participant.role === 'host'

    return (
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 items-center">
            <div className="min-w-0">
                <input
                    type="text"
                    value={participant.name}
                    onChange={e => onChange(index, 'name', e.target.value)}
                    placeholder="Full name"
                    onFocus={(e) => e.target.select()}
                    className={`w-full bg-transparent text-text-primary text-sm outline-none placeholder:text-text-secondary border-b pb-0.5 transition-colors ${nameError ? 'border-text-error' : 'border-border focus:border-brand'}`}
                />
                <p className={`text-text-error text-xs mt-0.5 h-3.5 ${nameError ? 'visible' : 'invisible'}`}>{nameError ?? ''}</p>
            </div>

            <button
                onClick={() => !isHost && onChange(index, 'role', 'host')}
                disabled={isHost}
                className={`
                    flex items-center justify-center gap-1.5 w-20 py-1 rounded-lg border text-xs
                    transition-all duration-150 flex-shrink-0
                    ${isHost
                    ? 'bg-brand-muted border-brand text-brand cursor-default'
                    : 'bg-transparent border-border text-text-secondary hover:border-brand/50 hover:text-text-primary'
                }
                `}
            >
                <Crown className={`w-3 h-3 transition-colors ${isHost ? 'text-brand' : 'text-text-secondary'}`}/>
                Host
            </button>

            <div className="w-3.5 flex justify-center">
                {canRemove && (
                    <button
                        onClick={() => onRemove(index)}
                        className="text-text-secondary hover:text-text-error transition-colors flex-shrink-0 mb-1"
                    >
                        <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                )}
            </div>
        </div>
    )
}

function Field({icon, label, error, children}: {
    icon: React.ReactNode; label: string; error?: string; children: React.ReactNode
}) {
    return (
        <div
            className={`h-[72px] flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-surface border transition-colors ${error ? 'border-text-error' : 'border-border'}`}>
            <div
                className="w-8 h-8 rounded-lg bg-brand-muted flex items-center justify-center flex-shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
                <div className="text-xs text-text-secondary">{label}</div>
                {children}
                <p className={`text-text-error text-xs h-3.5 ${error ? 'visible' : 'invisible'}`}>{error ?? ''}</p>
            </div>
        </div>
    )
}

function RecordingSettingField({label, error, children, disabled}: {
    label: string; error?: string; children: React.ReactNode; disabled?: boolean
}) {
    return (
        <div
            className={`min-h-[72px] px-3 py-2.5 rounded-xl bg-page/20 border transition-colors ${disabled ? 'opacity-60' : ''} ${error ? 'border-text-error' : 'border-border'}`}>
            <div className="text-xs text-text-secondary">{label}</div>
            {children}
            <p className={`text-text-error text-xs h-3.5 ${error ? 'visible' : 'invisible'}`}>{error ?? ''}</p>
        </div>
    )
}

export function CreateMeetingPage() {
    const navigate = useNavigate()
    const mounted = useMountTransition()
    const [title, setTitle] = useState('')
    const [scheduledAt, setScheduledAt] = useState('')
    const [durationLimitMinutes, setDurationLimitMinutes] = useState('60')
    const [joinBaseUrl, setJoinBaseUrl] = useState(window.location.origin)
    const [callbackUrl, setCallbackUrl] = useState('')
    const [metadata, setMetadata] = useState('')
    const [recordingEnabled, setRecordingEnabled] = useState(false)
    const [recordingWidth, setRecordingWidth] = useState('1280')
    const [recordingHeight, setRecordingHeight] = useState('720')
    const [resolutionPreset, setResolutionPreset] = useState('1280x720')
    const [participants, setParticipants] = useState<CreateParticipantDto[]>([
        {name: '', role: 'host'}, {name: '', role: 'guest'}, {name: '', role: 'guest'},
    ])
    const [errors, setErrors] = useState<FormErrors>({})
    const [isLoading, setIsLoading] = useState(false)
    const [apiError, setApiError] = useState<string | null>(null)

    function handleParticipantChange(index: number, field: keyof CreateParticipantDto, value: string) {
        setParticipants(prev => prev.map((p, i) => {
            if (i === index) return {...p, [field]: value}
            if (field === 'role' && value === 'host') return {...p, role: 'guest'}
            return p
        }))
    }

    function handleResolutionPresetChange(value: string) {
        setResolutionPreset(value)
        if (value === CUSTOM_RESOLUTION) return

        const selectedPreset = RESOLUTION_PRESETS.find(p => p.value === value)
        if (!selectedPreset) return

        setRecordingWidth(String(selectedPreset.width))
        setRecordingHeight(String(selectedPreset.height))
    }

    function handleRecordingDimensionChange(field: 'width' | 'height', value: string) {
        const sanitizedValue = sanitizeDimensionInput(value)
        const nextWidth = field === 'width' ? sanitizedValue : recordingWidth
        const nextHeight = field === 'height' ? sanitizedValue : recordingHeight

        if (field === 'width') setRecordingWidth(sanitizedValue)
        else setRecordingHeight(sanitizedValue)

        setResolutionPreset(getPresetValue(nextWidth, nextHeight))
    }

    async function handleSubmit() {
        const validationErrors = validate({
            title,
            scheduledAt,
            durationLimitMinutes,
            joinBaseUrl,
            callbackUrl,
            participants,
            recordingWidth,
            recordingHeight
        })
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return
        }
        setErrors({});
        setApiError(null);
        setIsLoading(true)
        try {
            const response = await createMeeting({
                title: title.trim(),
                scheduledAt: new Date(scheduledAt).toISOString(),
                durationLimitMinutes: Number(durationLimitMinutes),
                participants,
                recording: {
                    enabled: recordingEnabled,
                    format: 'mp4',
                    width: Math.floor(Number(recordingWidth) / 2) * 2,
                    height: Math.floor(Number(recordingHeight) / 2) * 2,
                },
                callbackUrl: callbackUrl.trim(),
                joinBaseUrl: joinBaseUrl.trim(),
                metadata: metadata.trim(),
            })
            navigate('/meeting-created', {state: {result: response}})
        } catch (e) {
            setApiError((e as Error).message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-page p-4">
            <div
                className={`max-w-2xl w-full transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                <div className="text-center mb-4">
                    <h1 className="text-2xl text-text-primary mb-1">New Meeting</h1>
                    <p className="text-text-secondary text-sm">Set up your meeting and get join links for all
                        participants.</p>
                </div>
                <div className="space-y-2">

                    <Field icon={<Video className="w-4 h-4 text-brand"/>} label="Meeting title" error={errors.title}>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                               placeholder="Weekly sync, design review..."
                               className="w-full bg-transparent text-text-primary text-sm outline-none placeholder:text-text-secondary"/>
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <DateTimePicker value={scheduledAt} onChange={setScheduledAt} error={errors.scheduledAt}/>
                        <Field icon={<Clock className="w-4 h-4 text-brand"/>} label="Duration (minutes)"
                               error={errors.durationLimitMinutes}>
                            <input type="number" value={durationLimitMinutes}
                                   onChange={e => setDurationLimitMinutes(e.target.value)}
                                   className="w-full bg-transparent text-text-primary text-sm outline-none"/>
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Field icon={<Link className="w-4 h-4 text-brand"/>} label="Join base URL"
                               error={errors.joinBaseUrl}>
                            <input type="text" value={joinBaseUrl} onChange={e => setJoinBaseUrl(e.target.value)}
                                   className="w-full bg-transparent text-text-primary text-sm outline-none"/>
                        </Field>
                        <Field icon={<Webhook className="w-4 h-4 text-brand"/>} label="Callback URL (optional)"
                               error={errors.callbackUrl}>
                            <input type="text" value={callbackUrl} onChange={e => setCallbackUrl(e.target.value)}
                                   placeholder="https://webhook.site/..."
                                   className="w-full bg-transparent text-text-primary text-sm outline-none"/>
                        </Field>
                    </div>

                    <Field icon={<FileJson className="w-4 h-4 text-brand"/>} label="Additional Metadata (optional)">
                        <input type="text" value={metadata} onChange={e => setMetadata(e.target.value)}
                               placeholder="Meeting tags, external IDs..."
                               className="w-full bg-transparent text-text-primary text-sm outline-none"/>
                    </Field>

                    <div
                        className={`px-3 py-2.5 rounded-xl bg-surface border ${errors.participants ? 'border-text-error' : 'border-border'}`}>
                        <div
                            className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 items-center mb-2 pr-2 overflow-y-auto"
                            style={{scrollbarGutter: 'stable'}}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-brand-muted flex items-center justify-center">
                                    <Users className="w-4 h-4 text-brand"/>
                                </div>
                                <div>
                                    <div className="text-text-primary text-sm font-medium">Participants</div>
                                    <div className="text-text-secondary text-xs">A meeting can have exactly one host
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setParticipants(prev => [...prev, {name: '', role: 'guest'}])}
                                className="flex items-center justify-center gap-1 w-20 py-1 rounded-lg bg-brand-muted border border-brand text-brand text-xs transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97]"
                            >
                                <Plus className="w-3.5 h-3.5"/> Add
                            </button>
                            <div className="w-3.5" aria-hidden="true"/>
                        </div>
                        <p className={`text-text-error text-xs h-3.5 mb-1 ${errors.participants ? 'visible' : 'invisible'}`}>{errors.participants ?? ''}</p>
                        <div
                            className="space-y-2 overflow-y-auto pr-2 custom-scrollbar"
                            style={{height: '150px', scrollbarGutter: 'stable'}}
                        >
                            {participants.map((p, i) => (
                                <ParticipantRow
                                    key={i} index={i} participant={p}
                                    onChange={handleParticipantChange}
                                    onRemove={idx => {
                                        const isRemovingHost = participants[idx].role === 'host'
                                        const newParticipants = participants.filter((_, j) => j !== idx)
                                        if (isRemovingHost && newParticipants.length > 0) newParticipants[0].role = 'host'
                                        setParticipants(newParticipants)
                                    }}
                                    nameError={errors.participantNames?.[i]}
                                    canRemove={participants.length > 1}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border">
                        <div
                            className="w-10 h-10 rounded-lg bg-brand-muted flex items-center justify-center flex-shrink-0">
                            <span
                                className={`w-2.5 h-2.5 rounded-full transition-colors ${recordingEnabled ? 'bg-text-error animate-pulse' : 'bg-text-secondary'}`}/>
                        </div>
                        <div className="flex-1">
                            <div className="text-text-primary text-sm font-medium">Recording</div>
                            <div className="text-text-secondary text-xs">Save this meeting as an MP4</div>
                        </div>
                        <button
                            onClick={() => setRecordingEnabled(r => !r)}
                            className={`relative w-12 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center ${recordingEnabled ? 'bg-brand' : 'bg-surface border border-border'}`}
                        >
                            <span
                                className={`w-5 h-5 rounded-full bg-text-primary shadow transition-transform duration-200 ${recordingEnabled ? 'translate-x-6' : 'translate-x-0'}`}/>
                        </button>
                    </div>

                    <div className="rounded-xl bg-surface border border-border p-3">
                        <div className="flex items-center gap-2 mb-3">
                            <div
                                className="w-8 h-8 rounded-lg bg-brand-muted flex items-center justify-center flex-shrink-0">
                                <Monitor className="w-4 h-4 text-brand"/>
                            </div>
                            <div>
                                <div className="text-text-primary text-sm font-medium">Recording resolution</div>
                                <div className="text-text-secondary text-xs">Choose a preset or fine-tune width and
                                    height.
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.4fr)_1fr_1fr] gap-2">
                            <RecordingSettingField label="Preset" disabled={!recordingEnabled}>
                                <select
                                    value={resolutionPreset}
                                    onChange={e => handleResolutionPresetChange(e.target.value)}
                                    disabled={!recordingEnabled}
                                    className="w-full bg-transparent text-text-primary text-sm outline-none disabled:cursor-not-allowed"
                                >
                                    {RESOLUTION_PRESETS.map(option => (
                                        <option key={option.value} value={option.value}
                                                className="bg-surface text-text-primary">
                                            {option.label}
                                        </option>
                                    ))}
                                    <option value={CUSTOM_RESOLUTION} className="bg-surface text-text-primary">
                                        Custom
                                    </option>
                                </select>
                            </RecordingSettingField>
                            <RecordingSettingField label="Width" error={errors.recordingWidth}
                                                   disabled={!recordingEnabled}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={recordingWidth}
                                    onChange={e => handleRecordingDimensionChange('width', e.target.value)}
                                    disabled={!recordingEnabled}
                                    placeholder="1280"
                                    className="w-full bg-transparent text-text-primary text-sm outline-none placeholder:text-text-secondary disabled:cursor-not-allowed"
                                />
                            </RecordingSettingField>
                            <RecordingSettingField label="Height" error={errors.recordingHeight}
                                                   disabled={!recordingEnabled}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={recordingHeight}
                                    onChange={e => handleRecordingDimensionChange('height', e.target.value)}
                                    disabled={!recordingEnabled}
                                    placeholder="720"
                                    className="w-full bg-transparent text-text-primary text-sm outline-none placeholder:text-text-secondary disabled:cursor-not-allowed"
                                />
                            </RecordingSettingField>
                        </div>
                    </div>

                    {apiError && <p className="text-text-error text-xs text-center">{apiError}</p>}

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl text-text-primary bg-brand shadow-brand-glow text-sm transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Creating...' : 'Create Meeting'}
                    </button>
                </div>
            </div>
        </div>
    )
}
