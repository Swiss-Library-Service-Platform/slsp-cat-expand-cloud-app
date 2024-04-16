/**
 * Represents a set of templates.
 */
import { Template } from './template';

export class TemplateSet {

	/** Default template set name */
	public static DEFAULT: string = "Default";

	/** List of templates in the set */
	private templates: Template[] = [];

	/**
	 * Creates an instance of TemplateSet.
	 * @param name - The name of the template set
	 */
	constructor(
		private name: string
	) { }

	/**
	 * Adds a template to the set.
	 * @param template - The template to add
	 */
	public addTemplate(template: Template): void {
		this.templates.push(template);
		this.templates.sort((a: Template, b: Template) => a.getName().localeCompare(b.getName()));
	}

	/**
	 * Retrieves the templates in the set.
	 * @returns List of templates
	 */
	public getTemplates(): Template[] {
		return this.templates;
	}

	/**
	 * Retrieves the name of the template set.
	 * @returns Name of the template set
	 */
	public getName(): string {
		return this.name;
	}
}