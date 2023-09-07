import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { CloudAppEventsService, HttpMethod, Request } from '@exlibris/exl-cloudapp-angular-lib'
import { Observable, of } from 'rxjs'
import { switchMap } from 'rxjs/operators'



@Injectable({
    providedIn: 'root'
})
export class NetworkZoneRestService {

    private static IS_PROD: string = 'false'
    private static PROXY_URL: string = 'https://proxy02.swisscovery.network/p/api-eu.hosted.exlibrisgroup.com/almaws/v1/'

    constructor(
        private httpClient: HttpClient,
        private eventsService: CloudAppEventsService,
    ) {
    }

    call(request: Request): Observable<any> {
        switch (request.method) {
            case HttpMethod.GET:
                return this.get(request)
            case HttpMethod.PUT:
                return this.put(request)
            default:
                throw new Error("HTTP method not supported")
        }
    }

    private get(request: Request): Observable<any> {
        const url: string = this.buildUrl(request)
        return this.mergeHttpsOptions(request)
            .pipe(
                switchMap(httpOptions => this.httpClient.get(url, httpOptions))
            )
    }

    private put(request: Request): Observable<any> {
        const url: string = this.buildUrl(request)
        return this.mergeHttpsOptions(request)
            .pipe(
                switchMap(httpOptions => this.httpClient.put(url, request.requestBody, httpOptions))
            )
    }

    private mergeHttpsOptions(request: Request): Observable<any> {
        return this.eventsService.getAuthToken()
            .pipe(
                switchMap(authToken => {
                    const httpOptions = {
                        params: Object.assign({ 'isProdEnvironment': NetworkZoneRestService.IS_PROD }, request.queryParams),
                        headers: new HttpHeaders(Object.assign({
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': `application/json`
                        }, request.headers)),
                        withCredentials: true
                    }
                    return of(httpOptions)
                })
            )
    }

    private buildUrl(request: Request): string {
        const regex = /\/+/gm
        const url: string = NetworkZoneRestService.PROXY_URL + request.url
        return url.replace(regex, '/')
    }
}
