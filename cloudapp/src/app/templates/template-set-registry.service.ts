import { HttpClient } from '@angular/common/http'
import { Inject, Injectable } from '@angular/core'
import { Observable, forkJoin, of } from 'rxjs'
import { catchError, map, switchMap, tap } from 'rxjs/operators'
import { Rule } from './rules/rule'
import { RuleCreator, RuleCreatorToken } from './rules/rule-creator'
import { Template, TemplateOrigin } from './template'
import { TemplateSet } from './template-set'
import { CloudAppSettingsService, WriteSettingsResponse } from '@exlibris/exl-cloudapp-angular-lib'
import { LogService } from '../services/log.service'


@Injectable({
	providedIn: 'root'
})
export class TemplateSetRegistry {

	private registry: TemplateSet[] = []
	ruleCreators: RuleCreator<Rule>[]

	constructor(
		private httpClient: HttpClient,
		private settingsService: CloudAppSettingsService,
		private log: LogService,
		@Inject(RuleCreatorToken) ruleCreators: RuleCreator<Rule>[]
	) {
		this.initHttp()
		this.initSettings()
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

	storeUserTemplate(templateSource: string): Observable<WriteSettingsResponse> {
		return this.settingsService.get()
			.pipe(
				switchMap(settings => {
					console.log("current settings", settings)
					let userSettings: UserSettings = settings as UserSettings
					if (!userSettings || !userSettings.userScripts) {
						userSettings = { userScripts: {} }
					}
					const userScripts: UserScripts = userSettings.userScripts
					const templateObject: TemplateDefinition = JSON.parse(templateSource) as TemplateDefinition
					userScripts[templateObject.template.name] = templateSource
					userSettings.userScripts = userScripts
					console.log("settings to saved", userSettings)
					return this.settingsService.set(userSettings)
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

	removeUserTemplate(templateName: string): Observable<WriteSettingsResponse> {
		return this.settingsService.get()
			.pipe(
				switchMap(settings => {
					console.log("current settings", settings)
					let userSettings: UserSettings = settings as UserSettings
					if (!userSettings || !userSettings.userScripts) {
						userSettings = { userScripts: {} }
					}
					const userScripts: UserScripts = userSettings.userScripts
					delete userScripts[templateName]
					userSettings.userScripts = userScripts
					console.log("settings to saved", userSettings)
					return this.settingsService.set(userSettings)
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

	reset() {
		this.registry = []
		this.initHttp()
		this.initSettings()
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

	private initSettings(): void {
		this.settingsService.get()
			.subscribe(settings => {
				let userSettings: UserSettings = settings as UserSettings
				if (!userSettings) {
					userSettings = { userScripts: {} }
				}
				const userScripts: UserScripts = userSettings.userScripts
				for (let templateName in userScripts) {
					const templateString: string = userScripts[templateName]
					try {
						const templateDefinition: TemplateDefinition = JSON.parse(templateString) as TemplateDefinition
						this.createTemplateFromJson(templateDefinition, TemplateOrigin.User)
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

type UserSettings = {
	"userScripts": UserScripts
}

type UserScripts = {
	[name: string]: string
}
