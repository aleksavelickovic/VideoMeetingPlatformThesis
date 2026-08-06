import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { RuntimeConfigService } from './runtime-config.service'

export const apiAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(RuntimeConfigService)
  if (!request.url.startsWith(config.apiUrl)) return next(request)
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' } }))
}
