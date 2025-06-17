/**
 * Represents a template used for applying rules to XML data.
 */
import { ChangeSet, Rule } from './rules/rule';
import { XPathHelperService } from '../services/xpath-helper.service';
import { AddDataFieldRule } from './rules/add-data-field-rule';

export interface EmptySubfieldInfo {
	fieldTag: string;
	ruleName: string;
	ind1: string;
	ind2: string;
	code: string;
	inputValue: string;
}

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
	 * Applies the template to the given XML string.
	 * @param xmlString - The XML string to which the template will be applied
	 * @returns The modified XML string and the list of changes applied
	 */
	public findEmptySubfields(): EmptySubfieldInfo[] {
		const emptySubfields: EmptySubfieldInfo[] = [];

		this.rules.forEach(rule => {
			if (rule instanceof AddDataFieldRule) {
				const args = (rule as any)['subfields'];
				if (args) {
					args.forEach(subfield => {
						if (subfield.value === '') {
							const ruleSubfields = (rule as any)['subfields'];
							emptySubfields.push({
								fieldTag: (rule as any)['tag'],
								ruleName: this.computeRuleName(
									(rule as any)['tag'],
									(rule as any)['ind1'] || ' ',
									(rule as any)['ind2'] || ' ',
									ruleSubfields,
									subfield.code
								),
								ind1: (rule as any)['ind1'] || ' ',
								ind2: (rule as any)['ind2'] || ' ',
								code: subfield.code,
								inputValue: ''
							});
						}
					});
				}
			}
		});

		return emptySubfields;
	}

	/**
	 * Computes a human-readable display name for a MARC field rule.
	 * @param tag - The MARC field tag
	 * @param ind1 - First indicator
	 * @param ind2 - Second indicator
	 * @param subfields - Array of subfields with their codes and values
	 * @param currentCode - Optional subfield code to highlight in the output
	 * @returns Formatted string representing the MARC field
	 */
	private computeRuleName(tag: string, ind1: string, ind2: string, subfields: { code: string, value: string }[], currentCode?: string): string {
		const subfieldStr = subfields
			.map(sf => {
				const content = `$${sf.code}${sf.value ? ' ' + sf.value : ''}`;
				return sf.code === currentCode ? `<strong>${content}</strong>` : content;
			})
			.join(' ');
		return `${tag} - ${ind1} ${ind2}- ${subfieldStr}`;
	}

	/**
	 * Updates empty subfields with values provided by the user.
	 * @param filledSubfields - Array of EmptySubfieldInfo objects containing filled values
	 */
	public updateEmptySubfields(filledSubfields: EmptySubfieldInfo[]): void {
		this.rules.forEach(rule => {
			if (rule instanceof AddDataFieldRule) {
				const args = (rule as any)['subfields'];
				if (args) {
					args.forEach(subfield => {
						const match = filledSubfields.find(
							es => es.fieldTag === (rule as any)['tag'] && es.code === subfield.code
						);
						if (match && match.inputValue) {
							subfield.value = match.inputValue;
							subfield.emptyValueFilled = true;
						}
					});
				}
			}
		});
	}

	/**
	 * Resets any filled empty subfields back to their empty state.
	 * Removes the emptyValueFilled flag from subfields that were filled.
	 */
	public resetEmptySubfields(): void {
		this.rules.forEach(rule => {
			if (rule instanceof AddDataFieldRule) {
				const args = (rule as any)['subfields'];
				if (args) {
					args.forEach(subfield => {
						if (subfield.emptyValueFilled) {
							subfield.value = '';
							delete subfield.emptyValueFilled;
						}
					});
				}
			}
		});
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
			.filter(changeSet => changeSet !== undefined);

		const record: Node = this.xpath.querySingle('//record', xmlDom);
		xmlString = new XMLSerializer().serializeToString(record);
		return [xmlString, [].concat(...changes)];
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
