import { LogService } from '../../services/log.service'
import { Rule } from './rule'
import { RuleCreator } from './rule-creator'

export class ChangeControlFieldRuleCreator extends RuleCreator<ChangeControlFieldRule> {
	forType(): string {
		return ChangeControlFieldRule.name
	}

	create(name: string, args: any): ChangeControlFieldRule {
		return new ChangeControlFieldRule(name, args)
	}
}

class ChangeControlFieldRule extends Rule {

	private tag: string
	private searchRegex: RegExp
	private replacement: string

	constructor(name:string, args: any) {
		super(name)
		const ruleArguments = args as RuleArguments
		this.tag = ruleArguments.tag
		this.searchRegex = new RegExp(ruleArguments.searchRegex)
		this.replacement = ruleArguments.replacement
	}

	public apply(xmlDocument: Document): void {
		this.log.info('apply rule:', this.getName())
		const controlfield: Node = this.getControlFieldNode(xmlDocument)
		const value: string = controlfield.textContent
		const result: string = this.searchReplace(value)
		controlfield.textContent = result
	}

	private searchReplace(value: string): string {
		const log: LogService = new LogService()
		log.info('value:', value, 'search:', this.searchRegex, 'replace:', this.replacement)
		const result = value.replace(this.searchRegex, this.replacement)
		log.info('result:', result)
		return result
	}

	private getControlFieldNode(xmlDocument: Document): Node {
		const query: string = `//controlfield[@tag='${this.tag}']`
		this.log.info(query)
		this.log.info(this.xpath.querySingle(query, xmlDocument))
		return this.xpath.querySingle(query, xmlDocument)
	}
}

type RuleArguments = {
	tag: string
	searchRegex: string
	replacement: string
}
