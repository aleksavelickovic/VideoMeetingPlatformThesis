import {HttpClient, HttpParams} from '@angular/common/http'
import {Injectable, inject} from '@angular/core'
import {Observable} from 'rxjs'
import {CreateMeetingDto, CreateMeetingResponse, FilterList, MeetingDto} from '../models/meeting.models'
import {RuntimeConfigService} from './runtime-config.service'

@Injectable({providedIn: 'root'})
export class MeetingApiService {
    private readonly http = inject(HttpClient)
    private readonly config = inject(RuntimeConfigService)

    private get baseUrl(): string {
        return this.config.apiUrl.replace(/\/$/, '')
    }

    createMeeting(dto: CreateMeetingDto): Observable<CreateMeetingResponse> {
        return this.http.post<CreateMeetingResponse>(`${this.baseUrl}/meetings`, dto)
    }

    getMeeting(roomId: string): Observable<MeetingDto> {
        return this.http.get<MeetingDto>(`${this.baseUrl}/meetings/${roomId}`)
    }

    endMeeting(roomId: string, notes: string | null = null): Observable<MeetingDto> {
        return this.http.post<MeetingDto>(`${this.baseUrl}/meetings/${roomId}/end`, {notes})
    }

    getMeetings(page = 1, perPage = 20): Observable<FilterList<MeetingDto>> {
        return this.http.get<FilterList<MeetingDto>>(`${this.baseUrl}/meetings`, {params: new HttpParams().set('page', page).set('perPage', perPage)})
    }

    getMyMeetings(): Observable<MeetingDto[]> { return this.http.get<MeetingDto[]>(`${this.baseUrl}/meetings/mine`) }
    updateMeeting(roomId: string, dto: unknown): Observable<MeetingDto> { return this.http.put<MeetingDto>(`${this.baseUrl}/meetings/${roomId}`, dto) }
    getProfile(): Observable<{firstName: string; lastName: string; email: string}> { return this.http.get<{firstName: string; lastName: string; email: string}>(`${this.baseUrl}/auth/me`) }
    updateProfile(dto: {firstName: string; lastName: string; email: string}): Observable<{firstName: string; lastName: string; email: string}> { return this.http.put<{firstName: string; lastName: string; email: string}>(`${this.baseUrl}/auth/me`, dto) }
}
