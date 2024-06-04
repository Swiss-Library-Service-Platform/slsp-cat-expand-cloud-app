/**
 * Service for managing template sets and their templates.
 * Allows storing, retrieving, and removing templates.
 */
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { CloudAppConfigService, CloudAppSettingsService, WriteSettingsResponse } from '@exlibris/exl-cloudapp-angular-lib';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { LogService } from '../services/log.service';
import { Rule } from './rules/rule';
import { RuleCreator, RuleCreatorToken } from './rules/rule-creator';
import { Template, TemplateOrigin } from './template';
import { TemplateSet } from './template-set';

@Injectable({
	providedIn: 'root'
})
export class TemplateSetRegistry {

	/** List of template sets */
	private registry: TemplateSet[] = [];

	private registrySubject = new BehaviorSubject<TemplateSet[]>([]);
	registry$: Observable<TemplateSet[]> = this.registrySubject.asObservable();

	/** List of rule creators */
	ruleCreators: RuleCreator<Rule>[];

	constructor(
		private httpClient: HttpClient,
		private settingsService: CloudAppSettingsService,
		private configService: CloudAppConfigService,
		private log: LogService,
		@Inject(RuleCreatorToken) ruleCreators: RuleCreator<Rule>[]
	) {
		this.initTemplates();
		this.ruleCreators = ruleCreators;
	}

	/**
	 * Adds a template set to the registry.
	 * @param templateSet - The template set to add
	 */
	addTemplateSet(templateSet: TemplateSet): void {
		this.registry.push(templateSet);
		this.registry.sort((a: TemplateSet, b: TemplateSet) => a.getName().localeCompare(b.getName()));
		this.registrySubject.next(this.registry);
	}

	/**
	 * Retrieves a template set by name.
	 * @param templateSetName - The name of the template set to retrieve
	 * @returns The template set
	 */
	getTemplateSet(templateSetName: string): TemplateSet {
		return this.registry.find(templateSet => templateSet.getName() === templateSetName);
	}

	/**
	 * Retrieves all template sets.
	 * @returns List of template sets
	 */
	get(): TemplateSet[] {
		return this.registry;
	}

	/**
	 * Stores a user template.
	 * @param templateSource - The source code of the template
	 * @returns Observable for the write settings response
	 */
	storeUserTemplate(templateSource: string): Observable<WriteSettingsResponse> {
		return this.storeTemplate(templateSource, this.settingsService);
	}

	/**
	 * Stores an institution template.
	 * @param templateSource - The source code of the template
	 * @returns Observable for the write settings response
	 */
	storeInstitutionTemplate(templateSource: string): Observable<WriteSettingsResponse> {
		return this.storeTemplate(templateSource, this.configService);
	}

	/**
	 * Removes a user template.
	 * @param templateSource - The source code of the template
	 * @returns Observable for the write settings response
	 */
	removeUserTemplate(templateSource: string): Observable<WriteSettingsResponse> {
		return this.removeTemplate(templateSource, this.settingsService);
	}

	/**
	 * Removes an institution template.
	 * @param templateSource - The source code of the template
	 * @returns Observable for the write settings response
	 */
	removeInstitutionTemplate(templateSource: string): Observable<WriteSettingsResponse> {
		return this.removeTemplate(templateSource, this.configService);
	}

	/**
	 *  Initializes the registry with built-in templates and stored templates.
	 */
	initTemplates() {
		this.registry = [];
		this.initBuiltInTemplates();
		this.initStoredTemplates();
	}

	/**
	 * Initializes the registry with built-in templates.
	 * Loads templates from the settings. 
	 */
	private initBuiltInTemplates(): void {
		this.httpClient.get('./assets/templates/_template-index.json')
			.pipe(
				switchMap(response => {
					this.log.debug('Template Init Http: templates built in', response);
					return of(response['templates']);
				}),
				switchMap((templateNames: string[]) => {
					return forkJoin(templateNames.map(name => this.httpClient.get('./assets/templates/' + name)));
				}),
				map(templateJsonArr => {
					templateJsonArr.map(templateJson => this.createTemplateFromJsonAndAddToSet(templateJson as TemplateDefinition, TemplateOrigin.BuiltIn));
				})
			).subscribe();

	}

	/**
	 * Initializes the registry with stored templates. 
	 */
	private initStoredTemplates(): void {
		this.loadStoredTemplates(this.settingsService, TemplateOrigin.User);
		this.loadStoredTemplates(this.configService, TemplateOrigin.Institution);
	}

	/**
	 * Loads stored templates from a service.
	 * @param service - The service to load templates from
	 * @param templateOrigin - The origin of the templates
	 */
	private loadStoredTemplates(service: CloudAppSettingsService | CloudAppConfigService, templateOrigin: TemplateOrigin): void {
		service.get()
			.subscribe(settings => {
				let storedTemplates: StoredTemplates = settings as StoredTemplates;
				if (!storedTemplates) {
					storedTemplates = { storedScripts: {} };
				}
				const storedScripts: StoredScripts = storedTemplates.storedScripts;
				for (let templateName in storedScripts) {
					const templateString: string = storedScripts[templateName];
					try {
						const templateDefinition: TemplateDefinition = JSON.parse(templateString) as TemplateDefinition;
						this.createTemplateFromJsonAndAddToSet(templateDefinition, templateOrigin);
					} catch (e) {
						this.log.error(`Could not create template from user settings. Error: '${e}'. Template: '${templateString}'`);
					}
				}
			});
	}

