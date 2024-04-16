import { LogService } from '../../services/log.service';
import { ChangeSet, ChangeType, Rule } from './rule';
import { RuleCreator } from './rule-creator';

/**
 * Rule creator for creating ChangeControlFieldRule instances.
 */
export class ChangeControlFieldRuleCreator extends RuleCreator<ChangeControlFieldRule> {
    /**
     * Returns the type string for ChangeControlFieldRule.
     * @returns The type string for ChangeControlFieldRule.
     */
    forType(): string {
        return ChangeControlFieldRule.name;
    }

    /**
     * Creates a new ChangeControlFieldRule instance.
     * @param name - The name of the rule.
     * @param args - The arguments for the rule.
     * @returns A new ChangeControlFieldRule instance.
     */
    create(name: string, args: any): ChangeControlFieldRule {
        return new ChangeControlFieldRule(name, args);
    }
}

/**
 * Rule for changing control field content in an XML document.
 */
class ChangeControlFieldRule extends Rule {
    private tag: string;
    private searchRegex: RegExp;
    private replacement: string;

    /**
     * Constructs an instance of ChangeControlFieldRule.
     * @param name - The name of the rule.
     * @param args - The arguments for the rule.
     */
    constructor(name: string, args: any) {
        super(name);
        const ruleArguments = args as RuleArguments;
        this.tag = ruleArguments.tag;
        this.searchRegex = new RegExp(ruleArguments.searchRegex);
        this.replacement = ruleArguments.replacement;
    }

    /**
     * Applies the rule to an XML document.
     * @param xmlDocument - The XML document to apply the rule to.
     * @returns An array of ChangeSet objects representing the changes made by the rule.
     */
    public apply(xmlDocument: Document): ChangeSet[] {
        this.log.info('apply rule:', this.getName());
        const controlfield: Node = this.getControlFieldNode(xmlDocument);
        const value: string = controlfield.textContent;
        const result: string = this.searchReplace(value);
        controlfield.textContent = result;
        return [
            this.getChangeSet(controlfield as Element, this.tag, ChangeType.Change)
        ];
    }

    /**
     * Searches and replaces text content based on the provided regular expression and replacement string.
     * @param value - The original text content.
     * @returns The modified text content after replacement.
     */
    private searchReplace(value: string): string {
        const log: LogService = new LogService();
        log.info('value:', value, 'search:', this.searchRegex, 'replace:', this.replacement);
        const result = value.replace(this.searchRegex, this.replacement);
        log.info('result:', result);
        return result;
    }

    /**
     * Retrieves the control field node from the XML document based on the tag.
     * @param xmlDocument - The XML document to search within.
     * @returns The control field node.
     */
    private getControlFieldNode(xmlDocument: Document): Node {
        const query: string = `//controlfield[@tag='${this.tag}']`;
        this.log.info(query);
        this.log.info(this.xpath.querySingle(query, xmlDocument));
        return this.xpath.querySingle(query, xmlDocument);
    }
}

type RuleArguments = {
    tag: string;
    searchRegex: string;
    replacement: string;
};
