import {ApplicationConfig, ErrorHandler, Injectable, inject, provideBrowserGlobalErrorListeners} from '@angular/core'
import {provideHttpClient, withInterceptors} from '@angular/common/http'
import {provideRouter} from '@angular/router'
import {routes} from './app.routes'
import {apiAuthInterceptor} from './core/api-auth.interceptor'

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    handleError(error: unknown): void {
        console.error('[Sessions]', error)
    }
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        provideHttpClient(withInterceptors([apiAuthInterceptor])),
        {provide: ErrorHandler, useClass: GlobalErrorHandler}
    ]
}
