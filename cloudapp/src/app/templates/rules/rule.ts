import { AppInjector } from '../../app-injector'
import { ChangeTrackingService } from '../../services/change-tracking.service'
import { LogService } from '../../services/log.service'
import { XPathHelperService } from '../../services/xpath-helper.service'

export abstract class Rule {

	protected log: LogService
	protected xpath: XPathHelperService
	protected changeTrackingService: ChangeTrackingService
	protected name: string

	protected constructor(name: string) {
		this.name = name
		this.log = AppInjector.get(LogService)
		this.xpath = AppInjector.get(XPathHelperService)
		this.changeTrackingService = AppInjector.get(ChangeTrackingService)
	}

	public getName(): string {
		return this.name
	}

	public abstract apply(recordXml: Document): ChangeSet[]

	protected getChangeSet(element: Element, field: string, type: ChangeType) {
		const changeSet: ChangeSet = this.changeTrackingService.createChangeSet(element, field, type)
		console.log('ChangeSet', changeSet)
		return changeSet
	}
}

export type ChangeSet = {
	changeHash: number,
	changedField: string,
	type: ChangeType
}

export enum ChangeType {
	Change = 'CHANGE',
	Create = 'CREATE',
	None = 'NONE'
}
