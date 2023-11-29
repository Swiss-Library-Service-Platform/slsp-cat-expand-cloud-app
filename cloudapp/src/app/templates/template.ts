import { ChangeSet, Rule } from './rules/rule'

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

	public applyTemplate(recordXml: Document): ChangeSet[] {
		const changes: ChangeSet[][] = this.rules
			.map(rule => rule.apply(recordXml))
			.filter(changeSet => changeSet !== undefined)
		return [].concat(...changes)
	}
}

export enum TemplateOrigin {
	BuiltIn = "BUILTIN",
	User = "USER",
	Institution = "INSTITUTION"
}
