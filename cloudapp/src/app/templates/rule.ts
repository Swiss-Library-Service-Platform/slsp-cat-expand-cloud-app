import { AppInjector } from '../app-injector'
import { LogService } from '../services/log.service'
import { XPathHelperService } from '../services/xpath-helper.service'

export abstract class Rule {

	protected log: LogService
	protected xpath: XPathHelperService

	constructor(private description: string) {
		this.log = AppInjector.get(LogService)
		this.xpath = AppInjector.get(XPathHelperService)
	}

	public getDescription(): string {
		return this.description
	}

	public abstract apply(recordXml: Document): void
}
