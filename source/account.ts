import * as Immutable from 'immutable';
import {Currency, SUPPORTED_CURRENCIES} from './currency';
import {assert, assertIsNumber, PRecord} from './util';
import {TypedRecordClass} from './precord'; // Todo: remove this import once we can upgrade to Immutable.js 4+

export interface AccountArguments {
    id?: number|null|undefined;
    name?: string;
    initialBalance?: number;
    currencyCode?: string;
    metadata?: Immutable.Map<string, any>;
}

/**
 * Account: Represents a bank account, credit card, or a concept like "Cash"
 */
export class Account extends PRecord({
    id: null as number|null,
    name: "",
    initialBalance: 0,
    /** the ISO 4217 currency code */
    currencyCode: "USD",
    /* Arbitrary data defined by the user */
    metadata: Immutable.Map<string, any>(),
}) {
    constructor(values: AccountArguments) {
        super(Account.cleanArgs(values));
    }

    /** Assertions to help enforce correct usage. */
    _checkInvariants() {
        assert(this.currency instanceof Currency); // Check that currencyCode is valid.
        assertIsNumber(this.initialBalance);
        assert(Immutable.Map.isMap(this.metadata));
    }

    /** Get the currency of this account. */
    get currency() { return SUPPORTED_CURRENCIES[this.currencyCode]; }

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
    static cleanArgs(values: AccountArguments) {
        values = Object.assign({}, values); // Don't modify the parameter; create a copy
        if ('metadata' in values && !Immutable.Map.isMap(values.metadata)) {
            values.metadata = Immutable.fromJS(values.metadata);
        }
        return values;
    }
}
