import { Rule } from './rules/rule'

export class Template {

	private rules: Rule[] = []

	constructor(
		private name: string,
		private source: string,
		private origin: TemplateOrigin
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

	public getSource(): string {
		return this.source
	}

	public getOrigin(): TemplateOrigin {
		return this.origin
	}

	public applyTemplate(recordXml: Document): void {
		this.rules.forEach(rule => rule.apply(recordXml))
	}
}

export enum TemplateOrigin {
	BuiltIn = "BUILTIN",
	User = "USER"
}
