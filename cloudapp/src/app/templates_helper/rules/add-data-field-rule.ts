import { ChangeSet, ChangeType, Rule } from './rule'
import { RuleCreator } from './rule-creator'

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
class AddDataFieldRule extends Rule {
    private tag: string;
    private ind1: string;
    private ind2: string;
    private code: string;
    private value: string;

    /**
     * Constructs an instance of AddDataFieldRule.
     * @param name - The name of the rule.
     * @param args - The arguments for the rule.
     */
    constructor(name: string, args: any) {
        super(name);
        const ruleArguments: RuleArguments = args as RuleArguments;
        this.tag = ruleArguments.tag;
        this.ind1 = ruleArguments.ind1;
        this.ind2 = ruleArguments.ind2;
        this.code = ruleArguments.code;
        this.value = ruleArguments.value;
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
            this.log.info(`Field ${this.tag}_${this.ind1}_${this.ind2}$$${this.code} with content ${this.value}, already exists.`);
            return;
        }
        const newDataField: Element = this.createNode(xmlDocument);
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
        conditions.push(`subfield[@code='${this.code}']`);
        const subfieldQuery: string = `//datafield[${conditions.join(' and ')}]`;
        const subfields: Node[] = this.xpath.queryList(subfieldQuery, xmlDocument);

        if (!subfields || subfields.length == 0) {
            return false;
        }
        const alreadyPresentNode: Node = subfields.find(subfield => subfield.textContent == this.value);
        if (alreadyPresentNode) {
            return true;
        }
        return false;
    }

    /**
     * Generates Condition for attribute for XML query.
     * @param attribute 
     * @param value 
     * @returns 
     */
    private generateCondition(attribute: string, value: string | undefined): string {
        return value ? `@${attribute}='${value}'` : `not(@${attribute}) or @${attribute}=' '`;
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
        const subfield: Element = xmlDocument.createElement('subfield');
        subfield.setAttribute('code', this.code);
        subfield.textContent = this.value;

        datafield.appendChild(subfield);
        return datafield;
    }
}

type RuleArguments = {
    tag: string;
    ind1: string;
    ind2: string;
    code: string;
    value: string;
};
