declare module 'prophecy-engine/pdate' {
	export default class PDate {
	    /** The internal date value (days since 2000-01-01) */
	    readonly value: number;
	    /**
	     * Construct a Date from a triple of year, month (0-11), day (1-31)
	     * @param {number} year - Year (e.g. 2012)
	     * @param {number} month - Month (0 for January, 11 for December)
	     * @param {number} day - Day (1-31)
	     * @returns {PDate}
	     */
	    static create(year: number, month: number, day: number): PDate;
	    /**
	     * Construct a Date from an ISO 8601 date string "YYYY-MM-DD" or "YYYYMMDD"
	     * @param {string} str - An ISO 8601 date string
	     * @returns {PDate}
	     */
	    static fromString(str: string): PDate;
	    /**
	     * Parse a template string literal, e.g. const D = PDate.parseTemplateLiteral; const date1 = D`2016-01-01`;
	     * @param {Object} strings Well-formed template call site object
	     * @param {...*} keys - substitution values
	     * @returns {PDate}
	     */
	    static parseTemplateLiteral(strings: TemplateStringsArray, ...keys: any[]): PDate;
	    /**
	     * Get the current date, according to the system's local time
	     * @returns {PDate}
	     */
	    static today(): PDate;
	    /**
	     * Construct a PDate instance using its internal int representation (# of days since the millenium)
	     * @param {Number} daysSinceMillenium - number representing the date
	     */
	    constructor(daysSinceMillenium: number);
	    /**
	     * Custom JSON serialization
	     * @returns {number}
	     */
	    toJSON(): number;
	    /**
	     * Custom serialization when used with Immutable.js
	     * @returns {number}
	     */
	    toJS(): number;
	    /**
	     * Get the year (2000-3000)
	     * @returns {number}
	     */
	    readonly year: number;
	    /**
	     * Get the month (0-11)
	     * @returns {number}
	     */
	    readonly month: number;
	    /**
	     * Get the day of the month (1-31)
	     * @returns {number}
	     */
	    readonly day: number;
	    /** Get the day of the week (0 = Sunday, 6 = Saturday) */
	    readonly dayOfWeek: number;
	    /** Get the day of the year (0-365) */
	    readonly dayOfYear: number;
	    /**
	     * Get the date as an ISO 8601 string ("2015-01-25")
	     * @returns {string}
	     */
	    toString(): string;
	    /**
	     * Get the primitive value (enables correct sorting and comparison)
	     * Except note that equality checking won't work unless you coerce values
	     * e.g. PDate.create(2010, 1, 1) == PDate.create(2010, 1, 1) : false
	     * e.g. PDate.create(2010, 1, 1) == +PDate.create(2010, 1, 1) : true
	     * @returns {number}
	     */
	    valueOf(): number;
	    /**
	     * Helper method: how many days are in the specified month of the specified year?
	     * @param {number} year - Year
	     * @param {number} month - Month (0-11)
	     * @returns {number}
	     */
	    static daysInMonth(year: number, month: number): number;
	    /**
	     * Is 'year' a leap year? Can be an absolute year (e.g. 2016) or relative to the millenium (e.g. 16).
	     * @param {number} year - The year in question
	     * @returns {boolean}
	     */
	    static isLeapYear(year: number): boolean;
	    static readonly DAYS: Readonly<{
	        SUN: number;
	        MON: number;
	        TUE: number;
	        WED: number;
	        THU: number;
	        FRI: number;
	        SAT: number;
	    }>;
	    static readonly MONTHS: Readonly<{
	        JAN: number;
	        FEB: number;
	        MAR: number;
	        APR: number;
	        MAY: number;
	        JUN: number;
	        JUL: number;
	        AUG: number;
	        SEP: number;
	        OCT: number;
	        NOV: number;
	        DEC: number;
	    }>;
	}

}
declare module 'prophecy-engine/precord' {
	import * as Immutable from 'immutable';
	import {Budget} from 'prophecy-engine/budget';
	import {ValidationResult} from 'prophecy-engine/util';

	/**
	 * TypedRecord: Adds types to Immutable.Record - needed only until Immutable.js 4+
	 */

	export interface TypedRecordClass<T extends Object> {
	    (values?: Partial<T> | Iterable<[string, any]>): TypedRecordInstance<T> & Readonly<T>;
	    new (values?: Partial<T> | Iterable<[string, any]>): TypedRecordInstance<T> & Readonly<T>;

	    // And PRecord-specific extensions:
	    fromJS(obj: any): T;
	}

	interface TypedRecordInstance<T extends Object> {

	    // Reading values

	    has(key: string): key is keyof T;
	    get<K extends keyof T>(key: K): T[K];

