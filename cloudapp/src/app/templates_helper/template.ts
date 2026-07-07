/**
 * Represents a template used for applying rules to XML data.
 */
import { ChangeSet, Rule } from './rules/rule';
import { XPathHelperService } from '../services/xpath-helper.service';
import { EmptySubfield } from '../components/empty-subfields-dialog/empty-subfields-dialog.component';

export class Template {

	/** List of rules associated with the template */
	private rules: Rule[] = [];
	/** Helper service for XPath queries */
	private xpath: XPathHelperService;
	/** Outdated flag */
	private outdated: boolean = false;

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
	 * Sets the template as outdated.
	 * @param outdated - True if the template is outdated, false otherwise
	 */
	public setOutdated(outdated: boolean): void {
		this.outdated = outdated;
	}

	/**
	 * Checks if the template is outdated
	 * @returns True if the template is outdated, false otherwise
	 */
	public isOutdated(): boolean {
		return this.outdated;
	}

	/**
	 * Retrieves the origin of the template.
	 * @returns Origin of the template
	 */
	public getOrigin(): TemplateOrigin {
		return this.origin;
	}

	/**
	 * Finds all empty subfields across all rules that need user input via the dialog.
	 * @returns Array of EmptySubfield objects representing fields that need user input
	 */
	public findEmptySubfields(): EmptySubfield[] {
		const result: EmptySubfield[] = [];
		this.rules.forEach(rule => result.push(...rule.getEmptySubfields()));
		return result;
	}

	/**
	 * Updates empty subfields with values provided by the user.
	 * @param filledSubfields - Array of EmptySubfield objects containing filled values
	 */
	public updateEmptySubfields(filledSubfields: EmptySubfield[]): void {
		this.rules.forEach(rule => rule.fillEmptySubfields(filledSubfields));
	}

	/**
	 * Resets any filled empty subfields back to their empty state.
	 */
	public resetEmptySubfields(): void {
		this.rules.forEach(rule => rule.resetFilledSubfields());
	}

	/**
	 * Applies the template to the provided XML string, creating all MARC fields defined in the rules.
	 * @param xmlString - The XML string representing the MARC record
	 * @returns Tuple containing the modified XML string and an array of changes made
	 */
	public applyTemplate(xmlString: string): [string, ChangeSet[]] {
		const xmlDom = new DOMParser().parseFromString(xmlString, "application/xml");
		const changes: ChangeSet[][] = this.rules
			.map(rule => rule.apply(xmlDom))
			.filter(changeSet => changeSet !== undefined && changeSet.length > 0);

		const record: Node = this.xpath.querySingle('//record', xmlDom);
		xmlString = new XMLSerializer().serializeToString(record);
		return [xmlString, ([] as ChangeSet[]).concat(...changes)];
	}
}

/**
 * Represents the origin of a template to determine its source and permissions.
 */
export enum TemplateOrigin {
	BuiltIn = "BUILTIN",
	User = "USER",
	Institution = "INSTITUTION"
}
