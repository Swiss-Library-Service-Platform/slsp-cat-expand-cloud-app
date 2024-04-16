import { AppInjector } from '../../app-injector';
import { ChangeTrackingService } from '../../services/change-tracking.service';
import { LogService } from '../../services/log.service';
import { XPathHelperService } from '../../services/xpath-helper.service';

/**
 * Abstract class representing a rule.
 */
export abstract class Rule {
    protected log: LogService;
    protected xpath: XPathHelperService;
    protected changeTrackingService: ChangeTrackingService;
    protected name: string;

    /**
     * Constructs an instance of Rule.
     * @param name - The name of the rule.
     */
    protected constructor(name: string) {
        this.name = name;
        this.log = AppInjector.get(LogService);
        this.xpath = AppInjector.get(XPathHelperService);
        this.changeTrackingService = AppInjector.get(ChangeTrackingService);
    }

    /**
     * Gets the name of the rule.
     * @returns The name of the rule.
     */
    public getName(): string {
        return this.name;
    }

    /**
     * Applies the rule to a record XML document.
     * @param recordXml - The XML document representing the record.
     * @returns An array of ChangeSet objects representing the changes made by the rule.
     */
    public abstract apply(recordXml: Document): ChangeSet[];

    /**
     * Creates a ChangeSet object representing a change made by the rule.
     * @param element - The XML element that was changed.
     * @param field - The field that was changed.
     * @param type - The type of change.
     * @returns The created ChangeSet object.
     */
    protected getChangeSet(element: Element, field: string, type: ChangeType) {
        const changeSet: ChangeSet = this.changeTrackingService.createChangeSet(element, field, type);
        console.log('ChangeSet', changeSet);
        return changeSet;
    }
}

/**
 * Represents a change set.
 */
export type ChangeSet = {
    changeHash: number;
    changedField: string;
    type: ChangeType;
};

/**
 * Enum representing the type of change.
 */
export enum ChangeType {
    Change = 'CHANGE',
    Create = 'CREATE',
    None = 'NONE'
}