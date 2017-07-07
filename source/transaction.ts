import * as Immutable from 'immutable';
import {Account} from './account';
import {Category} from './category';
import {default as PDate} from './pdate';
import {__, assert, assertIsNumber, assertPositiveIntegerOrNull, MappableIterable, PRecord, ValidationContext} from './util';

export class TransactionDetail extends PRecord({ // TODO: change to plain Immutable.Record w/ Immutable v4
    amount: 0.0,
    description: "",
    categoryId: null as number|null,
}) {}

interface TransactionValues {
    id?: number|null;
    date?: PDate|null;
    accountId?: number|null;
    who?: string;
    detail?: MappableIterable;
    userId?: number|null;
    pending?: boolean;
    isTransfer: boolean;
    metadata: Immutable.Map<string, any>;
}
interface CleanTransactionValues {
    detail?: Immutable.List<TransactionDetail>;
}

/**
 * Transaction: Represents a change in the balance of an account.
 * Has an amount, who (who the money went to / came from), description,
 * category, and more.
 * e.g. '$20 from Chequing account went to SomeCo Inc. to buy a Widget'
 * Can be split - e.g. 'Sent $17 to Tom - $10 for gas and $7 for coffee'
 */
export class Transaction extends PRecord({
    id: null as number|null,
    date: null as PDate|null,
    accountId: null as number|null,
    who: "",
    /**
     * detail: The amount, description, and category of this transaction.
     * Usually a single-item list except for split transactions.
     */
    detail: Immutable.List.of(new TransactionDetail()),
    userId: null,
    /**
     * pending transactions affect the budget if their date is today or past.
     * If their day is in the future, they don't.
     * pending transactions never affect the account balances.
     */
    pending: true,
    /**
     * isTransfer:
     * Transfers between accounts (especially of different currencies) require special treatment.
     *
     * A typical transfer from e.g. "Chequing to Savings" would be represented as two transactions:
     * One transaction with a negative amount and its accountId set to the chequing account, and
     * one transaction with a positive amount and its accountId set to the savings account.
     *
     * This approach allows Prophecy to model complex transfers, e.g. where the money arrives
     * in the destination account on a different day than it was sent from the first account
     * (very common with e.g. credit card payments), or where the two accounts have different
     * currencies.
     *
     * Transfer transactions must not have a budget category assigned, because they are not an expense
     * nor income.
     *
     * In a single-currency budget, the sum of all transfer transactions should be zero.
     * In a multi-currency budget, the sum of all transfer transactions may not be zero,
     * even when converted to the same currency, because of losses due to currency conversion.
     */
    isTransfer: false,
    /* Arbitrary data defined by the user */
    metadata: Immutable.Map<string, any>(),
}) {
    private _cachedAmount: number|undefined;

    constructor(values: TransactionValues) {
        super(Transaction.cleanArgs(values));
    }

    /** Assertions to help enforce correct usage. */
    _checkInvariants() {
        assertPositiveIntegerOrNull(this.id);
        assert(this.date === null || this.date instanceof PDate);
        assertPositiveIntegerOrNull(this.accountId);
        assert(this.detail instanceof Immutable.List);
        assert(this.detail.size > 0);
        this.detail.forEach(entry => {
            if (!(entry instanceof TransactionDetail)) {
                throw new Error('transaction .detail must be TransactionDetail instances');
            }
            assertIsNumber(entry.amount);
            assert(typeof entry.description === 'string');
            assertPositiveIntegerOrNull(entry.categoryId);
            if (this.isTransfer) {
                assert(entry.categoryId === null, "Do not set a category for transfer transactions.");
            }
        });
        assert(this.metadata instanceof Immutable.Map);
    }

    _validate(context: ValidationContext) {
        let account: Account|null = null;
        if (this.accountId !== null) {
            // An accountID is set - is it valid?
            const accounts: Immutable.OrderedMap<number, Account> = context.budget.accounts as Immutable.OrderedMap<number, Account>; // TODO remove type, 'as'
            account = accounts.get(this.accountId);
            if (!account) {
                context.addError('accountId', "Invalid account.");
            }
        } else {
            // The accountId is null - is that OK?
            if (this.amount === 0 || this.pending) {
                // Yes, that's fine. If the amount is $0 or the transaction is pending, the account does not matter.
            } else {
                context.addWarning('accountId', __("Set the account of this transaction."));
            }
        }
        this.detail.forEach(detail => {
            if (detail === undefined) {
                throw new Error('Unexpectedly undefined detail entry.');
            }
            if (detail.categoryId !== null) {
                const categories: Immutable.OrderedMap<number, Category> = context.budget.categories as Immutable.OrderedMap<number, Category>; // TODO: remove 'as', type
                const category: Category|null = categories.get(detail.categoryId) || null;
                if (category) {
                    if (account) {
                        // Check that the account's currency matches the category's currency
                        if (account.currencyCode !== category.currencyCode) {
                            context.addError('detail', "A Transaction's category's currency must match its account currency.");
                        }
                    }
                } else {
                    context.addError('detail', "Invalid category.");
                }
            } else {
                // No category is set - is that OK?
                if (this.amount === 0 || this.pending || this.isTransfer) {
                    // Yes, that's fine.
                } else {
                    context.addWarning('detail', __("This transaction is missing a category."));
                }
            }
        });
    }

    /** Is this a split transaction? */
    get isSplit() { return this.detail.size > 1; }

    /** Get the sum of the amounts of the 'detail' entries */
    get amount() {
        if (this._cachedAmount === undefined) {
            this._cachedAmount = this.detail.reduce((acc, detailEntry) => (acc as number) + (detailEntry as TransactionDetail).amount, 0);
        }
        return this._cachedAmount;
    }

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
    static cleanArgs(values: TransactionValues) {
        values = Object.assign({}, values); // Don't modify the parameter; create a copy
        if (typeof values.date === 'number') {
            values.date = new PDate(values.date);
        } else {
            assert(values.date === null || values.date === undefined || values.date instanceof PDate, 'invalid date value');
        }
        if (values.detail !== undefined) {
            // 'detail' can be any iterable with TransactionDetail-typed values or
            // objects used to initialize TransactionDetail
            values.detail = Immutable.List(values.detail.map(
                d => d instanceof TransactionDetail ? d : new TransactionDetail(d)
            ));
        }
        if ('metadata' in values && !(values.metadata instanceof Immutable.Map)) {
            values.metadata = Immutable.fromJS(values.metadata);
        }
        return values as CleanTransactionValues;
    }

}
