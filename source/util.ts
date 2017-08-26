import * as Immutable from 'immutable';
import {Budget} from './budget'; // for type definition only

/**
 * A useful type for accepting any iterable into a PRecord constructor
 */
export interface MappableIterable {
    map<T>(mapper: ((v: any) => T)): T[]|Immutable.Iterable<number, T>;
}

/**
 * Throw an error if the given condition is ever false.
 *
 * @param {boolean} cond - Condition that is expected to be true
 * @param {string} [msg] - Message to display if this assertion fails
 */
export function assert(cond: boolean, msg?: string) {
    if (!cond) {
        throw Error(msg || "Assertion Failed");
    }
}

/**
 * Throw an error if the given value is not a number
 *
 * @param {*} v - Value that is expected to be a Number
 */
export function assertIsNumber(v: number) {
    assert(typeof v === "number" && !Number.isNaN(v), "Expected a number.");
}

/**
 * Throw an error if the given value is not a positive integer, or null
 *
 * @param {*} v - Value that is expected to be a positive integer or null
 */
export function assertPositiveIntegerOrNull(v: number|null) {
    assert(
        v === null || (typeof v === "number" && parseInt(v.toString(), 10) === v && v > 0),
        "Expected a positive integer, or null."
    );
}

export const enum ValidationType {
    Error = 'error',
    Warning = 'warning',
}
export interface ValidationMessage {
    type: ValidationType;
    message: string;
    field: string|null;
}
/**
 * ValidationResult: Used with PRecord to provide detailed, flexible,
 * contextual validation of model data.
 */
export class ValidationResult {
    private __validationMessages: ValidationMessage[] = [];
    public static Warning = ValidationType.Warning;
    public static Error = ValidationType.Error;

    public get warnings() {
        return this.__validationMessages.filter(msg => msg.type === ValidationType.Warning);
    }

    public get errors() {
        return this.__validationMessages.filter(msg => msg.type === ValidationType.Error);
    }

    public getFieldIssues(fieldName: string|null) {
        return this.__validationMessages.filter(msg => msg.field === fieldName);
    }

    /**
     * Get an array of all validation issues that are not specific to any one field.
     */
    public get overallIssues() {
        return this.getFieldIssues(null);
    }

    public get allIssues(): ReadonlyArray<ValidationMessage> {
        return Object.freeze(this.__validationMessages);
    }

    /** Internal method for use by ValidationContext only. */
    public _pushMessage(type: ValidationType, message: string, field: string | null) {
        this.__validationMessages.push(Object.freeze({field, type, message}));
    }
}

/**
 * Context during which PRecord validation happens.
 * This contains a reference to the budget that the PRecord in question
 * will become part of.
 */
export class ValidationContext {
    public readonly budget: Budget;
    private validationResult = new ValidationResult();

    constructor(budget: Budget) {
        this.budget = budget;
    }

    /**
     * Add a warning to the validation result.
     *
     * @param {string|null} field - The field that this warning is about,
     * or null for warnings that involve multiple fields.
     * @param {*} message - A string describing the validation issue.
     */
    public addWarning(field: string|null, message: string) {
        this.validationResult._pushMessage(ValidationType.Warning, message, field);
    }

    /**
     * Add an error to the validation result.
     *
     * @param {string|null} field - The field that this error is about,
     * or null for warnings that involve multiple fields.
     * @param {*} message - A string describing the validation issue.
     */
    public addError(field: string|null, message: string) {
        this.validationResult._pushMessage(ValidationType.Error, message, field);
    }

    public get result() { return Object.freeze(this.validationResult); }
}

export {PRecord} from './precord';

// i18n placeholders:
/**
 * Replace the given English text with a localized version.
 * This is currently just a placeholder.
 *
 * @param {string} str - The text to localize
 * @returns {string} The localized text.
 */
export function __(str: string) { return str; }
