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
    assert(v === null || (typeof v === "number" && parseInt(v.toString(), 10) === v && v > 0), "Expected a positive integer, or null.");
}
/**
 * ValidationResult: Used with PRecord to provide detailed, flexible,
 * contextual validation of model data.
 */
export class ValidationResult {
    constructor() {
        this.__validationMessages = [];
    }
    get warnings() {
        return this.__validationMessages.filter(msg => msg.type === "warning" /* Warning */);
    }
    get errors() {
        return this.__validationMessages.filter(msg => msg.type === "error" /* Error */);
    }
    getFieldIssues(fieldName) {
        return this.__validationMessages.filter(msg => msg.field === fieldName);
    }
    /**
     * Get an array of all validation issues that are not specific to any one field.
     */
    get overallIssues() {
        return this.getFieldIssues(null);
    }
    get allIssues() {
        return Object.freeze(this.__validationMessages);
    }
    /** Internal method for use by ValidationContext only. */
    _pushMessage(type, message, field) {
        this.__validationMessages.push(Object.freeze({ field, type, message }));
    }
}
ValidationResult.Warning = "warning" /* Warning */;
ValidationResult.Error = "error" /* Error */;
/**
 * Context during which PRecord validation happens.
 * This contains a reference to the budget that the PRecord in question
 * will become part of.
 */
export class ValidationContext {
    constructor(budget) {
        this.validationResult = new ValidationResult();
        this.budget = budget;
    }
    /**
     * Add a warning to the validation result.
     *
     * @param {string|null} field - The field that this warning is about,
     * or null for warnings that involve multiple fields.
     * @param {*} message - A string describing the validation issue.
     */
    addWarning(field, message) {
        this.validationResult._pushMessage("warning" /* Warning */, message, field);
    }
    /**
     * Add an error to the validation result.
     *
     * @param {string|null} field - The field that this error is about,
     * or null for warnings that involve multiple fields.
     * @param {*} message - A string describing the validation issue.
     */
    addError(field, message) {
        this.validationResult._pushMessage("error" /* Error */, message, field);
    }
    get result() { return Object.freeze(this.validationResult); }
}
export { PRecord } from './precord';
// i18n placeholders:
/**
 * Replace the given English text with a localized version.
 * This is currently just a placeholder.
 *
 * @param {string} str - The text to localize
 * @returns {string} The localized text.
 */
export function __(str) { return str; }
//# sourceMappingURL=util.js.map