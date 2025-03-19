import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { CloudAppEventsService, HttpMethod, Request } from '@exlibris/exl-cloudapp-angular-lib'
import { Observable, of } from 'rxjs'
import { switchMap } from 'rxjs/operators'



@Injectable({
    providedIn: 'root'
})
export class NetworkZoneRestService {

    public static IS_PROD: string = 'false'
    private static PROXY_DOMAIN: string = 'https://proxy02.swisscovery.network/'
    private static PROXY_PATH: string = 'p/api-eu.hosted.exlibrisgroup.com/almaws/v1/'

    constructor(
        private httpClient: HttpClient,
        private eventsService: CloudAppEventsService,
    ) {    }

    setIsProdEnvironment(initData: any): boolean {
        let regExp = new RegExp('^https(.*)psb(.*)com/?$|.*localhost.*'), // contains "PSB" (Premium Sandbox) or "localhost"
            currentUrl = initData["urls"]["alma"];
        let isProd = !regExp.test(currentUrl);
        NetworkZoneRestService.IS_PROD = isProd ? 'true' : 'false';
        return isProd;
    }

    call(request: Request, isProxyRequest: Boolean = true): Observable<any> {
        switch (request.method) {
            case HttpMethod.GET:
                return this.get(request, isProxyRequest)
            case HttpMethod.PUT:
                return this.put(request, isProxyRequest)
            default:
                throw new Error("HTTP method not supported")
        }
    }

    private get(request: Request, isProxyRequest: Boolean): Observable<any> {
        const url: string = this.buildUrl(request, isProxyRequest)
        return this.mergeHttpsOptions(request)
            .pipe(
                switchMap(httpOptions => this.httpClient.get(url, httpOptions))
            )
    }

    private put(request: Request, isProxyRequest: Boolean): Observable<any> {
        const url: string = this.buildUrl(request, isProxyRequest)
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

    private buildUrl(request: Request, isProxyRequest: Boolean): string {
        const regex = /\/+/gm;
        const path: string = (isProxyRequest ? NetworkZoneRestService.PROXY_PATH : '') + request.url;
        return NetworkZoneRestService.PROXY_DOMAIN + path.replace(regex, '/');
    }

    /**
     * Checks if the current user has the required roles to use the application
     * Uses the proxy endpoint which checks against NZ roles
     * @returns Promise<boolean>
     */
    async checkUserRoles(): Promise<boolean> {
        try {
            const response = await this.call({
                url: 'check-user-roles',
                method: HttpMethod.GET
            }, false 
        ).toPromise();
            return response.hasRequiredRoles;
        } catch (error) {
            console.error('Error checking user roles:', error);
            return false;
        }
    }
}