	    // Reading deep values

	    hasIn(keyPath: Iterable<any>): boolean;
	    getIn(keyPath: Iterable<any>): any;

	    // Value equality

	    equals(other: any): boolean;
	    hashCode(): number;

	    // Persistent changes

	    set<K extends keyof T>(key: K, value: T[K]): this;
	    update<K extends keyof T>(key: K, updater: (value: T[K]) => T[K]): this;
	    merge(...collections: Array<Partial<T> | Iterable<[string, any]>>): this;
	    mergeDeep(...collections: Array<Partial<T> | Iterable<[string, any]>>): this;

	    mergeWith(
	    merger: (oldVal: any, newVal: any, key: keyof T) => any,
	    ...collections: Array<Partial<T> | Iterable<[string, any]>>
	    ): this;
	    mergeDeepWith(
	    merger: (oldVal: any, newVal: any, key: any) => any,
	    ...collections: Array<Partial<T> | Iterable<[string, any]>>
	    ): this;

	    /**
	     * Returns a new instance of this Record type with the value for the
	     * specific key set to its default value.
	     *
	     * @alias remove
	     */
	    delete<K extends keyof T>(key: K): this;
	    remove<K extends keyof T>(key: K): this;

	    /**
	     * Returns a new instance of this Record type with all values set
	     * to their default values.
	     */
	    clear(): this;

	    // Deep persistent changes

	    setIn(keyPath: Iterable<any>, value: any): this;
	    updateIn(keyPath: Iterable<any>, updater: (value: any) => any): this;
	    mergeIn(keyPath: Iterable<any>, ...collections: Array<any>): this;
	    mergeDeepIn(keyPath: Iterable<any>, ...collections: Array<any>): this;

	    /**
	     * @alias removeIn
	     */
	    deleteIn(keyPath: Iterable<any>): this;
	    removeIn(keyPath: Iterable<any>): this;

	    // Conversion to JavaScript types

	    /**
	     * Deeply converts this Record to equivalent native JavaScript Object.
	     */
	    toJS(): { [K in keyof T]: any };

	    /**
	     * Shallowly converts this Record to equivalent native JavaScript Object.
	     */
	    toJSON(): T;

	    /**
	     * Shallowly converts this Record to equivalent JavaScript Object.
	     */
	    toObject(): T;

	    // Transient changes

	    /**
	     * Note: Not all methods can be used on a mutable collection or within
	     * `withMutations`! Only `set` may be used mutatively.
	     *
	     * @see `Map#withMutations`
	     */
	    withMutations(mutator: (mutable: this) => any): this;

	    /**
	     * @see `Map#asMutable`
	     */
	    asMutable(): this;

	    /**
	     * @see `Map#asImmutable`
	     */
	    asImmutable(): this;

	    // Sequence algorithms

	    toSeq(): Immutable.Seq.Keyed<keyof T, T[keyof T]>;

	    [Symbol.iterator](): IterableIterator<[keyof T, T[keyof T]]>;


	    // PRecord-specific methods below:
	    /**
	     * Validate this PRecord subclass.
	     * Returns an instance of ValidationResult.
	     * 
	     * @param {Budget} budget - the Prophecy Budget that this record will be part of.
	     * @returns {ValidationResult}
	     */
	    validateForBudget(budget: Budget): ValidationResult;

	    /**
	     * Validate this record and throw an exception if any errors are found.
	     * @param {Budget} budget - the Prophecy Budget that this record will be part of.
	     */
	    assertIsValidForBudget(budget: Budget): void;
	}

