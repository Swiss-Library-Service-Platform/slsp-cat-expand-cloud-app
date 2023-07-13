import { Injectable } from '@angular/core'
import { TemplateSet } from './template-set'
import { Template } from './template'
import { ChangeControlFieldRule } from './change-control-field-rule'
import { AddDataFieldRule } from './add-data-field-rule'


@Injectable({
	providedIn: 'root'
})
export class TemplateSetRegistry {

	private registry:TemplateSet[] = []

	constructor() {
		this.init()
	}

	public addTemplateSet(templateSet: TemplateSet) {
		this.registry.push(templateSet)
	}

	public get(): TemplateSet[] {
		return this.registry
	}

	private init(): void{
		// test template set
		const slspSet = new TemplateSet('SLSP-Templates');
		const festschriftTemplate = new Template('Festschrift')
		//change 008 / Pos.30 to 1
		const change008Rule = new ChangeControlFieldRule('change 008 / Pos.30 to 1', '008', /^(.{29}).(.*)$/, '$11$2')
		//add 655_7$$aFestschrift$$2gnd - content
		const add655GermanRule = new AddDataFieldRule('add 655_7$$aFestschrift$$2gnd-content', '655', null, '7', 'a', 'Festschrift$$2gnd-content')
		festschriftTemplate.addRule(change008Rule)
		festschriftTemplate.addRule(add655GermanRule)

		const illlustratedBookTemplate = new Template('Illustrated book')
		//add 336__$$bsti$$2rdacontent
		const add336Rule = new AddDataFieldRule('add 336__$$bsti$$2rdacontent', '336', null, null, 'b', 'sti$$2rdacontent')
		//add 655_7$$Bildband$$2gnd-content
		const add655BildbandGermanRule = new AddDataFieldRule('655_7$$Bildband$$2gnd-content', '655', null, '7', 'a', 'Bildband$$2gnd-content')
		illlustratedBookTemplate.addRule(add336Rule)
		illlustratedBookTemplate.addRule(add655BildbandGermanRule)

		slspSet.addTemplate(illlustratedBookTemplate)
		slspSet.addTemplate(festschriftTemplate)
		this.addTemplateSet(slspSet)


		const testSet = new TemplateSet('Test Template Set')
		const testNoopTemplate = new Template('Test NOOP Template')
		const testNoopRule = new ChangeControlFieldRule('Test NOOP Rule', '008', / /, '')
		testNoopTemplate.addRule(testNoopRule)
		testSet.addTemplate(testNoopTemplate)
		this.addTemplateSet(testSet)
	}
}
