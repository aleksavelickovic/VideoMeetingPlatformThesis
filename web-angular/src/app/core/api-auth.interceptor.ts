import {HttpInterceptorFn} from '@angular/common/http'
import {inject} from '@angular/core'
import {RuntimeConfigService} from './runtime-config.service'
import {AuthService} from './auth.service'

export const apiAuthInterceptor: HttpInterceptorFn = (request, next) => {
    const config = inject(RuntimeConfigService)
    if (!request.url.startsWith(config.apiUrl)) return next(request)
    const auth = inject(AuthService)
    const token = auth.token() || config.apiKey
    return next(request.clone({setHeaders: {'Content-Type': 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {})}}))
}
