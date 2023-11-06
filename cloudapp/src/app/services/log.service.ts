import { Injectable } from '@angular/core'

@Injectable({
	providedIn: 'root'
})
export class LogService {
	debug = console.log.bind(window.console, '[Record-Expander][DEBUG]')
	info = console.log.bind(window.console, '[Record-Expander]')
	warn = console.warn.bind(window.console, '[Record-Expander][WARN]')
	error = console.error.bind(window.console, '[Record-Expander][ERROR]')
}
