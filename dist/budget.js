import PDate from './pdate';
import { Account } from './account';
import { Category, CategoryGroup } from './category';
import { Currency, SUPPORTED_CURRENCIES } from './currency';
import { Transaction } from './transaction';
import { __, assert, assertIsNumber, PRecord, Immutable } from './util';
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
// Private symbols used for other attributes that aren't formal fields:
const _accountBalances = Symbol();
const _transactionAccountBalances = Symbol();
// Prophecy/Budget class version
// The major version should be changed when backwards compatibility is broken.
// The minor version should be changed when new features are added in a backwards-compatible way.
export const majorVersion = 0;
export const minorVersion = 1;
/**
 * Class that describes a budget.
 *
 * A budget is a set of spending plans and actual transactions
 * for a specific a period of time.
 */
export class Budget extends PRecord({
    id: null,
    name: __("New Budget"),
    /** Start date of the budget. Always of type PDate, and always less than or equal to end date. */
    startDate: null,
    /** End date of the budget. Always of type PDate, and always greater than or equal to start date. */
    endDate: null,
    /**
     * ISO 4217 currency code for the budget. Individual accounts may use different currencies.
     * This setting does not directly have any effect as far as Prophecy is concerned, but it
     * is useful to apps working with the budget.
     *
     * It's best to read this value as a Currency object using the 'currency' getter.
     */
    currencyCode: 'USD',
    /** Ordered map of Accounts, in a custom order specified by the user. See accounts() getter. */
    [_accounts]: Immutable.OrderedMap(),
    /** Map of Categories, keyed by ID, ordered by category group order, and in a custom order within each group. See categories() getter. */
    [_categories]: Immutable.OrderedMap(),
    /** Ordered map of CategoryGroups, in a custom order specified by the user. See categoryGroups() getter. */
    [_categoryGroups]: Immutable.OrderedMap(),
    /** _transactions: Stores transactions. See transactions() getter. */
    [_transactions]: Immutable.OrderedMap(),
}) {
    constructor(values) {
        values = Object.assign({}, values || {}); // Don't modify the argument itself
        // Budget must always have a valid date range:
        if (values.startDate === undefined || values.endDate === undefined) {
            const year = PDate.today().year;
            values.startDate = values.startDate || PDate.create(year, 0, 1);
            values.endDate = values.endDate || PDate.create(year, 11, 31);
        }
        // Allow passing 'accounts' into the constructor. It can be any iterable with Account-typed values
        if (values.accounts !== undefined) {
            // Don't trust the keys (if any) of values.accounts; create new keys:
            values[_accounts] = new Immutable.OrderedMap(Immutable.Seq.Indexed(values.accounts).map(a => [a.id, a]));
            delete values.accounts;
        }
        // Allow passing 'categoryGroups' into the constructor. It can be any iterable with CategoryGroup-typed values.
        if (values.categoryGroups !== undefined) {
            values[_categoryGroups] = new Immutable.OrderedMap(Immutable.Seq.Indexed(values.categoryGroups).map(cg => [cg.id, cg]));
            delete values.categoryGroups;
        }
        // Allow passing 'categories' into the constructor. It can be any iterable with Category-typed values
        if (values.categories !== undefined) {
            // Don't trust the keys (if any) of values.categories; create new keys.
            // Also ensure that all categories are sorted by group in the same order as CategoryGroups is sorted.
            values[_categories] = _createOrderedCategoryMap(values.categories, values[_categoryGroups]);
            delete values.categories;
        }
        // Allow passing 'transactions' into the constructor. It can be any iterable with Transaction-typed values
        if (values.transactions !== undefined) {
            assert(values[_transactions] === undefined); // We expect 'transactions' or _transactions, but not both.
            // Don't trust the keys (if any) or the ordering of values.transactions; create new keys and force a sort:
            values[_transactions] = new Immutable.OrderedMap(Immutable.Seq.Indexed(values.transactions).sortBy(Budget.transactionSorter).map(t => [t.id, t]));
            delete values.transactions;
        }
        super(values);
    }
    /** Assertions to help enforce correct usage. */
    _checkInvariants() {
        assert(this.currency instanceof Currency, "currencyCode must be valid");
        assert(this.startDate instanceof PDate);
        assert(this.endDate instanceof PDate);
        assert(+this.endDate >= +this.startDate);
        assert(this.accounts instanceof Immutable.OrderedMap);
        this.accounts.forEach(account => assert(account instanceof Account));
        assert(this.categoryGroups instanceof Immutable.OrderedMap);
        this.categoryGroups.forEach(category => assert(category instanceof CategoryGroup));
        assert(this.categories instanceof Immutable.OrderedMap);
        this.categories.forEach(category => {
            assert(category instanceof Category);
            category.assertIsValidForBudget(this);
        });
        assert(this.transactions instanceof Immutable.OrderedMap);
        this.transactions.forEach(transaction => {
            assert(transaction instanceof Transaction);
            transaction.assertIsValidForBudget(this);
        });
    }
    /** Get the currency of this budget. */
    get currency() { return SUPPORTED_CURRENCIES[this.currencyCode]; }
    /** Ordered list of Accounts, in custom order */
    get accounts() { return this[_accounts]; }
    /** Map of categories, keyed by ID. Not in order. */
    get categories() { return this[_categories]; }
    /** Ordered list of CategoryGroups, in custom order */
    get categoryGroups() { return this[_categoryGroups]; }
    /**
     * Delete a category.
     *
     * Any transactions linked to this category will have their category set to null.
     *
     * @param {number} id - ID of the category to delete
     * @returns {Budget} - A new Budget with the desired change.
     */
    deleteCategory(id) {
        // Change all Transaction references to that category to null:
        const transactions = this[_transactions].map(t => t.set('detail', t.detail.map(d => d.update('categoryId', categoryId => categoryId === id ? null : categoryId))));
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
     * @param {Account} category - The category to add/modify
     * @returns {Budget} A new Budget with the desired change.
     */
    updateCategory(category) {
        assert(category instanceof Category);
        assertIsNumber(category.id);
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
    positionCategory(categoryId, newIndex) {
        assertIsNumber(categoryId);
        assertIsNumber(newIndex);
        const category = this.categories.get(categoryId);
        assert(category instanceof Category);
        const groupCategories = this.categories.filter(cat => cat.groupId === category.groupId);
        assert(newIndex >= 0 && newIndex <= groupCategories.size);
        // this.categories is ordered first by category group order, then by custom order within each group.
        // Our goal is to move the category around within the group, but keep the overall map still sorted
        // by group.
        const currentIndexOverall = this.categories.keySeq().keyOf(categoryId);
        const currentIndexWithinGroup = groupCategories.keySeq().keyOf(categoryId);
        const newIndexOverall = currentIndexOverall + (newIndex - currentIndexWithinGroup);
        const newCategories = new Immutable.OrderedMap(this.categories.toList().filter(cat => cat.id !== categoryId).insert(newIndexOverall, category).map(a => [a.id, a]));
        return this.set(_categories, newCategories);
    }
    /**
     * Delete a category group. It must be empty!
     * @param {number} id - ID of the category group to delete
     * @returns {Budget} - A new Budget with the desired change.
     */
    deleteCategoryGroup(id) {
        assert(this.categories.filter(cat => cat.groupId === id).isEmpty(), "Only empty category groups can be deleted.");
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
     * @param {Account} categoryGroup - The category group to add/modify
     * @returns {Budget} A new Budget with the desired change.
     */
    updateCategoryGroup(categoryGroup) {
        assert(categoryGroup instanceof CategoryGroup);
        assertIsNumber(categoryGroup.id);
        return this.set(_categoryGroups, this[_categoryGroups].set(categoryGroup.id, categoryGroup));
    }
    /**
     * Change a category group's position in the list of category groups
     *
     * @param {number} groupId ID of the category group to move
     * @param {number} newIndex New position in the list of category groups (0 = first)
     * @returns {Budget} A new Budget with the desired change.
     */
    positionCategoryGroup(groupId, newIndex) {
        assertIsNumber(groupId);
        assertIsNumber(newIndex);
        const categoryGroup = this.categoryGroups.get(groupId);
        assert(categoryGroup instanceof CategoryGroup);
        const newCategoryGroups = new Immutable.OrderedMap(this.categoryGroups.toList().filter(g => g.id !== groupId).insert(newIndex, categoryGroup).map(a => [a.id, a]));
        return this.set(_categoryGroups, newCategoryGroups);
    }
    /**
     * Delete an account
     * @param {number} id - ID of the account to delete
     * @returns {Budget} - A new Budget with the desired change.
     */
    deleteAccount(id) {
        // Change all Transaction references to that account to null:
        const transactions = this[_transactions].map(t => {
            if (t.accountId == id) {
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
    updateAccount(newAccount) {
        assert(newAccount instanceof Account);
        assertIsNumber(newAccount.id);
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
    positionAccount(accountId, newIndex) {
        assertIsNumber(accountId);
        assertIsNumber(newIndex);
        const account = this.accounts.get(accountId);
        assert(account instanceof Account);
        const newAccounts = new Immutable.OrderedMap(this.accounts.toList().filter(a => a.id !== accountId).insert(newIndex, account).map(a => [a.id, a]));
        return this.set(_accounts, newAccounts);
    }
    /**
     * Ordered list of Transactions, always in chronological order (oldest first; null dates go last)
     * @returns {OrderedMap}
     */
    get transactions() { return this[_transactions]; }
    /**
     * Delete a transaction
     * @param {number} id - ID of the transaction to delete
     * @returns {Budget} A new Budget with the desired change.
     */
    deleteTransaction(id) { return this.set(_transactions, this[_transactions].delete(id)); }
    /**
     * updateTransaction: Insert or update a transaction.
     *
     * If newTransaction.id is in the list of transactions, this will be an update.
     * If newTransaction.id is not in the list of transactions, this will add it.
     *
     * @param {Transaction} newTransaction - The transaction to insert/modify.
     * @returns {Budget} A new Budget with the desired change.
     */
    updateTransaction(newTransaction) {
        assert(newTransaction instanceof Transaction, "expected Transaction");
        assertIsNumber(newTransaction.id, "Transaction instances must have numeric ID.");
        assert(newTransaction.accountId === null || this.accounts.has(newTransaction.accountId), "accountId must be valid.");
        const id = newTransaction.id;
        let sortRequired = true;
        if (this[_transactions].has(id)) {
            // We are replacing an existing value:
            const oldTransaction = this[_transactions].get(id);
            // We'll only need to re-sort transactions if the date has changed:
            sortRequired = (newTransaction.date !== +oldTransaction.date);
        }
        else {
            // We are inserting a new value.
            // Sort it into the correct spot, unless 'date' is null, in which
            // case it can just be appended to the end of the list.
            sortRequired = newTransaction.date !== null;
        }
        let newTransactions = this[_transactions].set(id, newTransaction);
        if (sortRequired) {
            newTransactions = newTransactions.sortBy(Budget.transactionSorter);
        }
        return this.set(_transactions, newTransactions);
    }
    /**
     * _computeBalances: Private method that computes the balance of each account as well
     * as the running total of the relevant account as of each transaction.
     */
    _computeBalances() {
        assert(this[_accountBalances] === undefined, "_computeBalances() should only run once per Budget instance.");
        // Get the initial balance of each account:
        const accountBalances = this.accounts.map(account => account.initialBalance).toJS();
        const transactionBalances = {};
        // Use accountBalances[null] to represents the total 'amount' of transactions that
        // have no account set. The currency of this amount is unknonwn so the absolute
        // amount is meaningless; we mostly care if it's zero or not.
        accountBalances[null] = 0;
        for (let transaction of this.transactions.filterNot(t => t.pending).values()) {
            const balance = accountBalances[transaction.accountId] += transaction.amount; // Note that transaction.accountId may be null
            if (transaction.accountId) {
                transactionBalances[transaction.id] = balance;
            }
        }
        // We cache the results and make them immutable. We don't have to worry about cache
        // invalidation; any change to Budget will create a new object with an empty cache.
        this[_accountBalances] = Object.freeze(accountBalances);
        this[_transactionAccountBalances] = Object.freeze(transactionBalances);
    }
    /** Get an object which contains balance of each account keyed by accountId, considering all non-pending transactions */
    get accountBalances() {
        if (this[_accountBalances] === undefined) {
            this._computeBalances();
        }
        return this[_accountBalances];
    }
    /**
     * Get the balance of any account as of the specified transaction.
     * Only non-pending transactions with a date are considered.
     *
     * @param {number} transactionId - The transaction to use as a reference point
     * @param {number} accountId - the account whose balance to return
     * @returns {number|undefined} The balance of the specified account as of the specified transaction
     **/
    accountBalanceAsOfTransaction(transactionId, accountId) {
        const transactions = this.transactions.filter(txn => txn.date !== null && txn.pending === false);
        const transaction = transactions.get(transactionId);
        const account = this.accounts.get(accountId);
        assert(account !== undefined);
        if (transaction === undefined) {
            return undefined; // Probably a pending transaction or one without a date.
        }
        if (this[_accountBalances] === undefined) {
            this._computeBalances();
        }
        if (transaction.accountId == accountId) {
            return this[_transactionAccountBalances][transactionId];
        }
        else {
            // Account balances are computed per transaction.
            // Find the most recent preceding transaction associated with the specified account,
            // and return the account balance as of that transaction.
            const index = transactions.keySeq().keyOf(transactionId); // The index of the specified transaction
            const precedingTransactions = transactions.valueSeq().slice(0, index);
            const lastAccountTransaction = precedingTransactions.findLast(txn => txn.accountId === accountId);
            if (lastAccountTransaction) {
                return this[_transactionAccountBalances][lastAccountTransaction.id];
            }
            else {
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
    categoryBalancesOnDate(date) {
        assert(date instanceof PDate);
        assert(date >= this.startDate);
        assert(date <= this.endDate);
        return Immutable.Map().withMutations(map => {
            for (let txn of this.transactions.values()) {
                if (txn.date > date) {
                    break;
                }
                txn.detail.forEach(d => map.set(d.categoryId, map.get(d.categoryId, 0) + d.amount));
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
    categoryBalanceByDate(categoryId, date) {
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
    categoryBudgetsOnDate(date) {
        let transactionCategoryBalances = null;
        assert(date instanceof PDate);
        assert(date >= this.startDate);
        assert(date <= this.endDate);
        return Immutable.Map().withMutations(map => {
            for (let category of this.categories.values()) {
                let budgetAmount = 0;
                if (category.isAutomatic) {
                    if (transactionCategoryBalances === null) {
                        transactionCategoryBalances = this.categoryBalancesOnDate(date);
                    }
                    budgetAmount = transactionCategoryBalances.get(category.id, 0);
                }
                else {
                    category.rules.forEach(rule => {
                        budgetAmount += rule.amount * rule.countOccurrencesBetween(this.startDate, date);
                    });
                }
                map.set(category.id, budgetAmount);
            }
        });
    }
    toJS() {
        let result = super.toJS();
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
        result.version = { major: majorVersion, minor: minorVersion };
        return result;
    }
    /**
     * Convert from a JSON-friendly native JavaScript object (or JSON) to a Budget instance.
     * @param {Object} obj - JSON or JavaScript serialized representation of an instance of this Budget.
     * @returns {Object} - New instance of this Budget.
     */
    static fromJS(obj) {
        // The JS serialization won't be typed, but the constructor expects types like Catgory, Transaction, etc:
        const values = Object.assign({}, obj);
        for (let dateField of ['startDate', 'endDate']) {
            if (values[dateField] !== null) {
                assertIsNumber(values[dateField]);
                values[dateField] = new PDate(values[dateField]);
            }
        }
        const typedLists = [
            { key: "accounts", type: Account },
            { key: "categories", type: Category },
            { key: "categoryGroups", type: CategoryGroup },
            { key: "transactions", type: Transaction },
        ];
        for (let { key, type } of typedLists) {
            values[key] = values[key].map(entry => type.fromJS(entry));
        }
        return new this(values);
    }
    static transactionSorter(transaction) {
        return (+transaction.date || 999999); // Sort 'null' dates after the highest date
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
function _createOrderedCategoryMap(categories, categoryGroups) {
    const categoryGroupIdsOrdered = categoryGroups.keySeq();
    return new Immutable.OrderedMap(Immutable.Seq.Indexed(categories).sortBy(category => categoryGroupIdsOrdered.keyOf(category.groupId)).map(c => [c.id, c]));
}
//# sourceMappingURL=budget.js.map