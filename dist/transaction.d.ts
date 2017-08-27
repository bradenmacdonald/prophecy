import * as Immutable from 'immutable';
import { default as PDate } from './pdate';
import { TypedRecordClass } from './precord';
import { MappableIterable, ValidationContext } from './util';
declare const TransactionDetail_base: TypedRecordClass<{
    amount: number;
    description: string;
    categoryId: number | null;
}>;
export declare class TransactionDetail extends TransactionDetail_base {
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
}
declare const Transaction_base: TypedRecordClass<{
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
export declare class Transaction extends Transaction_base {
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
