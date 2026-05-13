import {Key, useState} from 'react'
import {useNavigate, useLocation} from 'react-router-dom'
import {Copy, Check, Video, Users, ExternalLink} from 'lucide-react'
import type {CreateMeetingResponse} from '../types'
import {useMountTransition} from '../hooks/useMountTransition'

function JoinLinkRow({name, role, joinLink}: { name: string; role: string; joinLink: string }) {
    const [copied, setCopied] = useState(false)
    const handleCopy = () => {
        navigator.clipboard.writeText(joinLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000)
    }
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border">
            <div className="w-8 h-8 rounded-full bg-avatar-gradient flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-text-primary font-semibold">{name.slice(0, 2).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-text-primary text-sm font-medium">{name}</span>
                    {role && <span
                        className="text-text-secondary text-xs px-1.5 py-0.5 rounded-full bg-brand-muted border border-border">{role}</span>}
                </div>
                <p className="text-text-secondary text-xs truncate">{joinLink}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <a href={joinLink} target="_blank" rel="noopener noreferrer"
                   className="text-text-secondary hover:text-brand transition-colors">
                    <ExternalLink className="w-3.5 h-3.5"/>
                </a>
                <button onClick={handleCopy} className="text-text-secondary hover:text-brand transition-colors">
                    {copied ? <Check className="w-3.5 h-3.5 text-brand"/> : <Copy className="w-3.5 h-3.5"/>}
                </button>
            </div>
        </div>
    )
}

export function MeetingCreatedPage() {
    const navigate = useNavigate()
    const mounted = useMountTransition()
    const location = useLocation()
    const result = (location.state as { result: CreateMeetingResponse })?.result

    if (!result) {
        navigate('/')
        return null
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-page">
            <div
                className={`max-w-2xl w-full transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                <div className="text-center mb-6">
                    <div
                        className="inline-flex w-14 h-14 rounded-full bg-brand-muted border-2 border-brand items-center justify-center mb-3">
                        <Check className="w-7 h-7 text-brand"/>
                    </div>
                    <h1 className="text-2xl text-text-primary mb-1">Meeting Created</h1>
                    <p className="text-text-secondary text-sm">Share the join links below with your participants.</p>
                </div>

                <div className="rounded-2xl p-4 bg-surface border border-border mb-4">
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
                        <Video className="w-4 h-4 text-brand flex-shrink-0"/>
                        <div>
                            <p className="text-text-secondary text-xs">Meeting title</p>
                            <p className="text-text-primary text-sm font-medium">{result.title}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-text-secondary"/>
                            <span
                                className="text-text-secondary text-xs">{result.participants.length} participants</span>
                        </div>
                        {result.recordingEnabled && (
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-text-error animate-pulse"/>
                                <span className="text-text-secondary text-xs">Recording enabled</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-2 mb-4">
                    {result.participants.map((p: { id: Key; name: string; role: string; joinLink: string }) => (
                        <JoinLinkRow key={p.id as Key} name={p.name} role={p.role} joinLink={p.joinLink}/>
                    ))}
                </div>

                <button onClick={() => navigate('/')}
                        className="w-full py-3 rounded-xl text-text-primary bg-surface border border-border text-sm transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]">
                    Create Another Meeting
                </button>
            </div>
        </div>
    )
}