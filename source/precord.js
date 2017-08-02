import Immutable from 'immutable';
import {ValidationContext} from './util';



// This file is kept in JavaScript until Immutable 4+ is out, as it seems this
// is the simplest way to get TypeScript to create fully typed PRecord classes.



/**
 * PRecord: Immutable.Record with a bit of extra functionality
 *
 * Has a _checkInvariants method which can be used to check invariants
 * whenever a new Record is created.
 *
 * Has detailed validation and error/warning reporting functionality.
 *
 * @param {Object} defaultValues - Definition of the fields that this PRecord will have
 * @returns {*} - A class that can be extended to create a new PRecord subclass
 */
export const PRecord = (defaultValues) => class extends Immutable.Record(defaultValues) {
    _skipChecks = false;
    constructor(values) {
        super(values);
        this._checkInvariants();
    }
    /**
     * Add some safety checks to the inherited 'set()' method, since it creates
     * Record objects without using the constructor
     * @param {string} k - Key to set
     * @param {*} v - Value to set
     * @returns {Object} - New instance of this Record subclass with the given changes.
     */
    set(k, v) {
        const result = super.set(k, v);
        if (!this._skipChecks) {
            result._checkInvariants();
        }
        return result;
    }
    /**
     * Add some safety checks to the inherited 'withMutations()' method, since it creates
     * Record objects without using the constructor
     * 
     * Here we only do one check after any and all changes are applied. This lets
     * many changes be made at once, and _checkInvariants only runs once.
     * 
     * @param {function} fn - Mutator function
     * @returns {Object} - New instance of this Record subclass with the given changes.
     */
    withMutations(fn) {
        return super.withMutations(newRecord => {
            newRecord._skipChecks = true;
            fn(newRecord);
            newRecord._skipChecks = false;
            newRecord._checkInvariants();
        });
    }
    /**
     * Assertions to help enforce correct usage.
     * 
     * These invariants should include things like type checks, but
     * should be somewhat tolerant of incomplete or inconsistent
     * information - that way, PRecord subclasses can still be used
     * to hold the data for a form as the user fills it out in the UI,
     * for example.
     * 
     * More final and contextual validation should take place in
     * _validate().
     **/
    _checkInvariants() {}

    /**
     * Validate this record.
     * @param {ValidationContext} context - the ValidationContext that specifies the
     * budget that this record will become part of, and provides a place to store the
     * result.
     */
    _validate(context) {}  // eslint-disable-line no-unused-vars

    /**
     * Validate this PRecord subclass.
     * Returns an instance of ValidationResult.
     * 
     * @param {Budget} budget - the Prophecy Budget that this record will be part of.
     * @returns {ValidationResult}
     */
    validateForBudget(budget) {
        const context = new ValidationContext(budget);
        this._validate(context);
        return context.result;
    }

    /**
     * Validate this record and throw an exception if any errors are found.
     * @param {Budget} budget - the Prophecy Budget that this record will be part of.
     */
    assertIsValidForBudget(budget) {
        const validationResult = this.validateForBudget(budget);
        if (validationResult.errors.length > 0) {
            let message = `${this.constructor.name} validation failed:\n`;
            validationResult.errors.forEach(err => message += ` * ${err.message} (${err.field})\n`);
            throw Error(message);
        }
    }

    /**
     * Convert from a JSON-friendly native JavaScript object to this PRecord type.
     * @param {Object} obj - JavaScript serialized representation of an instance of this Record subclass.
     * @returns {Object} - New instance of this PRecord subclass.
     */
    static fromJS(obj) {
        return new this(obj);
    }

    /**
     * Make toJSON an alias of toJS, so PRecord works with JSON.stringify()
     *
     * @returns {Object} - JSON-serialized version of this PRecord subclass.
     */
    toJSON() { return this.toJS(); }
}