	/**
	 * Stores a template in the settings.
	 * @param templateSource - The source code of the template
	 * @param service - The settings service to use
	 * @returns Observable for the write settings response
	 */
	private storeTemplate(templateSource: string, service: CloudAppSettingsService | CloudAppConfigService): Observable<WriteSettingsResponse> {
		return service.get()
			.pipe(
				switchMap(settings => {
					let storedTemplates: StoredTemplates = settings as StoredTemplates;
					if (!storedTemplates || !storedTemplates.storedScripts) {
						storedTemplates = { storedScripts: {} };
					}
					const storedScripts: StoredScripts = storedTemplates.storedScripts;
					const templateObject: TemplateDefinition = JSON.parse(templateSource) as TemplateDefinition;
					// Check if template name is already in stored templates or in other templateset
					if (this.get().some(templateSet => templateSet.getTemplate(templateObject.template.name))) {
						return of({
							success: false,
							error: 'Template name already in use'
						});
					}
					storedScripts[templateObject.template.name] = templateSource;
					storedTemplates.storedScripts = storedScripts;
					return service.set(storedTemplates);
				}),
				switchMap(result => {
					if (result.success == true) {
						const templateObject: TemplateDefinition = JSON.parse(templateSource) as TemplateDefinition;
						this.createTemplateFromJsonAndAddToSet(templateObject, service == this.settingsService ? TemplateOrigin.User : TemplateOrigin.Institution);
					}
					return of(result);
				}),
				catchError(error => of({
					success: false,
					error: error
				}))
			);
	}

	/**
	 * Removes a template from the settings.
	 * @param templateSource - The source code of the template
	 * @param service - The settings service to use
	 * @returns Observable for the write settings response	 * 
	 */
	private removeTemplate(templateName: string, service: CloudAppSettingsService | CloudAppConfigService): Observable<WriteSettingsResponse> {
		return service.get()
			.pipe(
				switchMap(settings => {
					let storedTemplates: StoredTemplates = settings as StoredTemplates;
					if (!storedTemplates || !storedTemplates.storedScripts) {
						storedTemplates = { storedScripts: {} };
					}
					const storedScripts: StoredScripts = storedTemplates.storedScripts;
					delete storedScripts[templateName];
					storedTemplates.storedScripts = storedScripts;
					return service.set(storedTemplates);
				}),
				switchMap(result => {
					if (result.success == true) {
						// remove template from registry
						this.registry = this.registry.filter(templateSet => {
							templateSet.removeTemplate(templateName);
							return templateSet.getTemplates().length > 0;
						});
						this.registrySubject.next(this.registry);
					}
					return of(result);
				}),
				catchError(error => of({
					success: false,
					error: error
				}))
			);
	}


	/**
	 * Creates a template from a JSON definition.
	 * @param templateDefinition - The JSON definition of the template
	 * @param origin - The origin of the template 
	 */
	private createTemplateFromJsonAndAddToSet(templateDefinition: TemplateDefinition, origin: TemplateOrigin): void {
		const templateName: string = templateDefinition.template.name;
		const templateSetName: string = templateDefinition.template?.set || TemplateSet.DEFAULT;
		const rules: RuleDefinition[] = templateDefinition.template.rules;

		const template: Template = new Template(templateName, JSON.stringify(templateDefinition, null, 2), origin);

		rules.forEach(ruleDefinition => {
			const ruleCreator: RuleCreator<Rule> = this.getRuleCreator(ruleDefinition.type);
			const rule: Rule = ruleCreator.create(ruleDefinition.name, ruleDefinition.arguments);
			template.addRule(rule);
		});

		let templateSet: TemplateSet = this.getTemplateSet(templateSetName);
		if (!templateSet) {
			templateSet = new TemplateSet(templateSetName);
			this.addTemplateSet(templateSet);
		}
		templateSet.addTemplate(template);
	}


	/**
	 * Retrieves a rule creator by type.
	 * @param type - The type of the rule creator
	 * @returns The rule creator
	 */
	private getRuleCreator(type: string): RuleCreator<Rule> {
		return this.ruleCreators.find(ruleCreator => ruleCreator.forType() === type);
	}
}

/** Definition of a template */
type TemplateDefinition = {
	"template": {
		"name": string,
		"set": string,
		"rules": RuleDefinition[]
	}
}

/** Definition of a rule */
type RuleDefinition = {
	"type": string,
	"name": string,
	"arguments": any
}

/** Stored templates structure */
type StoredTemplates = {
	"storedScripts": StoredScripts
}

/** Stored scripts structure */
type StoredScripts = {
	[name: string]: string
}
