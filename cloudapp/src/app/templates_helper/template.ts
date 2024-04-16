/**
 * Represents a template used for applying rules to XML data.
 */
import { ChangeSet, Rule } from './rules/rule';
import { XPathHelperService } from '../services/xpath-helper.service';

export class Template {

	/** List of rules associated with the template */
	private rules: Rule[] = [];
	/** Helper service for XPath queries */
	private xpath: XPathHelperService;

	/**
	 * Creates an instance of Template.
	 * @param name - The name of the template
	 * @param source - The source code of the template
	 * @param origin - The origin of the template (built-in, user-defined, or institution-defined)
	 */
	constructor(
		private name: string,
		private source: string,
		private origin: TemplateOrigin,
	) {
		this.xpath = new XPathHelperService();
	}

	/**
	 * Adds a rule to the template.
	 * @param rule - The rule to add
	 */
	public addRule(rule: Rule): void {
		this.rules.push(rule);
	}

	/**
	 * Retrieves the rules associated with the template.
	 * @returns List of rules
	 */
	public getRules(): Rule[] {
		return this.rules;
	}

	/**
	 * Retrieves the name of the template.
	 * @returns Name of the template
	 */
	public getName(): string {
		return this.name;
	}

	/**
	 * Retrieves the source code of the template.
	 * @returns Source code of the template
	 */
	public getSource(): string {
		return this.source;
	}

	/**
	 * Retrieves the origin of the template.
	 * @returns Origin of the template
	 */
	public getOrigin(): TemplateOrigin {
		return this.origin;
	}

	/**
	 * Applies the template to the given XML string.
	 * @param xmlString - The XML string to which the template will be applied
	 * @returns The modified XML string and the list of changes applied
	 */
	public applyTemplate(xmlString: string): [string, ChangeSet[]] {
		const xmlDom = new DOMParser().parseFromString(xmlString, "application/xml");
		const changes: ChangeSet[][] = this.rules
			.map(rule => rule.apply(xmlDom))
			.filter(changeSet => changeSet !== undefined);

		const record: Node = this.xpath.querySingle('//record', xmlDom);
		xmlString = new XMLSerializer().serializeToString(record);
		return [xmlString, [].concat(...changes)];
	}
}

/** Enum representing the origin of a template */
export enum TemplateOrigin {
	BuiltIn = "BUILTIN",
	User = "USER",
	Institution = "INSTITUTION"
}