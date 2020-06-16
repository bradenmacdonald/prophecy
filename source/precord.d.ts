import * as Immutable from 'immutable';
import {Budget} from './budget';
import {ValidationResult} from './util';

/**
 * TypedRecord: Adds types to Immutable.Record - needed only until Immutable.js 4+
 */

export interface TypedRecordClass<T extends Object> {
    (values?: Partial<T> | Iterable<[string, any]>): TypedRecordInstance<T> & Readonly<T>;
    new (values?: Partial<T> | Iterable<[string, any]>): TypedRecordInstance<T> & Readonly<T>;

    // And PRecord-specific extensions:
    fromJS(obj: any): T;
}

interface TypedRecordInstance<T extends Object> {

    // Reading values

    has(key: string|number|symbol): key is keyof T;
    get<K extends keyof T>(key: K): T[K];

    // Reading deep values

    hasIn(keyPath: Iterable<any>): boolean;
    getIn(keyPath: Iterable<any>): any;

    // Value equality

    equals(other: any): boolean;
    hashCode(): number;

    // Persistent changes

    set<K extends keyof T>(key: K, value: T[K]): this;
    update<K extends keyof T>(key: K, updater: (value: T[K]) => T[K]): this;
    merge(...collections: Array<Partial<T> | Iterable<[string, any]>>): this;
    mergeDeep(...collections: Array<Partial<T> | Iterable<[string, any]>>): this;

    mergeWith(
    merger: (oldVal: any, newVal: any, key: keyof T) => any,
    ...collections: Array<Partial<T> | Iterable<[string, any]>>
    ): this;
    mergeDeepWith(
    merger: (oldVal: any, newVal: any, key: any) => any,
    ...collections: Array<Partial<T> | Iterable<[string, any]>>
    ): this;

    /**
     * Returns a new instance of this Record type with the value for the
     * specific key set to its default value.
     *
     * @alias remove
     */
    delete<K extends keyof T>(key: K): this;
    remove<K extends keyof T>(key: K): this;

    /**
     * Returns a new instance of this Record type with all values set
     * to their default values.
     */
    clear(): this;

    // Deep persistent changes

    setIn(keyPath: Iterable<any>, value: any): this;
    updateIn(keyPath: Iterable<any>, updater: (value: any) => any): this;
    mergeIn(keyPath: Iterable<any>, ...collections: Array<any>): this;
    mergeDeepIn(keyPath: Iterable<any>, ...collections: Array<any>): this;

    /**
     * @alias removeIn
     */
    deleteIn(keyPath: Iterable<any>): this;
    removeIn(keyPath: Iterable<any>): this;

    // Conversion to JavaScript types

    /**
     * Deeply converts this Record to equivalent native JavaScript Object.
     */
    toJS(): { [K in keyof T]: any };

    /**
     * Shallowly converts this Record to equivalent native JavaScript Object.
     */
    toJSON(): T;

    /**
     * Shallowly converts this Record to equivalent JavaScript Object.
     */
    toObject(): T;

    // Transient changes

    /**
     * Note: Not all methods can be used on a mutable collection or within
     * `withMutations`! Only `set` may be used mutatively.
     *
     * @see `Map#withMutations`
     */
    withMutations(mutator: (mutable: this) => any): this;

    /**
     * @see `Map#asMutable`
     */
    asMutable(): this;

    /**
     * @see `Map#asImmutable`
     */
    asImmutable(): this;

    // Sequence algorithms

    toSeq(): Immutable.Seq.Keyed<keyof T, T[keyof T]>;

    [Symbol.iterator](): IterableIterator<[keyof T, T[keyof T]]>;


    // PRecord-specific methods below:
    /**
     * Validate this PRecord subclass.
     * Returns an instance of ValidationResult.
     * 
     * @param {Budget} budget - the Prophecy Budget that this record will be part of.
     * @returns {ValidationResult}
     */
    validateForBudget(budget: Budget): ValidationResult;

    /**
     * Validate this record and throw an exception if any errors are found.
     * @param {Budget} budget - the Prophecy Budget that this record will be part of.
     */
    assertIsValidForBudget(budget: Budget): void;
}

export declare function PRecord<T>(defaultValues: T, name?: string): TypedRecordClass<T>;
