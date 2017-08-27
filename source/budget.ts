import * as Immutable from 'immutable';
import {Account} from './account';
import {Category, CategoryGroup, CategoryRule} from './category';
import {Currency, SUPPORTED_CURRENCIES} from './currency';
import PDate from './pdate';
import {TypedRecordClass} from './precord'; // Todo: remove this import once we can upgrade to Immutable.js 4+
import {Transaction, TransactionDetail} from './transaction';
import {__, assert, assertIsNumber, MappableIterable, PRecord} from './util';


// Private constants used to create private fields on a Record subclass:
// Unfortunately we cannot use Symbols, since Immutable.Record keys must be strings.
// The value of these strings doesn't matter, as long as they're unique.

/** Key for private field containing OrderedMap of accounts */
const _accounts = "^a";
/** Key for private field containing Map of categories */
const _categories = "^c";
/** Key for private field containing OrderedMap of category groups */
const _categoryGroups = "^g";
/** Key for private field containing OrderedMap of transactions */
const _transactions = "^n";

const enum PrivateFields {
    accounts = '^a',
    categories = '^c',
    categoryGroups = '^g',
    transactions = '^n',
}


// Prophecy/Budget class version
// The major version should be changed when backwards compatibility is broken.
// The minor version should be changed when new features are added in a backwards-compatible way.
export const majorVersion = 0;
export const minorVersion = 2;

export type AccountMap = Immutable.OrderedMap<number, Account>;
export const AccountMap = <T>(...args: T[]) => Immutable.OrderedMap<number, Account>(...args);
export type CategoryMap = Immutable.OrderedMap<number, Category>;
export const CategoryMap = <T>(...args: T[]) => Immutable.OrderedMap<number, Category>(...args);
export type CategoryGroupMap = Immutable.OrderedMap<number, CategoryGroup>;
export const CategoryGroupMap = <T>(...args: T[]) => Immutable.OrderedMap<number, CategoryGroup>(...args);
export type TransactionMap = Immutable.OrderedMap<number, Transaction>;
export const TransactionMap = <T>(...args: T[]) => Immutable.OrderedMap<number, Transaction>(...args);

export interface BudgetJSON {
    id: number|null;
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
    id?: number|null;
    name?: string;
    startDate?: PDate;
    endDate?: PDate;
    currencyCode?: string;
    accounts?: Account[];
    categories?: Category[];
    categoryGroups?: CategoryGroup[];
    transactions?: Transaction[];
}
export type BalanceMap = Immutable.Map<number, number>;
interface BudgetPrivateValues extends BudgetValues {
    '^a'?: AccountMap; // Todo: change '^a' to [PrivateFields.accounts] when TypeScript supports that.
    '^c'?: CategoryMap;
    '^g'?: CategoryGroupMap;
    '^n'?: TransactionMap;
}

/**
 * Class that describes a budget.
 *
 * A budget is a set of spending plans and actual transactions
 * for a specific a period of time.
 */
