import * as Immutable from 'immutable';
import { Currency } from './currency';
import { default as PDate } from './pdate';
import { MappableIterable, ValidationContext } from './util';
import { TypedRecordClass } from './precord';
export declare enum CategoryRulePeriod {
    Day = 2,
    Week = 3,
    Month = 4,
    Year = 5,
}
export interface CategoryRuleValues {
    amount?: number;
    startDate?: PDate | number | null;
    endDate?: PDate | number | null;
    repeatN?: number;
    period?: CategoryRulePeriod | null;
}
export interface CategoryRuleCleanValues extends CategoryRuleValues {
    startDate?: PDate | null;
    endDate?: PDate | null;
}
declare const CategoryRule_base: TypedRecordClass<{
    amount: number;
    startDate: PDate | null;
    endDate: PDate | null;
    repeatN: number;
    period: CategoryRulePeriod | null;
}>;
export declare class CategoryRule extends CategoryRule_base {
    constructor(values?: CategoryRuleValues);
    /** Assertions to help enforce correct usage. */
    _checkInvariants(): void;
    /**
     * countOccurrencesBetween: Based on this rule, determine how many times this amount is repeated
     * between dateBegin and DateEnd.
     *
     * For example, if startDate is 2014-01-01, endDate is null, repeatN is 1, and period is Month
     * (repeat every month from Jan 1, 2014 onward), then counOccurrencesBetween(2016-01-01, 2016-12-31)
     * will return 12.
     * @param {PDate} dateBegin - Start date of the period in question (inclusive)
     * @param {PDate} dateEnd - End date of the period in question (inclusive)
     * @returns {number}
     */
    countOccurrencesBetween(dateBegin: PDate, dateEnd: PDate): number;
    /**
     * Given a JS object which may be JSON-serializable, convert it to the proper
     * fully-typed, immutable representation required to initialize or modify
     * a CategoryRule object.
     *
     * The result of this function can be passed to the CategoryRule constructor
     * or to the .merge() method.
     *
     * @param {Object} values - Values for the fields of this CategoryRule
     * @returns {Object} - Cleaned values for the fields of this CategoryRule
     */
    static cleanArgs(values: CategoryRuleValues): CategoryRuleCleanValues;
}
export interface CategoryValues {
    id?: number | null;
    name?: string;
    rules?: MappableIterable | null;
    notes?: string;
    currencyCode?: string;
    groupId?: number | null;
    metadata?: Immutable.Map<string, any>;
}
export interface CleanCategoryValues extends CategoryValues {
    rules?: Immutable.List<CategoryRule> | null;
}
declare const Category_base: TypedRecordClass<{
    id: number | null;
    name: string;
    rules: Immutable.List<CategoryRule> | null;
    notes: string;
    currencyCode: string;
    groupId: number | null;
    metadata: Immutable.Map<string, any>;
}>;
/**
 * Category: Represents a category of spending, such as "Rent", "Groceries", "Insurance", etc.
 */
export declare class Category extends Category_base {
    constructor(values?: CategoryValues);
    /** Assertions to help enforce correct usage. */
    _checkInvariants(): void;
    _validate(context: ValidationContext): void;
    /** Is this an "automatic" category (see 'rules' attribute)? */
    readonly isAutomatic: boolean;
    /** Get the currency of this category. */
    readonly currency: Currency;
    /**
     * Given a JS object which may be JSON-serializable, convert it to the proper
     * fully-typed, immutable representation required to initialize or modify
     * a Category object.
     *
     * The result of this function can be passed to the Category constructor
     * or to the .merge() method.
     *
     * @param {Object} values - Values for the fields of this category
     * @returns {Object} - Cleaned values for the fields of this category
     */
    static cleanArgs(values: CategoryValues): CleanCategoryValues;
}
declare const CategoryGroup_base: TypedRecordClass<{
    id: number | null;
    name: string;
}>;
/**
 * CategoryGroup: Represents an ordered group of categories.
 */
export declare class CategoryGroup extends CategoryGroup_base {
}
