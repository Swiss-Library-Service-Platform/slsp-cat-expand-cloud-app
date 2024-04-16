import { InjectionToken } from '@angular/core';
import { Rule } from './rule';

/**
 * Abstract class for creating instances of Rule objects.
 */
export abstract class RuleCreator<T extends Rule> {
    /**
     * Gets the type string for the rule.
     * @returns The type string for the rule.
     */
    abstract forType(): string;

    /**
     * Creates a new instance of the rule.
     * @param name - The name of the rule.
     * @param args - The arguments for the rule.
     * @returns A new instance of the rule.
     */
    abstract create(name: string, args: any): T;
}

/**
 * Injection token for RuleCreator instances.
 */
export const RuleCreatorToken = new InjectionToken<RuleCreator<Rule>>('RuleCreator');
