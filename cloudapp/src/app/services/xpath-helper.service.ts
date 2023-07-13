import { Injectable } from '@angular/core'

@Injectable({
	providedIn: 'root'
})
export class XPathHelperService {

	private xpe: XPathEvaluator

	constructor() {
		this.xpe = new XPathEvaluator()
	}

	public querySingle(query: string, xmlDocument: Document): Node {
		const result: XPathResult = this.xpe.evaluate(
			query,
			xmlDocument,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null)
		return result.singleNodeValue
	}

	public queryList(query: string, xmlDocument: Document): Node[] {
		const result: XPathResult = this.xpe.evaluate(
			query,
			xmlDocument,
			null,
			XPathResult.ORDERED_NODE_ITERATOR_TYPE,
			null)
		const nodes: Node[] = []
		let node = result.iterateNext()
		while (node) {
			nodes.push(node)
			node = result.iterateNext()
		}
		return nodes
	}
}