	export function PRecord<T>(defaultValues: T, name?: string): TypedRecordClass<T>;

}
declare module 'prophecy-engine/category' {
	import * as Immutable from 'immutable';
	import { Currency } from 'prophecy-engine/currency';
	import { default as PDate } from 'prophecy-engine/pdate';
	import { TypedRecordClass } from 'prophecy-engine/precord';
	import { MappableIterable, ValidationContext } from 'prophecy-engine/util';
	export enum CategoryRulePeriod {
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
	} const CategoryRule_base: TypedRecordClass<{
	    amount: number;
	    startDate: PDate | null;
	    endDate: PDate | null;
	    repeatN: number;
	    period: CategoryRulePeriod | null;
	}>;
	export class CategoryRule extends CategoryRule_base {
	    constructor(values?: CategoryRuleValues);
	    /** Assertions to help enforce correct usage. */
	    protected _checkInvariants(): void;
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
	} const Category_base: TypedRecordClass<{
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
	export class Category extends Category_base {
	    constructor(values?: CategoryValues);
	    /** Assertions to help enforce correct usage. */
	    protected _checkInvariants(): void;
	    protected _validate(context: ValidationContext): void;
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
	} const CategoryGroup_base: TypedRecordClass<{
	    id: number | null;
	    name: string;
	}>;
	/**
	 * CategoryGroup: Represents an ordered group of categories.
	 */
	export class CategoryGroup extends CategoryGroup_base {
	}

}
declare module 'prophecy-engine/transaction' {
	import * as Immutable from 'immutable';
	import { default as PDate } from 'prophecy-engine/pdate';
	import { TypedRecordClass } from 'prophecy-engine/precord';
	import { MappableIterable, ValidationContext } from 'prophecy-engine/util'; const TransactionDetail_base: TypedRecordClass<{
	    amount: number;
	    description: string;
	    categoryId: number | null;
	}>;
	export class TransactionDetail extends TransactionDetail_base {
	}
	export interface TransactionValues {
	    id?: number | null;
	    date?: PDate | null;
	    accountId?: number | null;
	    who?: string;
	    detail?: MappableIterable;
	    userId?: number | null;
	    pending?: boolean;
	    isTransfer?: boolean;
	    metadata?: Immutable.Map<string, any>;
	}
	export interface CleanTransactionValues {
	    detail?: Immutable.List<TransactionDetail>;
	} const Transaction_base: TypedRecordClass<{
	    id: number | null;
	    date: PDate | null;
	    accountId: number | null;
	    who: string;
	    detail: Immutable.List<TransactionDetail>;
	    userId: null;
	    pending: boolean;
	    isTransfer: boolean;
	    metadata: Immutable.Map<string, any>;
	}>;
	/**
	 * Transaction: Represents a change in the balance of an account.
	 * Has an amount, who (who the money went to / came from), description,
	 * category, and more.
	 * e.g. '$20 from Chequing account went to SomeCo Inc. to buy a Widget'
	 * Can be split - e.g. 'Sent $17 to Tom - $10 for gas and $7 for coffee'
	 */
	export class Transaction extends Transaction_base {
	    private _cachedAmount;
	    constructor(values: TransactionValues);
	    /** Assertions to help enforce correct usage. */
	    protected _checkInvariants(): void;
	    protected _validate(context: ValidationContext): void;
	    /** Is this a split transaction? */
	    readonly isSplit: boolean;
	    /** Get the sum of the amounts of the 'detail' entries */
	    readonly amount: number;
	    /**
	     * Given a JS object which may be JSON-serializable, convert it to the proper
	     * fully-typed, immutable representation required to initialize or modify
	     * a Transaction object.
	     *
	     * The result of this function can be passed to the Transaction constructor
	     * or to the .merge() method.
	     *
	     * @param {Object} values - Values for the fields of this transaction
	     * @returns {Object} - Cleaned values for the fields of this transaction
	     */
	    static cleanArgs(values: TransactionValues): CleanTransactionValues;
	}

}
declare module 'prophecy-engine/budget' {
	import * as Immutable from 'immutable';
	import { Account } from 'prophecy-engine/account';
	import { Category, CategoryGroup } from 'prophecy-engine/category';
	import { Currency } from 'prophecy-engine/currency';
	import PDate from 'prophecy-engine/pdate';
	import { TypedRecordClass } from 'prophecy-engine/precord';
	import { Transaction } from 'prophecy-engine/transaction';
	export const majorVersion = 0;
	export const minorVersion = 2;
	export type AccountMap = Immutable.OrderedMap<number, Account>;
	export const AccountMap: <T>(...args: T[]) => Immutable.OrderedMap<number, Account>;
	export type CategoryMap = Immutable.OrderedMap<number, Category>;
	export const CategoryMap: <T>(...args: T[]) => Immutable.OrderedMap<number, Category>;
	export type CategoryGroupMap = Immutable.OrderedMap<number, CategoryGroup>;
	export const CategoryGroupMap: <T>(...args: T[]) => Immutable.OrderedMap<number, CategoryGroup>;
	export type TransactionMap = Immutable.OrderedMap<number, Transaction>;
	export const TransactionMap: <T>(...args: T[]) => Immutable.OrderedMap<number, Transaction>;
	export interface BudgetJSON {
	    id: number | null;
	    name: string;
	    startDate: number;
	    endDate: number;
	    currencyCode: string;
	    accounts: any[];
	    categories: any[];
	    categoryGroups: any[];
	    transactions: any[];
	    /** private: */
	    '^a': any;
	    '^c': any;
	    '^g': any;
	    '^n': any;
	}
	export interface BudgetValues {
	    id?: number | null;
	    name?: string;
	    startDate?: PDate;
	    endDate?: PDate;
	    currencyCode?: string;
	    accounts?: Account[];
	    categories?: Category[];
	    categoryGroups?: CategoryGroup[];
	    transactions?: Transaction[];
	}
	export type BalanceMap = Immutable.Map<number, number>; const Budget_base: TypedRecordClass<{
	    id: number | null;
	    name: string;
	    startDate: PDate;
	    endDate: PDate;
	    currencyCode: string;
	    '^a': Immutable.OrderedMap<number, Account>;
	    '^c': Immutable.OrderedMap<number, Category>;
	    '^g': Immutable.OrderedMap<number, CategoryGroup>;
	    '^n': Immutable.OrderedMap<number, Transaction>;
	}>;
	/**
	 * Class that describes a budget.
	 *
	 * A budget is a set of spending plans and actual transactions
	 * for a specific a period of time.
	 */
	export class Budget extends Budget_base {
	    private _accountBalances;
	    private _transactionAccountBalances;
	    constructor(origValues?: BudgetValues);
	    /** Assertions to help enforce correct usage. */
	    protected _checkInvariants(): void;
	    /** Get the currency of this budget. */
	    readonly currency: Currency;
	    /** Ordered list of Accounts, in custom order */
	    readonly accounts: AccountMap;
	    /** Map of categories, keyed by ID. Not in order. */
	    readonly categories: CategoryMap;
	    /** Ordered list of CategoryGroups, in custom order */
	    readonly categoryGroups: Immutable.OrderedMap<number, CategoryGroup>;
	    /**
	     * Delete a category.
	     *
	     * Any transactions linked to this category will have their category set to null.
	     *
	     * @param {number} id - ID of the category to delete
	     * @returns {Budget} - A new Budget with the desired change.
	     */
	    deleteCategory(id: number): Budget;
	    /**
	     * Insert or update a category
	     *
	     * If category.id is in the list of category groups, this will be an update.
	     * If category.id is not in the list of category groups, this will add a new group.
	     *
	     * This method cannot be used to change the order of categories (use positionCategory).
	     *
	     * @param {Category} category - The category to add/modify
	     * @returns {Budget} A new Budget with the desired change.
	     */
	    updateCategory(category: Category): this;
	    /**
	     * Change a category's position within its category group
	     *
	     * @param {number} categoryId ID of the category to move
	     * @param {number} newIndex New position within its category group (0 = first)
	     * @returns {Budget} A new Budget with the desired change.
	     */
	    positionCategory(categoryId: number, newIndex: number): this;
	    /**
	     * Delete a category group. It must be empty!
	     * @param {number} id - ID of the category group to delete
	     * @returns {Budget} - A new Budget with the desired change.
	     */
	    deleteCategoryGroup(id: number): Budget;
	    /**
	     * Insert or update a category group.
	     *
	     * If categoryGroup.id is in the list of category groups, this will be an update.
	     * If categoryGroup.id is not in the list of category groups, this will add a new group.
	     *
	     * This method cannot be used to change the order of category groups (use positionCategoryGroup).
	     *
	     * @param {CategoryGroup} categoryGroup - The category group to add/modify
	     * @returns {Budget} A new Budget with the desired change.
	     */
	    updateCategoryGroup(categoryGroup: CategoryGroup): Budget;
	    /**
	     * Change a category group's position in the list of category groups
	     *
	     * @param {number} groupId ID of the category group to move
	     * @param {number} newIndex New position in the list of category groups (0 = first)
	     * @returns {Budget} A new Budget with the desired change.
	     */
	    positionCategoryGroup(groupId: number, newIndex: number): Budget;
	    /**
	     * Delete an account
	     * @param {number} id - ID of the account to delete
	     * @returns {Budget} - A new Budget with the desired change.
	     */
	    deleteAccount(id: number): Budget;
	    /**
	     * updateAccount: Insert or update an account.
	     *
	     * If newAccount.id is in the list of accounts, this will be an update.
	     * If newAccount.id is not in the list of accounts, this will add a new account.
	     *
	     * This method cannot be used to change the order of accounts (use positionAccount).
	     *
	     * @param {Account} newAccount - The account to add/modify
	     * @returns {Budget} A new Budget with the desired change.
	     */
	    updateAccount(newAccount: Account): Budget;
	    /**
	     * positionAccount: Change an account's position in the list of accounts
	     *
	     * @param {number} accountId ID of the account to move
	     * @param {number} newIndex New position in the list of accounts (0 = first)
	     * @returns {Budget} A new Budget with the desired change.
	     */
	    positionAccount(accountId: number, newIndex: number): Budget;
	    /**
	     * Ordered list of Transactions, always in chronological order (oldest first; null dates go last)
	     * @returns {OrderedMap}
	     */
	    readonly transactions: TransactionMap;
	    /**
	     * Delete a transaction
	     * @param {number} id - ID of the transaction to delete
	     * @returns {Budget} A new Budget with the desired change.
	     */
	    deleteTransaction(id: number): Budget;
	    /**
	     * updateTransaction: Insert or update a transaction.
	     *
	     * If newTransaction.id is in the list of transactions, this will be an update.
	     * If newTransaction.id is not in the list of transactions, this will add it.
	     *
	     * @param {Transaction} newTransaction - The transaction to insert/modify.
	     * @returns {Budget} A new Budget with the desired change.
	     */
	    updateTransaction(newTransaction: Transaction): Budget;
	    /**
	     * _computeBalances: Private method that computes the balance of each account as well
	     * as the running total of the relevant account as of each transaction.
	     */
	    private _computeBalances();
	    /** Get an object which contains balance of each account keyed by accountId, considering all non-pending transactions */
	    readonly accountBalances: {
	        readonly [key: number]: number;
	    };
	    /**
	     * Get the balance of any account as of the specified transaction.
	     * Only non-pending transactions with a date are considered.
	     *
	     * @param {number} transactionId - The transaction to use as a reference point
	     * @param {number} accountId - the account whose balance to return
	     * @returns {number|undefined} The balance of the specified account as of the specified transaction
	     */
	    accountBalanceAsOfTransaction(transactionId: number, accountId: number): number | undefined;
	    /**
	     * Given a date, get the balance of all categories, up to and including that date.
	     *
	     * @param {PDate} date - The date
	     * @returns {Immutable.Map} - The balance of all categories as of that date, as a map where
	     *        the key is the category ID and the value is the balance of that category.
	     */
	    categoryBalancesOnDate(date: PDate): BalanceMap;
	    /**
	     * Given a date, get the balance of the specified category, up to and including that date.
	     *
	     * @param {number} categoryId - The ID of the category
	     * @param {PDate} date - The date
	     * @returns {number} - The balance of the specified category as of that date
	     */
	    categoryBalanceByDate(categoryId: number, date: PDate): number;
	    /**
	     * Given a date, get the budget of each category, up to and including that date.
	     *
	     * @param {PDate} date - The date
	     * @returns {Immutable.Map} - The budget of all categories as of that date, as a map where
	     *        the key is the category ID and the value is the budget amount of that category.
	     */
	    categoryBudgetsOnDate(date: PDate): BalanceMap;
	    toJS(): BudgetJSON;
	    /**
	     * Convert from a JSON-friendly native JavaScript object (or JSON) to a Budget instance.
	     * @param {Object} obj - JSON or JavaScript serialized representation of an instance of this Budget.
	     * @returns {Object} - New instance of this Budget.
	     */
	    static fromJS(obj: BudgetJSON | any): Budget;
	    static transactionSorter(transaction: Transaction): number;
	}

}
declare module 'prophecy-engine/util' {
	import * as Immutable from 'immutable';
	import { Budget } from 'prophecy-engine/budget';
	/**
	 * A useful type for accepting any iterable into a PRecord constructor
	 */
	export interface MappableIterable {
	    map<T>(mapper: ((v: any) => T)): T[] | Immutable.Iterable<number, T>;
	}
	/**
	 * Throw an error if the given condition is ever false.
	 *
	 * @param {boolean} cond - Condition that is expected to be true
	 * @param {string} [msg] - Message to display if this assertion fails
	 */
	export function assert(cond: boolean, msg?: string): void;
	/**
	 * Throw an error if the given value is not a number
	 *
	 * @param {*} v - Value that is expected to be a Number
	 */
	export function assertIsNumber(v: number): void;
	/**
	 * Throw an error if the given value is not a positive integer, or null
	 *
	 * @param {*} v - Value that is expected to be a positive integer or null
	 */
	export function assertPositiveIntegerOrNull(v: number | null): void;
	export const enum ValidationType {
	    Error = "error",
	    Warning = "warning",
	}
	export interface ValidationMessage {
	    type: ValidationType;
	    message: string;
	    field: string | null;
	}
	/**
	 * ValidationResult: Used with PRecord to provide detailed, flexible,
	 * contextual validation of model data.
	 */
	export class ValidationResult {
	    private __validationMessages;
	    static Warning: ValidationType;
	    static Error: ValidationType;
	    readonly warnings: ValidationMessage[];
	    readonly errors: ValidationMessage[];
	    getFieldIssues(fieldName: string | null): ValidationMessage[];
	    /**
	     * Get an array of all validation issues that are not specific to any one field.
	     */
	    readonly overallIssues: ValidationMessage[];
	    readonly allIssues: ReadonlyArray<ValidationMessage>;
	    /** Internal method for use by ValidationContext only. */
	    _pushMessage(type: ValidationType, message: string, field: string | null): void;
	}
	/**
	 * Context during which PRecord validation happens.
	 * This contains a reference to the budget that the PRecord in question
	 * will become part of.
	 */
	export class ValidationContext {
	    readonly budget: Budget;
	    private validationResult;
	    constructor(budget: Budget);
	    /**
	     * Add a warning to the validation result.
	     *
	     * @param {string|null} field - The field that this warning is about,
	     * or null for warnings that involve multiple fields.
	     * @param {*} message - A string describing the validation issue.
	     */
	    addWarning(field: string | null, message: string): void;
	    /**
	     * Add an error to the validation result.
	     *
	     * @param {string|null} field - The field that this error is about,
	     * or null for warnings that involve multiple fields.
	     * @param {*} message - A string describing the validation issue.
	     */
	    addError(field: string | null, message: string): void;
	    readonly result: Readonly<ValidationResult>;
	}
	export { PRecord } from 'prophecy-engine/precord';
	/**
	 * Replace the given English text with a localized version.
	 * This is currently just a placeholder.
	 *
	 * @param {string} str - The text to localize
	 * @returns {string} The localized text.
	 */
	export function __(str: string): string;

}
declare module 'prophecy-engine/currency' {
	/** Class that describes a real-world currency. */
	export class Currency {
	    /**
	     * Get the ISO 4217 currency code (uniquely identifies this currency)
	     * @return {string} The ISO 4217 currency code.
	     */
	    readonly code: string;
	    readonly name: string;
	    readonly symbols: string[];
	    readonly decimals: number;
	    /**
	     * Create a currency description.
	     * @param {string} code - the ISO 4217 currency code (three characters)
	     * @param {string} name - the full name of the currency ("Canadian Dollar")
	     * @param {string[]} symbols - the symbols for this currency in order from most to least
	     *                           ambiguous (e.g. ["$", "CA$"])
	     * @param {number} decimals - The maximum number of decimal places that this currency can
	     *                            support (e.g. '2' means $0.01 is the smallest amount.)
	     */
	    constructor(code: string, name: string, symbols: string[], decimals?: number);
	    /**
	     * Round a given amount of this currency to the minimum supported value.
	     * For dollars, this will round to the nearest $0.01
	     * This is not meant for cash transactions, where the rounding rules are different
	     * (https://en.wikipedia.org/wiki/Cash_rounding for more details on that).
	     * This is generally the same as integer rounding because currency amounts are represented
	     * as floating-point numbers multiplied by the minimal number of decimal places the currency
	     * supports - so $3.2105 is stored as '321.05' and rounded to '312' or $3.21 exactly.
	     * @param {number} amount - The amount/value to round.
	     * @returns {number} The rounded amount/value.
	     */
	    roundAmount(amount: number): number;
	    /**
	     * Custom JSON serialization
	     * @returns {string} - This currency's currency code.
	     */
	    toJSON(): string;
	}
	/** Global constant map listing supported currencies. */
	export const SUPPORTED_CURRENCIES: Readonly<{
	    [currencyCode: string]: Currency;
	}>;
	export class CurrencyFormatter {
	    readonly defaultCurrency: Currency;
	    readonly locales: string | string[];
	    private rawFormatters;
	    private formatters;
	    constructor(defaultCurrency: Currency, locales?: string | string[]);
	    /**
	     * Given an amount and a Currency, format the amount appropriately as a plain text string.
	     * Note: it would be nice to just use toLocaleString() as follows:
	     *    amount.toLocaleString("en-US", {style: "currency", currency: "CAD"})
	     * However, that does not support Bitcoin.
	     * @param {number} amount - the amount to format
	     * @param {Currency=} currency - one of the currencies from SUPPORTED_CURRENCIES (optional)
	     * @return {string} The amount, formatted as a string.
	     */
	    formatAmount(amount: number, currency?: Currency): string;
	    /**
	     * Given an amount and a Currency, format the amount as a plain text string with no symbol.
	     * @param {number} amount - the amount to format
	     * @param {Currency=} currency - one of the currencies from SUPPORTED_CURRENCIES (optional)
	     * @return {string} The amount, formatted as a string, but without any currency symbol.
	     */
	    formatAmountRaw(amount: number, currency?: Currency): string;
	}

}
declare module 'prophecy-engine/account' {
	import * as Immutable from 'immutable';
	import { Currency } from 'prophecy-engine/currency';
	import { TypedRecordClass } from 'prophecy-engine/precord';
	export interface AccountValues {
	    id?: number | null | undefined;
	    name?: string;
	    initialBalance?: number;
	    currencyCode?: string;
	    metadata?: Immutable.Map<string, any>;
	} const Account_base: TypedRecordClass<{
	    id: number | null;
	    name: string;
	    initialBalance: number;
	    currencyCode: string;
	    metadata: Immutable.Map<string, any>;
	}>;
	/**
	 * Account: Represents a bank account, credit card, or a concept like "Cash"
	 */
	export class Account extends Account_base {
	    constructor(values: AccountValues);
	    /** Assertions to help enforce correct usage. */
	    protected _checkInvariants(): void;
	    /** Get the currency of this account. */
	    readonly currency: Currency;
	    /**
	     * Given a JS object which may be JSON-serializable, convert it to the proper
	     * fully-typed, immutable representation required to initialize or modify
	     * an Account object.
	     *
	     * The result of this function can be passed to the Account constructor
	     * or to the .merge() method.
	     *
	     * @param {Object} values - Values for the fields of this account
	     * @returns {Object} - Cleaned values for the fields of this account
	     */
	    static cleanArgs(values: AccountValues): AccountValues;
	}

}
declare module 'prophecy-engine/redux/actions' {
	export const PROPHECY_ACTION_PREFIX = "PRPHCY_";
	/**
	 * NOOP:
	 * Action that does nothing.
	 *
	 * This is generated as the inverse of an action that had no effect.
	 */
	export const NOOP: string;
	/**
	 * SET_CURRENCY:
	 * Action to change the currency of this budget.
	 *
	 * Arguments:
	 *  - currencyCode (string): New ISO 4217 currency code (e.g. 'USD')
	 *  - budgetId (string): ID of the budget (optional)
	 */
	export const SET_CURRENCY: string;
	/**
	 * SET_DATE:
	 * Action to change the start and/or end date of this budget.
	 *
	 * Arguments:
	 *  - startDate (int): PDate value for the start date, cast to integer (optional)
	 *  - endDate (int): PDate value for the end date, cast to integer (optional)
	 *  - budgetId (string): ID of the budget (optional)
	 */
	export const SET_DATE: string;
	/**
	 * SET_NAME:
	 * Action to change the name of this budget.
	 *
	 * Arguments:
	 *  - name (string): New name of the budget
	 *  - budgetId (string): ID of the budget (optional)
	 */
	export const SET_NAME: string;
	/**
	 * DELETE_ACCOUNT:
	 * Action to delete an account. Will set the 'accountId' of any linked transactions to null.
	 *
	 * Arguments:
	 *  - id (int): The ID of the account to delete
	 *  - budgetId (string): ID of the budget (optional)
	 */
	export const DELETE_ACCOUNT: string;
	/**
	 * UPDATE_ACCOUNT:
	 * Action to create/modify an account
	 *
	 * Arguments:
	 *  - id (int): The ID of the account to create/modify
	 *  - data (object): fields to set on the new/modifed account (optional)
	 *  - budgetId (string): ID of the budget (optional)
	 *  - index (int): Index/position of the account in the list (optional)
	 *  - linkNullTransactions (Array): Array of transaction IDs whose accountId will be
	 *    set to this account's ID if (1) that transaction's accountId is null, and (2)
	 *    this is an account insertion (not update). This parameter mostly exists so
	 *    that DELETE_ACCOUNT can be inverted to a single action. (optional)
	 */
	export const UPDATE_ACCOUNT: string;
	/**
	 * DELETE_CATEGORY:
	 * Action to delete a category.
	 *
	 * Arguments:
	 *  - id (int): The ID of the category to delete
	 *  - budgetId (string): ID of the budget (optional)
	 */
	export const DELETE_CATEGORY: string;
	/**
	 * UPDATE_CATEGORY:
	 * Action to create/modify a category
	 *
	 * Arguments:
	 *  - id (int): The ID of the category to create/modify
	 *  - data (object): fields to set on the new/modifed category (optional)
	 *  - budgetId (string): ID of the budget (optional)
	 *  - index (int): Index/position of the category within the group (optional)
	 *  - linkTransactionDetails (Array): Array of tuples of [transaction ID, details index]
	 *    that identifies TransactionDetails entries whose categoryId will be
	 *    set to this category's ID if (1) that transaction's categoryId is null, and (2)
	 *    this is an category insertion (not update). This parameter mostly exists so
	 *    that DELETE_CATEGORY can be inverted to a single action. (optional)
	 */
	export const UPDATE_CATEGORY: string;
	/**
	 * DELETE_CATEGORY_GROUP:
	 * Action to delete a category group. It must not contain any categories.
	 *
	 * Arguments:
	 *  - id (int): The ID of the category group to delete
	 *  - budgetId (string): ID of the budget (optional)
	 */
	export const DELETE_CATEGORY_GROUP: string;
	/**
	 * UPDATE_CATEGORY_GROUP:
	 * Action to create/modify a category group
	 *
	 * Arguments:
	 *  - id (int): The ID of the category group to create/modify
	 *  - data (object): fields to set on the new/modifed category group (optional)
	 *  - budgetId (string): ID of the budget (optional)
	 *  - index (int): Index/position of the category group in the list (optional)
	 */
	export const UPDATE_CATEGORY_GROUP: string;
	/**
	 * DELETE_TRANSACTION:
	 * Action to delete a transaction
	 *
	 * Arguments:
	 *  - id (int): The ID of the transaction to delete
	 *  - budgetId (string): ID of the budget (optional)
	 */
	export const DELETE_TRANSACTION: string;
	/**
	 * UPDATE_TRANSACTION:
	 * Action to create/modify a transaction
	 *
	 * Arguments:
	 *  - id (int): The ID of the transaction to create/modify
	 *  - data (object): fields to set on the new/modifed transactions
	 *  - budgetId (string): ID of the budget (optional)
	 */
	export const UPDATE_TRANSACTION: string;
	/**
	 * UPDATE_MULTIPLE_TRANSACTIONS
	 * Action to atomically update multiple transactions.
	 *
	 * This is the only "compound action" that itself contains
	 * multiple other actions. "Compound actions" are kept to a minimum
	 * in order to make it easier for other reducers to watch for
	 * changes using actions. (e.g. if there were a generic MULTIPLE_ACTIONS
	 * action, a reducer that wanted to watch for changes to the budget name
	 * would have to watch for both SET_NAME and MULTIPLE_ACTIONS containing
	 * SET_NAME).
	 *
	 * Arguments:
	 *  - subActions (array): array of UPDATE_TRANSACTION and DELETE_TRANSACTION
	 *       actions to carry out as part of this action.
	 *  - budgetId (string): ID of the budget (optional)
	 */
	export const UPDATE_MULTIPLE_TRANSACTIONS: string;

}
declare module 'prophecy-engine/redux/prophecy_redux' {
	import { Budget } from 'prophecy-engine/prophecy';
	export interface ActionType {
	    type: string;
	    [key: string]: any;
	}
	/**
	 * The reducer for prophecy. Used to make the Prophecy engine work within a redux app.
	 * @param {Budget} state - the state to modify
	 * @param {Object} action - the action to apply to the state, if applicable
	 * @returns {Budget} - returns the state, with any resulting modifications
	 */
	export function reducer(state: Budget | undefined, action: ActionType): Budget;
	/**
	 * The action inverter for prophecy.
	 * Given an action and a state, produce the inverse of 'action', such that
	 * inverse(action(state)) = state
	 *
	 * This is used to build undo functionality that is relatively robust
	 * when multiple users can simultaneously be emitting actions.
	 *
	 * @param {Budget} state - the state that is about to be modified by action
	 * @param {Object} action - the action to invert
	 * @returns {?Object} - An action (a JS object) or null, if the action cannot be inverted.
	 */
	export function inverter(state: Budget, action: ActionType): any;

}
declare module 'prophecy-engine/prophecy' {
	/**
	 * Prophecy Engine JavaScript API
	 *
	 * All of these classes should be namespaced within a 'Prophecy' global.
	 */
	import * as Imm from 'immutable';
	export const Immutable: typeof Imm;
	export type Immutable = typeof Imm;
	export { PRecord } from 'prophecy-engine/precord';
	export { Account, AccountValues } from 'prophecy-engine/account';
	export { Budget, BudgetValues, BalanceMap } from 'prophecy-engine/budget';
	export { Category, CategoryValues, CategoryGroup, CategoryRule, CategoryRulePeriod, CategoryRuleValues } from 'prophecy-engine/category';
	export { Currency, CurrencyFormatter, SUPPORTED_CURRENCIES } from 'prophecy-engine/currency';
	export { default as PDate } from 'prophecy-engine/pdate';
	export { Transaction, TransactionDetail, TransactionValues } from 'prophecy-engine/transaction';
	export { reducer, inverter } from 'prophecy-engine/redux/prophecy_redux';
	import * as _actions from 'prophecy-engine/redux/actions';
	export const actions: typeof _actions;
	export const version: {
	    major: number;
	    minor: number;
	};

}
declare module 'prophecy-engine' {
	export * from 'prophecy-engine/prophecy';
}
