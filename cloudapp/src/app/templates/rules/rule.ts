import { AppInjector } from '../../app-injector'
import { LogService } from '../../services/log.service'
import { XPathHelperService } from '../../services/xpath-helper.service'

export abstract class Rule {

	protected log: LogService
	protected xpath: XPathHelperService
	protected name: string

	protected constructor(name: string) {
		this.name = name
		this.log = AppInjector.get(LogService)
		this.xpath = AppInjector.get(XPathHelperService)
	}

	public getName(): string {
		return this.name
	}

	public abstract apply(recordXml: Document): void
}
