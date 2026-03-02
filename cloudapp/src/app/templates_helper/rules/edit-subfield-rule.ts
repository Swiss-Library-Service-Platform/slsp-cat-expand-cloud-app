import { ChangeSet, ChangeType, Rule } from './rule'
import { RuleCreator } from './rule-creator'
import { DatafieldUtils, SubfieldCondition, TargetField } from './datafield-utils'
import { EmptySubfield } from '../../components/empty-subfields-dialog/empty-subfields-dialog.component'

export class EditSubfieldRuleCreator extends RuleCreator<EditSubfieldRule> {
    forType(): string {
        return "EditSubfieldRule";
    }

    create(name: string, args: any): EditSubfieldRule {
        return new EditSubfieldRule(name, args);
    }
}

export class EditSubfieldRule extends Rule {
    private targetFields: TargetField[];
    private conditions: SubfieldCondition[];
    private targetSubfield: { code: string, valueRegex?: RegExp };
    private replacement: string;
    private searchRegex: RegExp | null;
    private emptyValueFilled: boolean = false;

    constructor(name: string, args: any) {
        super(name);
        const ruleArguments = args as RuleArguments;
        if (!ruleArguments.targetFields || !Array.isArray(ruleArguments.targetFields) || ruleArguments.targetFields.length === 0) {
            throw new Error('"targetFields" must be a non-empty array of target field objects.');
        }
        this.targetFields = ruleArguments.targetFields;
        this.conditions = ruleArguments.conditions || [];
        this.targetSubfield = {
            code: ruleArguments.targetSubfield.code,
            valueRegex: ruleArguments.targetSubfield.valueRegex
                ? new RegExp(ruleArguments.targetSubfield.valueRegex)
                : undefined
        };
        this.replacement = ruleArguments.replacement ?? '';
        this.searchRegex = ruleArguments.searchRegex
            ? new RegExp(ruleArguments.searchRegex)
            : null;
        this.targetFields.forEach(tf => DatafieldUtils.validateTargetField(tf));
        DatafieldUtils.validateSubfieldCode(this.targetSubfield.code);
        DatafieldUtils.validateAndCompileConditions(this.conditions);
    }

    public getTargetFields(): TargetField[] { return this.targetFields; }
    public getTargetSubfield() { return this.targetSubfield; }
    public getReplacement(): string { return this.replacement; }
    public setReplacement(value: string): void { this.replacement = value; }
    public isEmptyValueFilled(): boolean { return this.emptyValueFilled; }
    public setEmptyValueFilled(filled: boolean): void { this.emptyValueFilled = filled; }

    public getEmptySubfields(): EmptySubfield[] {
        if (this.replacement === '') {
            return [{
                fieldTag: this.targetFields.map(tf => tf.tag).join('/'),
                ruleName: this.computeRuleName(),
                code: this.targetSubfield.code,
                inputValue: ''
            }];
        }
        return [];
    }

    public fillEmptySubfields(filledSubfields: EmptySubfield[]): void {
        if (this.replacement === '') {
            const ruleName = this.computeRuleName();
            const fieldTag = this.targetFields.map(tf => tf.tag).join('/');
            const match = filledSubfields.find(
                es => es.fieldTag === fieldTag && es.code === this.targetSubfield.code && es.ruleName === ruleName
            );
            if (match && match.inputValue) {
                this.replacement = match.inputValue;
                this.emptyValueFilled = true;
            }
        }
    }

    public resetFilledSubfields(): void {
        if (this.emptyValueFilled) {
            this.replacement = '';
            this.emptyValueFilled = false;
        }
    }

    private computeRuleName(): string {
        const tagList = this.targetFields.map(tf => tf.tag).join('/');
        const ind1 = this.targetFields[0].ind1 || ' ';
        const ind2 = this.targetFields[0].ind2 || ' ';
        return `${this.getName()}: ${tagList} - ${ind1} ${ind2}- <strong>$${this.targetSubfield.code}</strong>`;
    }

    public apply(xmlDocument: Document): ChangeSet[] {
        this.log.info('apply rule:', this.getName());

        // Empty replacement means "prompt user" — skip if not yet filled via dialog
        if (this.replacement === '') {
            this.log.info('replacement is empty, skipping (dialog should handle this).');
            return [];
        }

        const changeSets: ChangeSet[] = [];

        this.targetFields.forEach(targetField => {
            const matchingFields = DatafieldUtils.findMatchingDatafields(targetField, xmlDocument, this.xpath);
            if (matchingFields.length === 0) {
                this.log.info(`No datafields found matching tag ${targetField.tag}.`);
                return;
            }

            matchingFields.forEach(datafield => {
                if (DatafieldUtils.evaluateConditions(datafield, this.conditions)) {
                    const subfields = Array.from(datafield.getElementsByTagName('subfield'))
                        .filter(sf => sf.getAttribute('code') === this.targetSubfield.code);

                    // Optionally filter by valueRegex
                    const targets = this.targetSubfield.valueRegex
                        ? subfields.filter(sf => this.targetSubfield.valueRegex.test(sf.textContent))
                        : subfields;

                    let fieldChanged = false;
                    targets.forEach(sf => {
                        const oldValue = sf.textContent;
                        const newValue = this.searchRegex
                            ? oldValue.replace(this.searchRegex, this.replacement)
                            : this.replacement;

                        if (newValue !== oldValue) {
                            sf.textContent = newValue;
                            fieldChanged = true;
                        }
                    });

                    if (fieldChanged) {
                        changeSets.push(
                            this.getChangeSet(datafield, datafield.getAttribute('tag'), ChangeType.Change)
                        );
                    }
                }
            });
        });

        return changeSets;
    }
}

type RuleArguments = {
    targetFields: TargetField[];
    conditions?: SubfieldCondition[];
    targetSubfield: { code: string, valueRegex?: string };
    replacement: string;
    searchRegex?: string;
};
