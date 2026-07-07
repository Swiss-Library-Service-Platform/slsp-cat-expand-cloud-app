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
    private targetFields: TargetField[];
    private conditions: SubfieldCondition[];
    private subfield: { code: string, value: string, description?: any, options?: string[], emptyValueFilled?: boolean };

    constructor(name: string, args: any) {
        super(name);
        const ruleArguments = args as RuleArguments;
        if (!ruleArguments.targetFields || !Array.isArray(ruleArguments.targetFields) || ruleArguments.targetFields.length === 0) {
            throw new Error('"targetFields" must be a non-empty array of target field objects.');
        }
        this.targetFields = ruleArguments.targetFields;
        this.conditions = ruleArguments.conditions || [];
        this.subfield = { ...ruleArguments.subfield, value: ruleArguments.subfield.value ?? '' };
        this.targetFields.forEach(tf => DatafieldUtils.validateTargetField(tf));
        DatafieldUtils.validateSubfieldCode(this.subfield.code);
        DatafieldUtils.validateAndCompileConditions(this.conditions);
    }

    public getTargetFields(): TargetField[] { return this.targetFields; }
    public getSubfield() { return this.subfield; }

    public getEmptySubfields(): EmptySubfield[] {
        if (this.subfield && this.subfield.value === '') {
            return [{
                fieldTag: this.targetFields.map(tf => tf.tag).join('/'),
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
            const fieldTag = this.targetFields.map(tf => tf.tag).join('/');
            const match = filledSubfields.find(
                es => es.fieldTag === fieldTag && es.code === this.subfield.code && es.ruleName === ruleName
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
        const tagList = this.targetFields.map(tf => tf.tag).join('/');
        const ind1 = this.targetFields[0].ind1 || ' ';
        const ind2 = this.targetFields[0].ind2 || ' ';
        return `${this.getName()}: ${tagList} - ${ind1} ${ind2}- <strong>$${this.subfield.code}</strong>`;
    }

    public apply(xmlDocument: Document): ChangeSet[] {
        this.log.info('apply rule:', this.getName());

        // Empty value means "prompt user" — skip if not yet filled via dialog
        if (this.subfield.value === '') {
            this.log.info('subfield value is empty, skipping (dialog should handle this).');
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
                    const newSubfield = xmlDocument.createElement('subfield');
                    newSubfield.setAttribute('code', this.subfield.code);
                    newSubfield.textContent = this.subfield.value;
                    datafield.appendChild(newSubfield);
                    changeSets.push(
                        this.getChangeSet(datafield, datafield.getAttribute('tag'), ChangeType.Change)
                    );
                }
            });
        });

        return changeSets;
    }
}

type RuleArguments = {
    targetFields: TargetField[];
    conditions?: SubfieldCondition[];
    subfield: { code: string, value: string, description?: any, options?: string[] };
};
