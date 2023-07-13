import { Rule } from './rule'


export class AddDataFieldRule extends Rule {

	constructor(
		description: string,
		private tag: string,
		private ind1: string,
		private ind2: string,
		private code: string,
		private value: string
	) {
		super(description)
	}

	public apply(xmlDocument: Document): void {
		this.log.info('apply rule:', this.getDescription())
		const records: Element[] = Array.from(xmlDocument.getElementsByTagName('record'))
		if (records.length > 1) {
			this.log.error('found multiple records, don\'t know what to do.')
			return
		}
		if (records.length == 0) {
			this.log.error('no reords found, don\'t know what to do.')
			return
		}
		const record: Element = records[0]
		record.appendChild(this.createNode(xmlDocument))
	}

	private createNode(xmlDocument: Document): Node {
		const datafield: Element = xmlDocument.createElement('datafield')
		datafield.setAttribute('tag', this.tag)
		if (this.ind1 != null) {
			datafield.setAttribute('ind1', this.ind1)
		} else {
			datafield.setAttribute('ind1', ' ')
		}
		if (this.ind2 != null) {
			datafield.setAttribute('ind2', this.ind2)
		} else {
			datafield.setAttribute('ind2', ' ')
		}
		const subfield: Element = xmlDocument.createElement('subfield')
		subfield.setAttribute('code', this.code)
		subfield.textContent = this.value

		datafield.appendChild(subfield)
		return datafield
	}
}