export class Budget extends PRecord({
    id: null as number|null,

    name: __("New Budget"),

    /** Start date of the budget. Always of type PDate, and always less than or equal to end date. */
    startDate: new PDate(0),
    /** End date of the budget. Always of type PDate, and always greater than or equal to start date. */
    endDate: new PDate(0),

    /**
     * ISO 4217 currency code for the budget. Individual accounts may use different currencies.
     * This setting does not directly have any effect as far as Prophecy is concerned, but it
     * is useful to apps working with the budget.
     *
     * It's best to read this value as a Currency object using the 'currency' getter.
     */
    currencyCode: 'USD',

    // Private fields below. Once typescript supports using computed property names as fields,
    // switch back to that.
    /** Ordered map of Accounts, in a custom order specified by the user. See accounts() getter. */
    '^a': AccountMap(),
    /** Map of Categories, keyed by ID, ordered by category group order, and in a custom order within each group. See categories() getter. */
    '^c': CategoryMap(),
    /** Ordered map of CategoryGroups, in a custom order specified by the user. See categoryGroups() getter. */
    '^g': CategoryGroupMap(),
    /** _transactions: Stores transactions. See transactions() getter. */
    '^n': TransactionMap(),
    // The above fields kept private so we can carefully control insertion logic.
    // We don't want to allow budget.set('transactions', ...)
}) {
    private _accountBalances: {readonly [key: number]: number};
    private _transactionAccountBalances: {readonly [transactionId: number]: number};

    constructor(origValues?: BudgetValues) {
        const values: BudgetPrivateValues = Object.assign({}, origValues || {}); // Don't modify the argument itself
        // Budget must always have a valid date range:
        if (values.startDate === undefined || values.endDate === undefined) {
            const year = PDate.today().year;
            values.startDate = values.startDate || PDate.create(year, 0, 1);
            values.endDate = values.endDate || PDate.create(year, 11, 31);
        }
        // Allow passing 'accounts' into the constructor. It can be any iterable with Account-typed values
        if (values.accounts !== undefined) {
            // Don't trust the keys (if any) of values.accounts; create new keys:
            values[_accounts] = AccountMap(Immutable.Seq.Indexed(values.accounts).map((a: Account) => [a.id, a]));
            delete values.accounts;
        }
        // Allow passing 'categoryGroups' into the constructor. It can be any iterable with CategoryGroup-typed values.
        if (values.categoryGroups !== undefined) {
            values[_categoryGroups] = CategoryGroupMap(Immutable.Seq.Indexed(values.categoryGroups).map((cg: CategoryGroup) => [cg.id, cg]));
            delete values.categoryGroups;
        }
        // Allow passing 'categories' into the constructor. It can be any iterable with Category-typed values
        if (values.categories !== undefined) {
            const categoriesIterable = Immutable.Seq.Indexed(values.categories);
            const categoryGroups = values[_categoryGroups];
            // Don't trust the keys (if any) of values.categories; create new keys.
            // Also ensure that all categories are sorted by group in the same order as CategoryGroups is sorted.
            if (categoryGroups === undefined) {
                throw new Error('cannot have categories without category groups.');
            }
            values[_categories] = _createOrderedCategoryMap(categoriesIterable, categoryGroups);
            delete values.categories;
        }
        // Allow passing 'transactions' into the constructor. It can be any iterable with Transaction-typed values
        if (values.transactions !== undefined) {
            assert(values[_transactions] === undefined); // We expect 'transactions' or _transactions, but not both.
            // Don't trust the keys (if any) or the ordering of values.transactions; create new keys and force a sort:
            values[_transactions] = TransactionMap(
                Immutable.Seq.Indexed(values.transactions).sortBy(Budget.transactionSorter).map((t: Transaction) => [t.id, t])
            );
            delete values.transactions;
        }
        super(values);
    }

    /** Assertions to help enforce correct usage. */
    protected _checkInvariants() {
        assert(this.currency instanceof Currency, "currencyCode must be valid");
        assert(this.startDate instanceof PDate);
        assert(this.endDate instanceof PDate);
        assert(+this.endDate >= +this.startDate);
        assert(Immutable.OrderedMap.isOrderedMap(this.accounts));
        this.accounts.forEach(account => assert(account instanceof Account));
        assert(Immutable.OrderedMap.isOrderedMap(this.categoryGroups));
        this.categoryGroups.forEach(category => assert(category instanceof CategoryGroup));
        assert(Immutable.OrderedMap.isOrderedMap(this.categories));
        this.categories.forEach(category => {
            if (!(category instanceof Category)) {
                throw new Error("categories must all be of type Category");
            }
            category.assertIsValidForBudget(this);
        });
        assert(Immutable.OrderedMap.isOrderedMap(this.transactions));
        this.transactions.forEach(transaction => {
            if (!(transaction instanceof Transaction)) {
                throw new Error("Transactions must be of type Transaction");
            }
            transaction.assertIsValidForBudget(this);
        });
    }

    /** Get the currency of this budget. */
    public get currency(): Currency { return SUPPORTED_CURRENCIES[this.currencyCode]; }

    /** Ordered list of Accounts, in custom order */
    public get accounts(): AccountMap { return this[_accounts]; }

    /** Map of categories, keyed by ID. Not in order. */
    public get categories(): CategoryMap { return this[_categories]; }

    /** Ordered list of CategoryGroups, in custom order */
    public get categoryGroups(): Immutable.OrderedMap<number, CategoryGroup> { return this[_categoryGroups]; }

    /**
     * Delete a category.
     *
     * Any transactions linked to this category will have their category set to null.
     *
     * @param {number} id - ID of the category to delete
     * @returns {Budget} - A new Budget with the desired change.
     */
    public deleteCategory(id: number): Budget {
        // Change all Transaction references to that category to null:
        const transactions = this[_transactions].map(
            (t: Transaction) => t.set('detail', t.detail.map(
                (d: TransactionDetail) => d.update('categoryId', categoryId => categoryId === id ? null : categoryId)
            ).toList())
        );
        return this.merge({
            [_categories]: this[_categories].delete(id),
            [_transactions]: transactions,
        });
    }

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
    public updateCategory(category: Category) {
        assert(category instanceof Category);
        if (typeof category.id !== 'number') {
            throw new Error("Invalid category ID.");
        }
        const origCategory = this.categories.get(category.id);
        if (origCategory === undefined || origCategory.groupId !== category.groupId) {
            // The group ID has changed. We need to carefully ensure that this.categories
            // stays sorted, first by group order, then in custom order, with the modified
            // category at the end of its new category group
            let categories = this.categories.delete(category.id).set(category.id, category); // Move/insert category to the end
            categories = _createOrderedCategoryMap(categories.valueSeq(), this.categoryGroups);
            return this.set(_categories, categories);
        }
        return this.set(_categories, this[_categories].set(category.id, category));
    }

    /**
     * Change a category's position within its category group
     *
     * @param {number} categoryId ID of the category to move
     * @param {number} newIndex New position within its category group (0 = first)
     * @returns {Budget} A new Budget with the desired change.
     */
    public positionCategory(categoryId: number, newIndex: number) {
        assertIsNumber(categoryId);
        assertIsNumber(newIndex);
        const category = this.categories.get(categoryId);
        assert(category instanceof Category);
        const groupCategories = this.categories.filter((cat: Category) => cat.groupId === category.groupId);
        assert(newIndex >= 0 && newIndex <= groupCategories.size);

        // this.categories is ordered first by category group order, then by custom order within each group.
        // Our goal is to move the category around within the group, but keep the overall map still sorted
        // by group.

        const currentIndexOverall = this.categories.keySeq().keyOf(categoryId);
        const currentIndexWithinGroup = groupCategories.keySeq().keyOf(categoryId);
        const newIndexOverall = currentIndexOverall + (newIndex - currentIndexWithinGroup);

        const newCategories = CategoryMap(
            this.categories.toList()
            .filter((cat: Category) => cat.id !== categoryId).toList()
            .insert(newIndexOverall, category)
            .map((a: Category) => [a.id, a])
        );
        return this.set(_categories, newCategories);
    }

    /**
     * Delete a category group. It must be empty!
     * @param {number} id - ID of the category group to delete
     * @returns {Budget} - A new Budget with the desired change.
     */
    public deleteCategoryGroup(id: number): Budget {
        assert(this.categories.filter((cat: Category) => cat.groupId === id).isEmpty(), "Only empty category groups can be deleted.");
        return this.set(_categoryGroups, this[_categoryGroups].delete(id));
    }

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
    public updateCategoryGroup(categoryGroup: CategoryGroup): Budget {
        assert(categoryGroup instanceof CategoryGroup);
        if (typeof categoryGroup.id !== 'number') {
            throw new Error("Invalid Category Group ID");
        }
        return this.set(_categoryGroups, this[_categoryGroups].set(categoryGroup.id, categoryGroup));
    }

    /**
     * Change a category group's position in the list of category groups
     *
     * @param {number} groupId ID of the category group to move
     * @param {number} newIndex New position in the list of category groups (0 = first)
     * @returns {Budget} A new Budget with the desired change.
     */
    public positionCategoryGroup(groupId: number, newIndex: number): Budget {
        assertIsNumber(groupId);
        assertIsNumber(newIndex);
        const categoryGroup = this.categoryGroups.get(groupId);
        assert(categoryGroup instanceof CategoryGroup);
        const newCategoryGroups = CategoryGroupMap(
            this.categoryGroups.toList()
            .filter((g: CategoryGroup) => g.id !== groupId).toList()
            .insert(newIndex, categoryGroup)
            .map((a: CategoryGroup) => [a.id, a])
        );
        return this.set(_categoryGroups, newCategoryGroups);
    }

    /**
     * Delete an account
     * @param {number} id - ID of the account to delete
     * @returns {Budget} - A new Budget with the desired change.
     */
    public deleteAccount(id: number): Budget {
        // Change all Transaction references to that account to null:
        const transactions = this[_transactions].map((t: Transaction) => {
            if (t.accountId === id) {
                return t.set("accountId", null);
            }
            return t;
        });
        return this.merge({
            [_accounts]: this[_accounts].delete(id),
            [_transactions]: transactions,
        });
    }

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
    public updateAccount(newAccount: Account): Budget {
        assert(newAccount instanceof Account);
        if (typeof newAccount.id !== 'number') {
            throw new Error("account must have ID.");
        }
        const newAccounts = this[_accounts].set(newAccount.id, newAccount);
        return this.set(_accounts, newAccounts);
    }

    /**
     * positionAccount: Change an account's position in the list of accounts
     *
     * @param {number} accountId ID of the account to move
     * @param {number} newIndex New position in the list of accounts (0 = first)
     * @returns {Budget} A new Budget with the desired change.
     */
    public positionAccount(accountId: number, newIndex: number): Budget {
        assertIsNumber(accountId);
        assertIsNumber(newIndex);
        const account = this.accounts.get(accountId);
        assert(account instanceof Account);
        const newAccounts = AccountMap(
            this.accounts.toList().filter((a: Account) => a.id !== accountId).toList().insert(newIndex, account).map((a: Account) => [a.id, a])
        );
        return this.set(_accounts, newAccounts);
    }

    /**
     * Ordered list of Transactions, always in chronological order (oldest first; null dates go last)
     * @returns {OrderedMap}
     */
    public get transactions(): TransactionMap { return this[_transactions]; }
    /**
     * Delete a transaction
     * @param {number} id - ID of the transaction to delete
     * @returns {Budget} A new Budget with the desired change.
     */
    public deleteTransaction(id: number): Budget { return this.set(_transactions, this[_transactions].delete(id)); }
    /**
     * updateTransaction: Insert or update a transaction.
     *
     * If newTransaction.id is in the list of transactions, this will be an update.
     * If newTransaction.id is not in the list of transactions, this will add it.
     *
     * @param {Transaction} newTransaction - The transaction to insert/modify.
     * @returns {Budget} A new Budget with the desired change.
     */
    public updateTransaction(newTransaction: Transaction): Budget {
        assert(newTransaction instanceof Transaction, "expected Transaction");
        const id = newTransaction.id;
        if (typeof id !== 'number') {
            throw new Error("Transaction must have an ID.");
        }
        assert(newTransaction.accountId === null || this.accounts.has(newTransaction.accountId), "accountId must be valid.");
        let sortRequired = true;
        if (this[_transactions].has(id)) {
            // We are replacing an existing value:
            const oldTransaction: Transaction = this[_transactions].get(id);
            // We'll only need to re-sort transactions if the date has changed:
            sortRequired = (+(newTransaction.date || -1) !== +(oldTransaction.date || -1));
        } else {
            // We are inserting a new value.
            // Sort it into the correct spot, unless 'date' is null, in which
            // case it can just be appended to the end of the list.
            sortRequired = newTransaction.date !== null;
        }
        let newTransactions: TransactionMap = this[_transactions].set(id, newTransaction);
        if (sortRequired) {
            newTransactions = newTransactions.sortBy(Budget.transactionSorter) as TransactionMap;
        }
        return this.set(_transactions, newTransactions);
    }

    /**
     * _computeBalances: Private method that computes the balance of each account as well
     * as the running total of the relevant account as of each transaction.
     */
    private _computeBalances() {
        assert(this._accountBalances === undefined, "_computeBalances() should only run once per Budget instance.");
        // Get the initial balance of each account:
        const accountBalances: {[accountId: number]: number} = this.accounts.map((account: Account) => account.initialBalance).toJS();
        const transactionBalances: {[transactionId: number]: number} = {};

        for (const transaction of this.transactions.values() as IterableIterator<Transaction>) { // TODO Remove 'as' w/ Immutable.js 4+
            if (transaction.pending || transaction.accountId === null) {
                // Only define a "running balance for this account as of this transaction" if there is an accountId and the transaction is not pending
                continue;
            } else {
                const balance = accountBalances[transaction.accountId] += transaction.amount;
                if (transaction.id !== null) {
                    transactionBalances[transaction.id] = balance;
                }
            }
        }
        // We cache the results and make them immutable. We don't have to worry about cache
        // invalidation; any change to Budget will create a new object with an empty cache.
        this._accountBalances = Object.freeze(accountBalances);
        this._transactionAccountBalances = Object.freeze(transactionBalances);
    }

    /** Get an object which contains balance of each account keyed by accountId, considering all non-pending transactions */
    public get accountBalances() {
        if (this._accountBalances === undefined) {
            this._computeBalances();
        }
        return this._accountBalances;
    }

    /**
     * Get the balance of any account as of the specified transaction.
     * Only non-pending transactions with a date are considered.
     *
     * @param {number} transactionId - The transaction to use as a reference point
     * @param {number} accountId - the account whose balance to return
     * @returns {number|undefined} The balance of the specified account as of the specified transaction
     */
    public accountBalanceAsOfTransaction(transactionId: number, accountId: number): number|undefined {
        const account = this.accounts.get(accountId);
        assert(account !== undefined);
        const transaction = this.transactions.get(transactionId);
        assert(transaction !== undefined);
        if (transaction.date === null || transaction.pending === true) {
            return undefined; // We can't define an account balance for these type of transactions
        }
        if (this._accountBalances === undefined) {
            this._computeBalances();
        }

        if (transaction.accountId === accountId) {
            const x = this._transactionAccountBalances[transactionId];
            return x;
        } else {
            // Account balances are computed per transaction.
            // Find the most recent preceding transaction associated with the specified account,
            // and return the account balance as of that transaction.
            const transactions = this.transactions.filter((txn: Transaction) => txn.date !== null && txn.pending === false);
            const index = transactions.keySeq().keyOf(transactionId); // The index of the specified transaction
            const precedingTransactions = transactions.valueSeq().slice(0, index);
            const lastAccountTransaction = precedingTransactions.findLast((txn: Transaction) => txn.accountId === accountId);
            if (lastAccountTransaction) {
                return this._transactionAccountBalances[lastAccountTransaction.id as number];
            } else {
                return account.initialBalance;
            }
        }
    }

    /**
     * Given a date, get the balance of all categories, up to and including that date.
     *
     * @param {PDate} date - The date
     * @returns {Immutable.Map} - The balance of all categories as of that date, as a map where
     *        the key is the category ID and the value is the balance of that category.
     */
    public categoryBalancesOnDate(date: PDate): BalanceMap {
        assert(date instanceof PDate);
        assert(date >= this.startDate);
        assert(date <= this.endDate);
        return Immutable.Map<number, number>().withMutations(map => {
            for (const txn of this.transactions.values() as IterableIterator<Transaction>) { // TODO Remove 'as' w/ Immutable.js 4+
                if (txn.date === null || txn.date > date) { // Dates are ordered oldest first, null last.
                    break;
                }
                txn.detail.forEach((d: TransactionDetail) => {
                    if (d.categoryId !== null) {
                        map.set(d.categoryId, map.get(d.categoryId, 0) + d.amount);
                    }
                });
            }
        });
    }

    /**
     * Given a date, get the balance of the specified category, up to and including that date.
     *
     * @param {number} categoryId - The ID of the category
     * @param {PDate} date - The date
     * @returns {number} - The balance of the specified category as of that date
     */
    public categoryBalanceByDate(categoryId: number, date: PDate): number {
        assert(this.categories.has(categoryId));
        return this.categoryBalancesOnDate(date).get(categoryId, 0);
    }

    /**
     * Given a date, get the budget of each category, up to and including that date.
     *
     * @param {PDate} date - The date
     * @returns {Immutable.Map} - The budget of all categories as of that date, as a map where
     *        the key is the category ID and the value is the budget amount of that category.
     */
    public categoryBudgetsOnDate(date: PDate): BalanceMap {
        let transactionCategoryBalances: BalanceMap|null = null;
        assert(date instanceof PDate);
        assert(date >= this.startDate);
        assert(date <= this.endDate);
        return Immutable.Map<number, number>().withMutations(map => {
            for (const category of this.categories.values() as IterableIterator<Category>) { // TODO Remove 'as' w/ Immutable.js 4+
                if (category.id === null) {
                    continue; // Exclude categories with no ID.
                }
                let budgetAmount = 0;
                if (category.rules === null) {// equivalent to: if (category.isAutomatic) {
                    if (transactionCategoryBalances === null) {
                        transactionCategoryBalances = this.categoryBalancesOnDate(date);
                    }
                    budgetAmount = transactionCategoryBalances.get(category.id, 0);
                } else {
                    category.rules.forEach((rule: CategoryRule) => {
                        budgetAmount += rule.amount * rule.countOccurrencesBetween(this.startDate, date);
                    });
                }
                map.set(category.id, budgetAmount);
            }
        });
    }

    public toJS(): BudgetJSON {
        const result: any = super.toJS();
        // Remove private keys:
        delete result[_accounts];
        delete result[_categories];
        delete result[_categoryGroups];
        delete result[_transactions];
        // Add accounts as a correctly-ordered array:
        result.accounts = this.accounts.toList().toJS();
        // Add categories as an array:
        result.categories = this.categories.toList().toJS();
        // Add category groups as a correctly-ordered array:
        result.categoryGroups = this.categoryGroups.toList().toJS();
        // Add transactions as a correctly-ordered array:
        result.transactions = this.transactions.toList().toJS();
        // Add version information
        // Major version should only change if backwards compatibility is broken.
        result.version = {major: majorVersion, minor: minorVersion};
        return result;
    }

    /**
     * Convert from a JSON-friendly native JavaScript object (or JSON) to a Budget instance.
     * @param {Object} obj - JSON or JavaScript serialized representation of an instance of this Budget.
     * @returns {Object} - New instance of this Budget.
     */
    public static fromJS(obj: BudgetJSON|any) {
        // The JS serialization won't be typed, but the constructor expects types like Catgory, Transaction, etc:
        const values = Object.assign({}, obj);
        for (const dateField of ['startDate', 'endDate']) {
            if (values[dateField] !== null) {
                assertIsNumber(values[dateField]);
                values[dateField] = new PDate(values[dateField]);
            }
        }
        const typedLists = [
            {key: "accounts", type: Account},
            {key: "categories", type: Category},
            {key: "categoryGroups", type: CategoryGroup},
            {key: "transactions", type: Transaction},
        ];
        for (const {key, type} of typedLists) {
            values[key] = values[key].map((entry: any) => type.fromJS(entry));
        }
        return new this(values);
    }

    public static transactionSorter(transaction: Transaction): number {
        return transaction.date === null ? 999999 : +transaction.date; // Sort 'null' dates after the highest date
    }
}

/**
 * Given any iterable of Categories, generate a properly sorted OrderedMap.
 *
 * Categories should be ordered by group (in the custom order that category
 * groups are in), and then secondarily by the custom order (whatever order
 * they're currently in in the passed iterable.)
 *
 * @param {Category[]} categories - Iterable of categories
 * @param {CategoryGroup[]} categoryGroups - The groups that the categories
 *        need to be sorted by. The groups should be in a custom order.
 *
 * @returns {Immutable.OrderedMap} OrderedMap of categories.
 */
function _createOrderedCategoryMap(categories: Immutable.Seq.Indexed<Category>, categoryGroups: Immutable.Iterable.Keyed<number, CategoryGroup>) {
    const categoryGroupIdsOrdered = categoryGroups.keySeq();
    return Immutable.OrderedMap<number, Category>(
        categories.sortBy((category: Category) =>
            category.groupId ? categoryGroupIdsOrdered.keyOf(category.groupId) : 0  // groupId should always be a number though.
        ).map((c: Category) => [c.id, c])
    );
}
