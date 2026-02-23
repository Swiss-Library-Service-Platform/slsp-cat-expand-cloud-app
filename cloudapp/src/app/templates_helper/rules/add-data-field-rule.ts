import { ChangeSet, ChangeType, Rule } from './rule'
import { RuleCreator } from './rule-creator'
import { DatafieldUtils } from './datafield-utils'
import { EmptySubfield } from '../../components/empty-subfields-dialog/empty-subfields-dialog.component'

/**
 * Rule creator for creating AddDataFieldRule instances.
 */
export class AddDataFieldRuleCreator extends RuleCreator<AddDataFieldRule> {
    /**
     * Returns the type string for AddDataFieldRule.
     * @returns The type string for AddDataFieldRule.
     */
    forType(): string {
        return "AddDataFieldRule";
    }

    /**
     * Creates a new AddDataFieldRule instance.
     * @param name - The name of the rule.
     * @param args - The arguments for the rule.
     * @returns A new AddDataFieldRule instance.
     */
    create(name: string, args: any): AddDataFieldRule {
        return new AddDataFieldRule(name, args);
    }
}

/**
 * Rule for adding a data field to an XML document.
 */
export class AddDataFieldRule extends Rule {
    /** MARC field tag */
    private tag: string;
    /** First indicator */
    private ind1: string;
    /** Second indicator */
    private ind2: string;
    /** Array of subfields with their codes and values */
    private subfields: { code: string, value: string, description?: any, options?: string[], emptyValueFilled?: boolean }[];

    /**
     * Constructs an instance of AddDataFieldRule.
     * @param name - The name of the rule.
     * @param args - The arguments for the rule.
     */
    constructor(name: string, args: any) {
        super(name);
        const ruleArguments: RuleArguments = args as RuleArguments;
        if (args.value || args.code) {
            throw new Error(`The rule is outdated. Please update the template or contact SLSP.`);
        }
        this.tag = ruleArguments.tag;
        this.ind1 = ruleArguments.ind1;
        this.ind2 = ruleArguments.ind2;
        this.subfields = ruleArguments.subfields;

        DatafieldUtils.validateTag(this.tag);
        DatafieldUtils.validateIndicator('ind1', this.ind1);
        DatafieldUtils.validateIndicator('ind2', this.ind2);
        if (this.subfields) {
            this.subfields.forEach(sf => DatafieldUtils.validateSubfieldCode(sf.code));
        }
    }

    public getTag(): string { return this.tag; }
    public getInd1(): string { return this.ind1; }
    public getInd2(): string { return this.ind2; }
    public getSubfields() { return this.subfields; }

    public getEmptySubfields(): EmptySubfield[] {
        const result: EmptySubfield[] = [];
        if (this.subfields) {
            this.subfields.forEach(subfield => {
                if (subfield.value === '') {
                    result.push({
                        fieldTag: this.tag,
                        ruleName: this.computeRuleName(subfield.code),
                        code: subfield.code,
                        inputValue: '',
                        description: subfield.description || '',
                        options: subfield.options
                    });
                }
            });
        }
        return result;
    }

    public fillEmptySubfields(filledSubfields: EmptySubfield[]): void {
        if (this.subfields) {
            // Snapshot ruleNames before any mutations, since computeRuleName
            // depends on current subfield values and filling one would change
            // the ruleName for subsequent subfields.
            const ruleNames = this.subfields.map(sf => this.computeRuleName(sf.code));
            this.subfields.forEach((subfield, index) => {
                const match = filledSubfields.find(
                    es => es.fieldTag === this.tag && es.code === subfield.code && es.ruleName === ruleNames[index]
                );
                if (match && match.inputValue) {
                    subfield.value = match.inputValue;
                    subfield.emptyValueFilled = true;
                }
            });
        }
    }

    public resetFilledSubfields(): void {
        if (this.subfields) {
            this.subfields.forEach(subfield => {
                if (subfield.emptyValueFilled) {
                    subfield.value = '';
                    delete subfield.emptyValueFilled;
                }
            });
        }
    }

    private computeRuleName(currentCode: string): string {
        const ind1 = this.ind1 || ' ';
        const ind2 = this.ind2 || ' ';
        const subfieldStr = this.subfields
            .map(sf => {
                const content = `$${sf.code}${sf.value ? ' ' + sf.value : ''}`;
                return sf.code === currentCode ? `<strong>${content}</strong>` : content;
            })
            .join(' ');
        return `${this.tag} - ${ind1} ${ind2}- ${subfieldStr}`;
    }

