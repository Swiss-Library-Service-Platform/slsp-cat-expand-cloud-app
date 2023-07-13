import { LogService } from '../services/log.service'
import { Rule } from './rule'

export class ChangeControlFieldRule extends Rule {

	constructor(
		description: string,
		private tag: string,
		private searchRegex: RegExp,
		private replcement: string
	) {
		super(description)
	}

	public apply(xmlDocument: Document): void {
		this.log.info('apply rule:', this.getDescription())
		const controlfield: Node = this.getControlFieldNode(xmlDocument)
		const value: string = controlfield.textContent
		const result: string = this.searchReplace(value)
		controlfield.textContent = result
	}

	private searchReplace(value: string): string {
		const log: LogService = new LogService()
		log.info('value:', value, 'search:', this.searchRegex, 'replace:', this.replcement)
		const result = value.replace(this.searchRegex, this.replcement)
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
