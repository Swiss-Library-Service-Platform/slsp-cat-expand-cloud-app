import { ChangeSet, ChangeType, Rule } from './rule'
import { RuleCreator } from './rule-creator'
import { DatafieldUtils, SubfieldCondition, TargetField } from './datafield-utils'
import { EmptySubfield } from '../../components/empty-subfields-dialog/empty-subfields-dialog.component'

export class AddSubfieldRuleCreator extends RuleCreator<AddSubfieldRule> {
    forType(): string {
        return "AddSubfieldRule";
    }

    create(name: string, args: any): AddSubfieldRule {
        return new AddSubfieldRule(name, args);
    }
}

export class AddSubfieldRule extends Rule {
    private targetField: TargetField;
    private conditions: SubfieldCondition[];
    private subfield: { code: string, value: string, description?: any, options?: string[], emptyValueFilled?: boolean };

    constructor(name: string, args: any) {
        super(name);
        const ruleArguments = args as RuleArguments;
        this.targetField = ruleArguments.targetField;
        this.conditions = ruleArguments.conditions || [];
        this.subfield = { ...ruleArguments.subfield, value: ruleArguments.subfield.value ?? '' };
        DatafieldUtils.validateTargetField(this.targetField);
        DatafieldUtils.validateSubfieldCode(this.subfield.code);
        DatafieldUtils.validateAndCompileConditions(this.conditions);
    }

    public getTargetField(): TargetField { return this.targetField; }
    public getSubfield() { return this.subfield; }

    public getEmptySubfields(): EmptySubfield[] {
        if (this.subfield && this.subfield.value === '') {
            return [{
                fieldTag: this.targetField.tag,
                ruleName: this.computeRuleName(),
                code: this.subfield.code,
                inputValue: '',
                description: this.subfield.description || '',
                options: this.subfield.options
            }];
        }
        return [];
    }

    public fillEmptySubfields(filledSubfields: EmptySubfield[]): void {
        if (this.subfield && this.subfield.value === '') {
            const ruleName = this.computeRuleName();
            const match = filledSubfields.find(
                es => es.fieldTag === this.targetField.tag && es.code === this.subfield.code && es.ruleName === ruleName
            );
            if (match && match.inputValue) {
                this.subfield.value = match.inputValue;
                this.subfield.emptyValueFilled = true;
            }
        }
    }

    public resetFilledSubfields(): void {
        if (this.subfield && this.subfield.emptyValueFilled) {
            this.subfield.value = '';
            delete this.subfield.emptyValueFilled;
        }
    }

    private computeRuleName(): string {
        const ind1 = this.targetField.ind1 || ' ';
        const ind2 = this.targetField.ind2 || ' ';
        return `${this.getName()}: ${this.targetField.tag} - ${ind1} ${ind2}- <strong>$${this.subfield.code}</strong>`;
    }

    public apply(xmlDocument: Document): ChangeSet[] {
        this.log.info('apply rule:', this.getName());

        // Empty value means "prompt user" — skip if not yet filled via dialog
        if (this.subfield.value === '') {
            this.log.info('subfield value is empty, skipping (dialog should handle this).');
            return [];
        }

        const matchingFields = DatafieldUtils.findMatchingDatafields(this.targetField, xmlDocument, this.xpath);
        if (matchingFields.length === 0) {
            this.log.info(`No datafields found matching tag ${this.targetField.tag}.`);
            return [];
        }

        const changeSets: ChangeSet[] = [];

        matchingFields.forEach(datafield => {
            if (DatafieldUtils.evaluateConditions(datafield, this.conditions)) {
                const newSubfield = xmlDocument.createElement('subfield');
                newSubfield.setAttribute('code', this.subfield.code);
                newSubfield.textContent = this.subfield.value;
                datafield.appendChild(newSubfield);
                changeSets.push(
                    this.getChangeSet(datafield, this.targetField.tag, ChangeType.Change)
                );
            }
        });

        return changeSets;
    }
}

type RuleArguments = {
    targetField: TargetField;
    conditions?: SubfieldCondition[];
    subfield: { code: string, value: string, description?: any, options?: string[] };
};