    /**
     * Applies the rule to an XML document.
     * @param xmlDocument - The XML document to apply the rule to.
     * @returns An array of ChangeSet objects representing the changes made by the rule.
     */
    public apply(xmlDocument: Document): ChangeSet[] {
        this.log.info('apply rule:', this.getName());
        const records: Element[] = Array.from(xmlDocument.getElementsByTagName('record'));
        if (records.length > 1) {
            this.log.error('found multiple records, don\'t know what to do.');
            return [];
        }
        if (records.length == 0) {
            this.log.error('no records found, don\'t know what to do.');
            return [];
        }
        const record: Element = records[0];

        if (this.checkIfAlreadyPresent(xmlDocument)) {
            this.log.info(`Field ${this.tag}_${this.ind1}_${this.ind2} with content ${this.subfields}, already exists.`);
            return [];
        }
        const newDataField: Element = this.createNode(xmlDocument);
        if (!newDataField) {
            // If all subfields were empty, don't create the field
            return [];
        }
        record.appendChild(newDataField);
        return [
            this.getChangeSet(newDataField, this.tag, ChangeType.Create)
        ];
    }

    /**
    * Checks if the data field is already present in the XML document.
    * @param xmlDocument - The XML document to check against.
    * @returns A boolean indicating whether the data field is already present.
    */
    private checkIfAlreadyPresent(xmlDocument: Document): boolean {
        let conditions: string[] = [];
        conditions.push(this.generateCondition('tag', this.tag));
        conditions.push(this.generateCondition('ind1', this.ind1));
        conditions.push(this.generateCondition('ind2', this.ind2));
        for (let subfield of this.subfields) {
            conditions.push(`subfield[@code=${DatafieldUtils.escapeXPathString(subfield.code)} and text()=${DatafieldUtils.escapeXPathString(subfield.value)}]`);
        }
        const datafieldQuery: string = `//datafield[${conditions.join(' and ')}]`;
        const datafields: Node[] = this.xpath.queryList(datafieldQuery, xmlDocument);
        return datafields.length > 0;
    }

    /**
     * Generates a condition string for an XML attribute query.
     * @param attribute - The name of the XML attribute to check
     * @param value - The value to match against, undefined means match empty or space
     * @returns XPath condition string for the attribute
     */
    private generateCondition(attribute: string, value: string | undefined): string {
        return value ? `@${attribute}=${DatafieldUtils.escapeXPathString(value)}` : `(not(@${attribute}) or @${attribute}=' ')`;
    }

    /**
     * Creates a new data field node for the XML document.
     * @param xmlDocument - The XML document to create the node for.
     * @returns The newly created data field node.
     */
    private createNode(xmlDocument: Document): Element {
        const datafield: Element = xmlDocument.createElement('datafield');
        datafield.setAttribute('tag', this.tag);
        if (this.ind1 != null) {
            datafield.setAttribute('ind1', this.ind1);
        } else {
            datafield.setAttribute('ind1', ' ');
        }
        if (this.ind2 != null) {
            datafield.setAttribute('ind2', this.ind2);
        } else {
            datafield.setAttribute('ind2', ' ');
        }

        // Only create subfields that have values
        const nonEmptySubfields = this.subfields.filter(sf => sf.value && sf.value.trim() !== '');

        // Only return datafield if it has at least one non-empty subfield
        if (nonEmptySubfields.length === 0) {
            return null;
        }

        nonEmptySubfields.forEach(subfield => {
            const newSubfield: Element = xmlDocument.createElement('subfield');
            newSubfield.setAttribute('code', subfield.code);
            newSubfield.textContent = subfield.value;
            datafield.appendChild(newSubfield);
        });

        return datafield;
    }
}

/**
 * Arguments required for creating a new AddDataFieldRule.
 */
type RuleArguments = {
    /** MARC field tag (e.g., '245') */
    tag: string;
    /** First indicator value */
    ind1: string;
    /** Second indicator value */
    ind2: string;
    /** Legacy field code - no longer used */
    code: string;
    /** Array of subfield definitions with their codes and values */
    subfields: { code: string, value: string }[];
};
