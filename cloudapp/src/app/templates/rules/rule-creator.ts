import { InjectionToken } from '@angular/core'
import { Rule } from './rule'

export abstract class RuleCreator<T extends Rule> {

	abstract forType(): string

	abstract create(name: string, args: any):T

}

export const RuleCreatorToken = new InjectionToken<RuleCreator<Rule>>('RuleCreator')
