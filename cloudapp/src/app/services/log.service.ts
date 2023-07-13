import { Injectable } from '@angular/core'

@Injectable({
	providedIn: 'root'
})
export class LogService {
	info(...args: any[]): void {
		console.info('[Record-Expander]', ...args)
	}
	error(...args: any[]): void {
		console.error('[Record-Expander][ERR]', ...args)
	}
}
