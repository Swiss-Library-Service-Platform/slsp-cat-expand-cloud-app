import { ChangeSet, Rule } from './rules/rule'
import { XPathHelperService } from '../services/xpath-helper.service'

export class Template {

	private rules: Rule[] = []
	private xpath: XPathHelperService;

	constructor(
		private name: string,
		private source: string,
		private origin: TemplateOrigin,
	) {
		this.xpath = new XPathHelperService();
	}

	public addRule(rule: Rule): void {
		this.rules.push(rule)
	}

	public getRules(): Rule[] {
		return this.rules
	}

	public getName(): string {
		return this.name
	}

	public getSource(): string {
		return this.source
	}

	public getOrigin(): TemplateOrigin {
		return this.origin
	}

	public applyTemplate(xmlString: string): [string, ChangeSet[]] {
		const xmlDom = new DOMParser().parseFromString(xmlString, "application/xml")
		const changes: ChangeSet[][] = this.rules
			.map(rule => rule.apply(xmlDom))
			.filter(changeSet => changeSet !== undefined)

		const record: Node = this.xpath.querySingle('//record', xmlDom)
		xmlString = new XMLSerializer().serializeToString(record)
		return [xmlString, [].concat(...changes)]
	}
}

export enum TemplateOrigin {
	BuiltIn = "BUILTIN",
	User = "USER",
	Institution = "INSTITUTION"
}
