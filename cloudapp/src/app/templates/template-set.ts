import { Template } from './template'

export class TemplateSet {

	private templates: Template[] = []


	constructor(
		private name: string
	) { }

	public addTemplate(template: Template): void {
		this.templates.push(template)
	}

	public getTemplates(): Template[] {
		return this.templates
	}

	public getName(): string {
		return this.name
	}
}
