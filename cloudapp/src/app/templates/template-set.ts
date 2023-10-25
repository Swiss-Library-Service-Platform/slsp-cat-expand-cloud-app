import { Template } from './template'

export class TemplateSet {

	public static DEFAULT: string = "Default"

	private templates: Template[] = []


	constructor(
		private name: string
	) { }

	public addTemplate(template: Template): void {
		this.templates.push(template)
		this.templates.sort((a: Template, b: Template) => a.getName().localeCompare(b.getName()))
	}

	public getTemplates(): Template[] {
		return this.templates
	}

	public getName(): string {
		return this.name
	}
}
