import { Injectable } from '@angular/core'
import { XPathHelperService } from '../services/xpath-helper.service'
import { LogService } from '../services/log.service'

@Injectable({
	providedIn: 'root'
})
export class RuleFactory {

	constructor(
		private xpathHelper: XPathHelperService,
		private log:LogService

	) {}

}
