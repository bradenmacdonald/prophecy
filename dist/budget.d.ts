import * as Immutable from 'immutable';
import { Account } from './account';
import { Category, CategoryGroup } from './category';
import { Currency } from './currency';
import PDate from './pdate';
import { TypedRecordClass } from './precord';
import { Transaction } from './transaction';
export declare const majorVersion = 0;
export declare const minorVersion = 1;
export declare type AccountMap = Immutable.OrderedMap<number, Account>;
export declare const AccountMap: <T>(...args: T[]) => Immutable.OrderedMap<number, Account>;
export declare type CategoryMap = Immutable.OrderedMap<number, Category>;
export declare const CategoryMap: <T>(...args: T[]) => Immutable.OrderedMap<number, Category>;
export declare type CategoryGroupMap = Immutable.OrderedMap<number, CategoryGroup>;
export declare const CategoryGroupMap: <T>(...args: T[]) => Immutable.OrderedMap<number, CategoryGroup>;
export declare type TransactionMap = Immutable.OrderedMap<number, Transaction>;
export declare const TransactionMap: <T>(...args: T[]) => Immutable.OrderedMap<number, Transaction>;
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
export declare type BalanceMap = Immutable.Map<number, number>;
declare const Budget_base: TypedRecordClass<{
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
export declare class Budget extends Budget_base {
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
