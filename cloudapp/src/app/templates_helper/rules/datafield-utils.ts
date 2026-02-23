import { XPathHelperService } from '../../services/xpath-helper.service';

export type TargetField = {
    tag: string;
    ind1?: string;
    ind2?: string;
};

export type SubfieldCondition = {
    code: string;
    exists?: boolean;
    valueRegex?: string;
    negate?: boolean;
    compiledValueRegex?: RegExp;
};

export class DatafieldUtils {

    /**
     * Escapes a string for safe interpolation into an XPath 1.0 expression.
     * Returns the string wrapped in appropriate quotes, using concat() if
     * the value contains both single and double quotes.
     */
    static escapeXPathString(value: string): string {
        if (!value.includes("'")) {
            return `'${value}'`;
        }
        if (!value.includes('"')) {
            return `"${value}"`;
        }
        const pieces = value.split("'");
        return `concat(${pieces.map(p => `'${p}'`).join(`,"'",`)})`;
    }

    /**
     * Validates a MARC field tag. Must be exactly 3 digits.
     */
    static validateTag(tag: string): void {
        if (typeof tag !== 'string' || !/^[0-9]{3}$/.test(tag)) {
            throw new Error(`Invalid MARC tag: '${tag}'. Must be exactly 3 digits.`);
        }
    }

    /**
     * Validates a MARC indicator value.
     * Must be undefined, empty string, or exactly 1 character (digit, lowercase letter, or space).
     */
    static validateIndicator(name: string, value: string | undefined): void {
        if (value === undefined || value === null || value === '') {
            return;
        }
        if (typeof value !== 'string' || !/^[0-9a-z ]$/.test(value)) {
            throw new Error(`Invalid MARC indicator '${name}': '${value}'. Must be a single digit, lowercase letter, or space.`);
        }
    }

    /**
     * Validates a MARC subfield code. Must be exactly 1 alphanumeric character (a-z, 0-9).
     */
    static validateSubfieldCode(code: string): void {
        if (typeof code !== 'string' || !/^[a-z0-9]$/.test(code)) {
            throw new Error(`Invalid MARC subfield code: '${code}'. Must be a single alphanumeric character.`);
        }
    }

    /**
     * Validates all components of a TargetField (tag + optional indicators).
     */
    static validateTargetField(targetField: TargetField): void {
        if (!targetField) {
            throw new Error('targetField is required.');
        }
        DatafieldUtils.validateTag(targetField.tag);
        DatafieldUtils.validateIndicator('ind1', targetField.ind1);
        DatafieldUtils.validateIndicator('ind2', targetField.ind2);
    }

    /**
     * Finds all datafield elements matching the given target field (tag + optional indicators).
     *
     * Indicator matching:
     *   - undefined or "" → match ANY indicator value (wildcard)
     *   - " " (space)     → match blank/absent indicator specifically
     *   - "1", "0", etc.  → match that exact value
     */
    static findMatchingDatafields(targetField: TargetField, xmlDocument: Document, xpath: XPathHelperService): Element[] {
        const conditions: string[] = [];
        conditions.push(`@tag=${DatafieldUtils.escapeXPathString(targetField.tag)}`);
        const ind1Cond = DatafieldUtils.generateIndicatorCondition('ind1', targetField.ind1);
        if (ind1Cond) conditions.push(ind1Cond);
        const ind2Cond = DatafieldUtils.generateIndicatorCondition('ind2', targetField.ind2);
        if (ind2Cond) conditions.push(ind2Cond);
        const query = `//datafield[${conditions.join(' and ')}]`;
        return xpath.queryList(query, xmlDocument) as Element[];
    }

    /**
     * Generates an XPath condition for an indicator attribute.
     *   - undefined or "" → null (no condition, matches any value)
     *   - " " (space)     → matches blank or absent indicator
     *   - other value      → matches that exact value
     */
    private static generateIndicatorCondition(attribute: string, value: string | undefined): string | null {
        if (value === undefined || value === '') {
            return null;
        }
        if (value === ' ') {
            return `(not(@${attribute}) or @${attribute}=' ')`;
        }
        return `@${attribute}=${DatafieldUtils.escapeXPathString(value)}`;
    }

    /**
     * Evaluates all conditions against a single datafield element.
     * AND logic: all conditions must pass. Empty array → true.
     */
    static evaluateConditions(datafield: Element, conditions: SubfieldCondition[]): boolean {
        if (!conditions || conditions.length === 0) {
            return true;
        }
        return conditions.every(condition => DatafieldUtils.evaluateSingleCondition(datafield, condition));
    }

    private static evaluateSingleCondition(datafield: Element, condition: SubfieldCondition): boolean {
        const subfields = Array.from(datafield.getElementsByTagName('subfield'))
            .filter(sf => sf.getAttribute('code') === condition.code);

        if (condition.exists !== undefined) {
            return condition.exists ? subfields.length > 0 : subfields.length === 0;
        }

        if (condition.compiledValueRegex) {
            const regex = condition.compiledValueRegex;
            if (condition.negate) {
                // Passes if NO subfield with that code matches (or code absent entirely)
                return subfields.every(sf => !regex.test(sf.textContent));
            } else {
                // Passes if ANY subfield with that code matches
                return subfields.some(sf => regex.test(sf.textContent));
            }
        }

        // This should not be reachable — validateAndCompileConditions() requires either `exists` or `valueRegex`
        return true;
    }

    /**
     * Validates conditions at construction time and compiles regex strings.
     * Throws if a condition has invalid attribute combinations.
     * Also compiles all regex strings into `compiledValueRegex` via `new RegExp()`.
     */
    static validateAndCompileConditions(conditions: SubfieldCondition[]): void {
        if (!conditions) {
            return;
        }
        conditions.forEach((condition, index) => {
            DatafieldUtils.validateSubfieldCode(condition.code);
            if (condition.exists !== undefined && condition.valueRegex !== undefined) {
                throw new Error(
                    `Condition at index ${index}: 'exists' and 'valueRegex' are mutually exclusive.`
                );
            }
            if (condition.exists !== undefined && condition.negate !== undefined) {
                throw new Error(
                    `Condition at index ${index}: 'negate' cannot be used with 'exists'. Use 'exists: false' instead.`
                );
            }
            if (condition.exists === undefined && condition.valueRegex === undefined) {
                throw new Error(
                    `Condition at index ${index}: must specify either 'exists' or 'valueRegex'.`
                );
            }
            if (condition.valueRegex !== undefined) {
                condition.compiledValueRegex = new RegExp(condition.valueRegex);
            }
        });
    }
}
