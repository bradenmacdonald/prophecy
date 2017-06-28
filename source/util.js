import {default as Imm} from 'immutable';
export const Immutable = Imm;

/**
 * Throw an error if the given condition is ever false.
 *
 * @param {boolean} cond - Condition that is expected to be true
 * @param {string} [msg] - Message to display if this assertion fails
 */
export function assert(cond, msg) {
    if (!cond) {
        throw Error(msg || "Assertion Failed");
    }
}

/**
 * Throw an error if the given value is not a number
 *
 * @param {*} v - Value that is expected to be a Number
 */
export function assertIsNumber(v) {
    assert(typeof v === "number" && !Number.isNaN(v), "Expected a number.");
}

/**
 * Throw an error if the given value is not a positive integer, or null
 *
 * @param {*} v - Value that is expected to be a positive integer or null
 */
export function assertPositiveIntegerOrNull(v) {
    assert(
        v === null || (typeof v === "number" && parseInt(v) === v && v > 0),
        "Expected a positive integer, or null."
    );
}


const _validationMessages = Symbol();
const _validationResult = Symbol();
const _Error = Symbol('error');
const _Warning = Symbol('warning');
/**
 * ValidationResult: Used with PRecord to provide detailed, flexible,
 * contextual validation of model data.
 */
class ValidationResult {
    constructor() {
        this[_validationMessages] = [];
    }

    get warnings() {
        return this[_validationMessages].filter(msg => msg.type === _Warning);
    }

    get errors() {
        return this[_validationMessages].filter(msg => msg.type === _Error);
    }

    getFieldIssues(fieldName) {
        return this[_validationMessages].filter(msg => msg.field === fieldName);
    }

    /**
     * Get an array of all validation issues that are not specific to any one field.
     */
    get overallIssues() {
        return this.getFieldIssues(null);
    }

    get allIssues() {
        return Object.freeze(this[_validationMessages]);
    }
}
ValidationResult.Warning = _Warning;
ValidationResult.Error = _Error;

/**
 * Context during which PRecord validation happens.
 * This contains a reference to the budget that the PRecord in question
 * will become part of.
 */
class ValidationContext {
    constructor(budget) {
        this[_validationResult] = new ValidationResult();
        this.budget = budget;
    }

    _pushMessage(field, message, type) {
        assert(type === _Warning || type === _Error);
        assert(field === null || typeof field === 'string');
        this[_validationResult][_validationMessages].push(Object.freeze({field, type, message}));
    }

    /**
     * Add a warning to the validation result.
     * 
     * @param {string|null} field - The field that this warning is about,
     * or null for warnings that involve multiple fields.
     * @param {*} message - A string describing the validation issue.
     */
    addWarning(field, message) {
        this._pushMessage(field, message, _Warning);
    }

    /**
     * Add an error to the validation result.
     * 
     * @param {string|null} field - The field that this error is about,
     * or null for warnings that involve multiple fields.
     * @param {*} message - A string describing the validation issue.
     */
    addError(field, message) {
        this._pushMessage(field, message, _Error);
    }

    get result() { return Object.freeze(this[_validationResult]); }
}



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
export const PRecord = defaultValues => class extends Immutable.Record(defaultValues) {
    constructor(values) {
        super(values);
        this._skipChecks = false;
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

// i18n placeholders:
/**
 * Replace the given English text with a localized version.
 * This is currently just a placeholder.
 *
 * @param {string} str - The text to localize
 * @returns {string} The localized text.
 */
export function __(str) { return str; }
