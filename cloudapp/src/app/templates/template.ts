import { Rule } from './rule'

export class Template {

	private rules: Rule[] = []

	constructor(
		private name: string
	) { }

	public addRule(rule: Rule): void {
		this.rules.push(rule)
	}

	public getRules(): Rule[] {
		return this.rules
	}

	public getName(): string {
		return this.name
	}

	public applyTemplate(recordXml: Document): void {
		this.rules.forEach(rule => rule.apply(recordXml))
	}
}
