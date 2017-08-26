import * as Immutable from 'immutable';
import { Currency } from './currency';
import { TypedRecordClass } from './precord';
export interface AccountValues {
    id?: number | null | undefined;
    name?: string;
    initialBalance?: number;
    currencyCode?: string;
    metadata?: Immutable.Map<string, any>;
}
declare const Account_base: TypedRecordClass<{
    id: number | null;
    name: string;
    initialBalance: number;
    currencyCode: string;
    metadata: Immutable.Map<string, any>;
}>;
/**
 * Account: Represents a bank account, credit card, or a concept like "Cash"
 */
export declare class Account extends Account_base {
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
