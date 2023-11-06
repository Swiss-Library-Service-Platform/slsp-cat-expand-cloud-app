import { ChangeSet, ChangeType, Rule } from './rule'
import { RuleCreator } from './rule-creator'


export class AddDataFieldRuleCreator extends RuleCreator<AddDataFieldRule> {
	forType(): string {
		return AddDataFieldRule.name
	}

	create(name: string, args: any): AddDataFieldRule {
		return new AddDataFieldRule(name, args)
	}
}

class AddDataFieldRule extends Rule {

	private tag: string
	private ind1: string
	private ind2: string
	private code: string
	private value: string

	constructor(name: string, args: any) {
		super(name)
		const ruleArguments: RuleArguments = args as RuleArguments
		this.tag = ruleArguments.tag
		this.ind1 = ruleArguments.ind1
		this.ind2 = ruleArguments.ind2
		this.code = ruleArguments.code
		this.value = ruleArguments.value
	}

	public apply(xmlDocument: Document): ChangeSet[] {
		this.log.info('apply rule:', this.getName())
		const records: Element[] = Array.from(xmlDocument.getElementsByTagName('record'))
		if (records.length > 1) {
			this.log.error('found multiple records, don\'t know what to do.')
			return []
		}
		if (records.length == 0) {
			this.log.error('no reords found, don\'t know what to do.')
			return []
		}
		const record: Element = records[0]

		if (this.checkIfAlreadyPresent(xmlDocument)) {
			this.log.info(`Field ${this.tag}_${this.ind1}_${this.ind2}$$${this.code} with content ${this.value}, already exists.`)
			return
		}
		const newDataField: Element = this.createNode(xmlDocument)
		record.appendChild(newDataField)
		return [
			this.getChangeSet(newDataField, this.tag, ChangeType.Create)
		]
	}

	private checkIfAlreadyPresent(xmlDocument: Document): boolean {
		const subfieldQuery: string = `//datafield[@tag='${this.tag}'][@ind1='${this.ind1}'][@ind2='${this.ind2}']/subfield[@code='${this.code}']`
		const subfields: Node[] = this.xpath.queryList(subfieldQuery, xmlDocument)
		if (!subfields || subfields.length == 0) {
			return false
		}
		const alreadyPresentNode: Node = subfields.find(subfield => subfield.textContent == this.value)
		if (alreadyPresentNode) {
			return true
		}
		return false
	}

	private createNode(xmlDocument: Document): Element {
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

type RuleArguments = {
	tag: string
	ind1: string
	ind2: string
	code: string
	value: string
}
