import type {
    CreateMeetingDto,
    CreateMeetingResponse,
    MeetingDto,
    MeetingFilterRequest,
    FilterList,
} from '../types'

const BASE_URL = import.meta.env.VITE_API_URL as string
const API_KEY = import.meta.env.VITE_API_KEY as string

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    if (!BASE_URL || BASE_URL === 'undefined') {
        throw new Error('VITE_API_URL is not configured.')
    }

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ` + API_KEY,
            ...options?.headers,
        },
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({message: response.statusText}))
        throw new Error(error?.message ?? `Request failed: ${response.status}`)
    }

    return response.json() as Promise<T>
}

export async function createMeeting(dto: CreateMeetingDto): Promise<CreateMeetingResponse> {
    return request<CreateMeetingResponse>('/meetings', {
        method: 'POST',
        body: JSON.stringify(dto),
    })
}

export async function getMeetings(filter?: MeetingFilterRequest): Promise<FilterList<MeetingDto>> {
    const params = new URLSearchParams()
    if (filter?.page) params.set('page', String(filter.page))
    if (filter?.perPage) params.set('perPage', String(filter.perPage))
    if (filter?.search) params.set('search', filter.search)

    const query = params.size ? `?${params.toString()}` : ''
    return request<FilterList<MeetingDto>>(`/meetings${query}`)
}

export async function getMeeting(roomId: string): Promise<MeetingDto> {
    return request<MeetingDto>(`/meetings/${roomId}`)
}

export async function endMeeting(roomId: string): Promise<MeetingDto> {
    return request<MeetingDto>(`/meetings/${roomId}/end`, {method: 'POST'})
}
