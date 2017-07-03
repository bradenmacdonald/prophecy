import * as Immutable from 'immutable';
import { default as PDate } from './pdate';
import { assert, assertIsNumber, assertPositiveIntegerOrNull, PRecord, __ } from './util';
export const TransactionDetail = Immutable.Record({
    amount: 0.0,
    description: "",
    categoryId: null,
});
const M_AMOUNT = Symbol("amount");
/**
 * Transaction: Represents a change in the balance of an account.
 * Has an amount, who (who the money went to / came from), description,
 * category, and more.
 * e.g. '$20 from Chequing account went to SomeCo Inc. to buy a Widget'
 * Can be split - e.g. 'Sent $17 to Tom - $10 for gas and $7 for coffee'
 */
export class Transaction extends PRecord({
    id: null,
    date: null,
    accountId: null,
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
     **/
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
    metadata: Immutable.Map(),
}) {
    constructor(values) {
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
            assert(entry instanceof TransactionDetail);
            assertIsNumber(entry.amount);
            assert(typeof entry.description === 'string');
            assertPositiveIntegerOrNull(entry.categoryId);
        });
        assert(this.metadata instanceof Immutable.Map);
        if (this.isTransfer) {
            this.detail.forEach(entry => assert(entry.categoryId === null, "Do not set a category for transfer transactions."));
        }
    }
    _validate(context) {
        let account = null;
        if (this.accountId !== null) {
            // An accountID is set - is it valid?
            account = context.budget.accounts.get(this.accountId);
            if (!account) {
                context.addError("Invalid account.");
            }
        }
        else {
            // The accountId is null - is that OK?
            if (this.amount === 0 || this.pending) {
                // Yes, that's fine. If the amount is $0 or the transaction is pending, the account does not matter.
            }
            else {
                context.addWarning(__("Set the account of this transaction."));
            }
        }
        this.detail.forEach(detail => {
            if (detail.categoryId !== null) {
                const category = context.budget.categories.get(detail.categoryId, null);
                if (category) {
                    if (account) {
                        // Check that the account's currency matches the category's currency
                        if (account.currencyCode !== category.currencyCode) {
                            context.addError("A Transaction's category's currency must match its account currency.");
                        }
                    }
                }
                else {
                    context.addError("Invalid category.");
                }
            }
            else {
                // No category is set - is that OK?
                if (this.amount === 0 || this.pending || this.isTransfer) {
                    // Yes, that's fine.
                }
                else {
                    context.addWarning(__("This transaction is missing a category."));
                }
            }
        });
    }
    /** Is this a split transaction? */
    get isSplit() { return this.detail.size > 1; }
    /** Get the sum of the amounts of the 'detail' entries */
    get amount() {
        if (this[M_AMOUNT] === undefined) {
            this[M_AMOUNT] = this.detail.reduce((acc, detailEntry) => acc + detailEntry.amount, 0);
        }
        return this[M_AMOUNT];
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
    static cleanArgs(values) {
        values = Object.assign({}, values); // Don't modify the parameter; create a copy
        if ('date' in values && values.date !== null && !(values.date instanceof PDate)) {
            values.date = new PDate(values.date);
        }
        if ('detail' in values) {
            // 'detail' can be any iterable with TransactionDetail-typed values or
            // objects used to initialize TransactionDetail
            values.detail = new Immutable.List(values.detail.map(d => d instanceof TransactionDetail ? d : new TransactionDetail(d)));
        }
        if ('metadata' in values && !(values.metadata instanceof Immutable.Map)) {
            values.metadata = Immutable.fromJS(values.metadata);
        }
        return values;
    }
}
//# sourceMappingURL=transaction.js.map