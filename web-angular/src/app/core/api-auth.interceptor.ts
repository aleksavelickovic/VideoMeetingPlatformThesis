import {HttpInterceptorFn} from '@angular/common/http'
import {inject} from '@angular/core'
import {RuntimeConfigService} from './runtime-config.service'
import {AuthService} from './auth.service'

export const apiAuthInterceptor: HttpInterceptorFn = (request, next) => {
    const config = inject(RuntimeConfigService)
    if (!request.url.startsWith(config.apiUrl)) return next(request)
    const auth = inject(AuthService)
    const token = isProtectedRequest(request, config.apiUrl) ? auth.token() : undefined
    return next(request.clone({setHeaders: {'Content-Type': 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {})}}))
}

function isProtectedRequest(request: {method: string; url: string}, apiUrl: string): boolean {
    const apiPath = new URL(apiUrl, window.location.origin).pathname.replace(/\/$/, '')
    const path = new URL(request.url, window.location.origin).pathname.replace(new RegExp(`^${apiPath}`), '')
    if (path.startsWith('/auth/')) return true
    if (path === '/meetings/mine') return true
    return request.method === 'PUT' && /^\/meetings\/[^/]+$/.test(path)
}
