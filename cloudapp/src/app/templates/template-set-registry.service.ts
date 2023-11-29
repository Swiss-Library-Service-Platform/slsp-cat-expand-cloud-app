import { HttpClient } from '@angular/common/http'
import { Inject, Injectable } from '@angular/core'
import { CloudAppConfigService, CloudAppSettingsService, WriteSettingsResponse } from '@exlibris/exl-cloudapp-angular-lib'
import { Observable, forkJoin, of } from 'rxjs'
import { catchError, map, switchMap } from 'rxjs/operators'
import { LogService } from '../services/log.service'
import { Rule } from './rules/rule'
import { RuleCreator, RuleCreatorToken } from './rules/rule-creator'
import { Template, TemplateOrigin } from './template'
import { TemplateSet } from './template-set'


@Injectable({
	providedIn: 'root'
})
export class TemplateSetRegistry {

	private registry: TemplateSet[] = []
	ruleCreators: RuleCreator<Rule>[]

	constructor(
		private httpClient: HttpClient,
		private settingsService: CloudAppSettingsService,
		private configService: CloudAppConfigService,
		private log: LogService,
		@Inject(RuleCreatorToken) ruleCreators: RuleCreator<Rule>[]
	) {
		this.initHttp()
		this.initStoredTemplates()
		this.ruleCreators = ruleCreators
	}

	addTemplateSet(templateSet: TemplateSet): void {
		this.registry.push(templateSet)
		this.registry.sort((a: TemplateSet, b: TemplateSet) => a.getName().localeCompare(b.getName()))
	}

	getTemplateSet(templateSetName: string): TemplateSet {
		return this.registry.find(templateSet => templateSet.getName() === templateSetName)
	}

	get(): TemplateSet[] {
		return this.registry
	}

	private storeTemplate(templateSource: string, service: CloudAppSettingsService | CloudAppConfigService) {
		return service.get()
			.pipe(
				switchMap(settings => {
					let storedTemplates: StoredTemplates = settings as StoredTemplates
					if (!storedTemplates || !storedTemplates.storedScripts) {
						storedTemplates = { storedScripts: {} }
					}
					const storedScripts: StoredScripts = storedTemplates.storedScripts
					const templateObject: TemplateDefinition = JSON.parse(templateSource) as TemplateDefinition
					storedScripts[templateObject.template.name] = templateSource
					storedTemplates.storedScripts = storedScripts
					return service.set(storedTemplates)
				}),
				switchMap(result => {
					if (result.success == true) {
						this.reset()
					}
					return of(result)
				}),
				catchError(error => of({
					success: false,
					error: error
				}))
			)
	}

	private removeTemplate(templateName: string, service: CloudAppSettingsService | CloudAppConfigService): Observable<WriteSettingsResponse> {
		return service.get()
			.pipe(
				switchMap(settings => {
					let storedTemplates: StoredTemplates = settings as StoredTemplates
					if (!storedTemplates || !storedTemplates.storedScripts) {
						storedTemplates = { storedScripts: {} }
					}
					const storedScripts: StoredScripts = storedTemplates.storedScripts
					delete storedScripts[templateName]
					storedTemplates.storedScripts = storedScripts
					return service.set(storedTemplates)
				}),
				switchMap(result => {
					if (result.success == true) {
						this.reset()
					}
					return of(result)
				}),
				catchError(error => of({
					success: false,
					error: error
				}))
			)
	}

	storeUserTemplate(templateSource: string): Observable<WriteSettingsResponse> {
		console.log("this", this)
		return this.storeTemplate(templateSource, this.settingsService)
	}

	storeInstitutionTemplate(templateSource: string): Observable<WriteSettingsResponse> {
		return this.storeTemplate(templateSource, this.configService)
	}

	removeUserTemplate(templateSource: string): Observable<WriteSettingsResponse> {
		return this.removeTemplate(templateSource, this.settingsService)
	}

	removeInstitutionTemplate(templateSource: string): Observable<WriteSettingsResponse> {
		return this.removeTemplate(templateSource, this.configService)
	}

	reset() {
		this.registry = []
		this.initHttp()
		this.initStoredTemplates()
	}

	private initHttp(): void {
		this.httpClient.get('./assets/templates/_template-index.json')
			.pipe(
				switchMap(response => {
					console.log(response)
					return of(response['templates'])
				}),
				switchMap((templateNames: string[]) => {
					return forkJoin(templateNames.map(name => this.httpClient.get('./assets/templates/' + name)))
				}),
				map(templateJsonArr => {
					templateJsonArr.map(templateJson => this.createTemplateFromJson(templateJson as TemplateDefinition, TemplateOrigin.BuiltIn))
				})
			).subscribe()

	}

	private initStoredTemplates(): void {
		this.loadStoredTemplates(this.settingsService, TemplateOrigin.User)
		this.loadStoredTemplates(this.configService, TemplateOrigin.Institution)
	}

	private loadStoredTemplates(service: CloudAppSettingsService | CloudAppConfigService, templateOrigin: TemplateOrigin): void {
		service.get()
			.subscribe(settings => {
				let storedTemplates: StoredTemplates = settings as StoredTemplates
				if (!storedTemplates) {
					storedTemplates = { storedScripts: {} }
				}
				const storedScripts: StoredScripts = storedTemplates.storedScripts
				for (let templateName in storedScripts) {
					const templateString: string = storedScripts[templateName]
					try {
						const templateDefinition: TemplateDefinition = JSON.parse(templateString) as TemplateDefinition
						this.createTemplateFromJson(templateDefinition, templateOrigin)
					} catch (e) {
						this.log.error(`Could not create template from user settings. Error: '${e}'. Template: '${templateString}'`)
					}
				}
			})
	}

	private createTemplateFromJson(templateDefinition: TemplateDefinition, origin: TemplateOrigin): void {
		const templateName: string = templateDefinition.template.name
		const templateSetName: string = templateDefinition.template?.set || TemplateSet.DEFAULT
		const rules: RuleDefinition[] = templateDefinition.template.rules

		const template: Template = new Template(templateName, JSON.stringify(templateDefinition, null, 2), origin)

		rules.forEach(ruleDefinition => {
			const ruleCreator: RuleCreator<Rule> = this.getRuleCreator(ruleDefinition.type)
			const rule: Rule = ruleCreator.create(ruleDefinition.name, ruleDefinition.arguments)
			template.addRule(rule)
		})

		let templateSet: TemplateSet = this.getTemplateSet(templateSetName)
		if (!templateSet) {
			templateSet = new TemplateSet(templateSetName)
			this.addTemplateSet(templateSet)
		}
		templateSet.addTemplate(template)
	}

	private getRuleCreator(type: string): RuleCreator<Rule> {
		return this.ruleCreators.find(ruleCreator => ruleCreator.forType() === type)
	}
}

type TemplateDefinition = {
	"template": {
		"name": string,
		"set": string,
		"rules": RuleDefinition[]
	}
}

type RuleDefinition = {
	"type": string,
	"name": string,
	"arguments": any
}

type StoredTemplates = {
	"storedScripts": StoredScripts
}

type StoredScripts = {
	[name: string]: string
}
