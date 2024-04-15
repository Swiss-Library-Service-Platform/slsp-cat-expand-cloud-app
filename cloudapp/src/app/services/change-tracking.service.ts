import { Injectable } from '@angular/core'
import { ChangeSet, ChangeType } from '../templates/rules/rule'

@Injectable({
	providedIn: 'root'
})
export class ChangeTrackingService {


	changes: ChangeSet[] = []

	constructor() { }

	public addChanges(change: ChangeSet[]): void {
		this.changes.push(...change)
	}

	public removeChange(change: ChangeSet): void {
		this.changes = this.changes.filter(c => c.changeHash !== change.changeHash)
	}
	
	public removeAllChanges(): void {
		this.changes = []
	}

	public getChanges(): ChangeSet[] {
		return this.changes
	}

	createChangeSet(element: Element, field: string, type: ChangeType): ChangeSet {
		return {
			changeHash: this.getNodeHash(element),
			changedField: field,
			type: type
		}
	}

	public getNodeHash(element: Element): number {
		const name: string = element.tagName
		const attrs: string[] = element.getAttributeNames() || []
		let attrsConcat: string = ''
		if (attrs.length > 0) {
			attrsConcat = attrs.reduce((acc, name) => {
				return acc + name + element.getAttribute(name)
			})
		}
		const value: string = element.textContent
		return this.hashString(name + attrsConcat + value)
	}

	private hashString(value: string): number {
		// from: https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
		let hash = 0
		for (let i = 0, len = value.length; i < len; i++) {
			let chr = value.charCodeAt(i)
			hash = (hash << 5) - hash + chr
			hash |= 0 // Convert to 32bit integer
		}
		return hash
	}
}
