export default class PDate {
    /** The internal date value (days since 2000-01-01) */
    readonly value: number;
    /**
     * Construct a Date from a triple of year, month (0-11), day (1-31)
     * @param {number} year - Year (e.g. 2012)
     * @param {number} month - Month (0 for January, 11 for December)
     * @param {number} day - Day (1-31)
     * @returns {PDate}
     */
    static create(year: number, month: number, day: number): PDate;
    /**
     * Construct a Date from an ISO 8601 date string "YYYY-MM-DD" or "YYYYMMDD"
     * @param {string} str - An ISO 8601 date string
     * @returns {PDate}
     */
    static fromString(str: string): PDate;
    /**
     * Parse a template string literal, e.g. const D = PDate.parseTemplateLiteral; const date1 = D`2016-01-01`;
     * @param {Object} strings Well-formed template call site object
     * @param {...*} keys - substitution values
     * @returns {PDate}
     */
    static parseTemplateLiteral(strings: TemplateStringsArray, ...keys: any[]): PDate;
    /**
     * Get the current date, according to the system's local time
     * @returns {PDate}
     */
    static today(): PDate;
    /**
     * Construct a PDate instance using its internal int representation (# of days since the millenium)
     * @param {Number} daysSinceMillenium - number representing the date
     */
    constructor(daysSinceMillenium: number);
    /**
     * Custom JSON serialization
     * @returns {number}
     */
    toJSON(): number;
    /**
     * Custom serialization when used with Immutable.js
     * @returns {number}
     */
    toJS(): number;
    /**
     * Get the year (2000-3000)
     * @returns {number}
     */
    readonly year: number;
    /**
     * Get the month (0-11)
     * @returns {number}
     */
    readonly month: number;
    /**
     * Get the day of the month (1-31)
     * @returns {number}
     */
    readonly day: number;
    /** Get the day of the week (0 = Sunday, 6 = Saturday) */
    readonly dayOfWeek: number;
    /** Get the day of the year (0-365) */
    readonly dayOfYear: number;
    /**
     * Get the date as an ISO 8601 string ("2015-01-25")
     * @returns {string}
     */
    toString(): string;
    /**
     * Get the primitive value (enables correct sorting and comparison)
     * Except note that equality checking won't work unless you coerce values
     * e.g. PDate.create(2010, 1, 1) == PDate.create(2010, 1, 1) : false
     * e.g. PDate.create(2010, 1, 1) == +PDate.create(2010, 1, 1) : true
     * @returns {number}
     */
    valueOf(): number;
    /**
     * Helper method: how many days are in the specified month of the specified year?
     * @param {number} year - Year
     * @param {number} month - Month (0-11)
     * @returns {number}
     */
    static daysInMonth(year: number, month: number): number;
    /**
     * Is 'year' a leap year? Can be an absolute year (e.g. 2016) or relative to the millenium (e.g. 16).
     * @param {number} year - The year in question
     * @returns {boolean}
     */
    static isLeapYear(year: number): boolean;
    static readonly DAYS: Readonly<{
        SUN: number;
        MON: number;
        TUE: number;
        WED: number;
        THU: number;
        FRI: number;
        SAT: number;
    }>;
    static readonly MONTHS: Readonly<{
        JAN: number;
        FEB: number;
        MAR: number;
        APR: number;
        MAY: number;
        JUN: number;
        JUL: number;
        AUG: number;
        SEP: number;
        OCT: number;
        NOV: number;
        DEC: number;
    }>;
}
