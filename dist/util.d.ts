import * as Immutable from 'immutable';
import { Budget } from './budget';
/**
 * A useful type for accepting any iterable into a PRecord constructor
 */
export interface MappableIterable {
    map<T>(mapper: ((v: any) => T)): T[] | Immutable.Iterable<number, T>;
}
/**
 * Throw an error if the given condition is ever false.
 *
 * @param {boolean} cond - Condition that is expected to be true
 * @param {string} [msg] - Message to display if this assertion fails
 */
export declare function assert(cond: boolean, msg?: string): void;
/**
 * Throw an error if the given value is not a number
 *
 * @param {*} v - Value that is expected to be a Number
 */
export declare function assertIsNumber(v: number): void;
/**
 * Throw an error if the given value is not a positive integer, or null
 *
 * @param {*} v - Value that is expected to be a positive integer or null
 */
export declare function assertPositiveIntegerOrNull(v: number | null): void;
export declare const enum ValidationType {
    Error = "error",
    Warning = "warning",
}
export interface ValidationMessage {
    type: ValidationType;
    message: string;
    field: string | null;
}
/**
 * ValidationResult: Used with PRecord to provide detailed, flexible,
 * contextual validation of model data.
 */
export declare class ValidationResult {
    /**@internal */
    __validationMessages: ValidationMessage[];
    static Warning: ValidationType;
    static Error: ValidationType;
    readonly warnings: ValidationMessage[];
    readonly errors: ValidationMessage[];
    getFieldIssues(fieldName: string | null): ValidationMessage[];
    /**
     * Get an array of all validation issues that are not specific to any one field.
     */
    readonly overallIssues: ValidationMessage[];
    readonly allIssues: ReadonlyArray<ValidationMessage>;
}
/**
 * Context during which PRecord validation happens.
 * This contains a reference to the budget that the PRecord in question
 * will become part of.
 */
export declare class ValidationContext {
    readonly budget: Budget;
    private validationResult;
    constructor(budget: Budget);
    _pushMessage(type: ValidationType, message: string, field: string | null): void;
    /**
     * Add a warning to the validation result.
     *
     * @param {string|null} field - The field that this warning is about,
     * or null for warnings that involve multiple fields.
     * @param {*} message - A string describing the validation issue.
     */
    addWarning(field: string | null, message: string): void;
    /**
     * Add an error to the validation result.
     *
     * @param {string|null} field - The field that this error is about,
     * or null for warnings that involve multiple fields.
     * @param {*} message - A string describing the validation issue.
     */
    addError(field: string | null, message: string): void;
    readonly result: Readonly<ValidationResult>;
}
export { PRecord } from './precord';
/**
 * Replace the given English text with a localized version.
 * This is currently just a placeholder.
 *
 * @param {string} str - The text to localize
 * @returns {string} The localized text.
 */
export declare function __(str: string): string;
