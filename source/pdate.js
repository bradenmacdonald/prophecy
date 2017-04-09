import {assert, assertIsNumber} from './util';

const MONTHS = Object.freeze({
    JAN: 0,
    FEB: 1,
    MAR: 2,
    APR: 3,
    MAY: 4,
    JUN: 5,
    JUL: 6,
    AUG: 7,
    SEP: 8,
    OCT: 9,
    NOV: 10,
    DEC: 11,
});

const DAYS = Object.freeze({
    SUN: 0,
    MON: 1,
    TUE: 2,
    WED: 3,
    THU: 4,
    FRI: 5,
    SAT: 6,
});

const MONTH_SUMS_NORMAL_YEAR = Object.freeze([0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]);
const MONTH_SUMS_LEAP_YEAR = Object.freeze([0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335]);

// The following maps convert from day of the year (e.g. 0 for Jan. 1) to month ('A' = Jan, 'B' = Feb, ...)
// These maps are precomputed to make the date class highly efficient.
const NORMAL_YEAR = (
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBBBBBBBBBBBBBBBBBBBBBBBBBBBCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC" +
    "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF" +
    "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHIIIIIIIIIIIIIIIIIIIIIIIIIIIIII" +
    "JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL"
);
const LEAP_YEAR = (
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBBBBBBBBBBBBBBBBBBBBBBBBBBBBCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC" +
    "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF" +
    "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHIIIIIIIIIIIIIIIIIIIIIIIIIIIIII" +
    "JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL"
);

const DAYS_PER_MONTH = Object.freeze([
    /* Jan */ 31,    undefined, /* Mar */ 31, /* Apr */ 30, /* May */ 31, /* Jun */ 30,
    /* Jul */ 31, /* Aug */ 31, /* Sep */ 30, /* Oct */ 31, /* Nov */ 30, /* Dec */ 31
]);

/** 
 * Internal helper method.
 * Given a year, month, and day triplet, return
 * the number of days between January 1, 2000 and the given date.
 *
 * @param {number} year - Year (e.g. 2012)
 * @param {number} month - Month (0 for January, 11 for December)
 * @param {number} day - Day (1-31)
 * @returns {number}
 */
function triplet_to_days_value(year, month, day) {
    assert(year >= 2000 && year <= 3000, "Year is invalid - must be between 2000 and 3000.");
    assert(month >= MONTHS.JAN && month <= MONTHS.DEC, "Month is invalid.");
    assert(day > 0 && day <= PDate.daysInMonth(year, month));
    const nyear = (year - 2000|0);
    let days_value = (nyear*365) + ((nyear + 3)/4|0) - ((nyear+99)/100|0) + ((nyear + 399)/400|0);
    // Compute the number of days between the first day of the year and the first day of the month:
    days_value += PDate.isLeapYear(year) ? MONTH_SUMS_LEAP_YEAR[month] : MONTH_SUMS_NORMAL_YEAR[month];
    days_value += day - 1;
    return days_value;
}

// Symbol used for almost-private access to the value inside PDate objects.
const days_value_key = Symbol("value");

export default class PDate {
    /**
     * Construct a Date from a triple of year, month (0-11), day (1-31)
     * @param {number} year - Year (e.g. 2012)
     * @param {number} month - Month (0 for January, 11 for December)
     * @param {number} day - Day (1-31)
     * @returns {PDate}
     */
    static create(year, month, day) {
        return new PDate(triplet_to_days_value(year, month, day));
    }
    /**
     * Construct a Date from an ISO 8601 date string "YYYY-MM-DD" or "YYYYMMDD"
     * @param {string} str - An ISO 8601 date string
     * @returns {PDate}
     */
    static fromString(str) {
        const year = parseInt(str.substr(0, 4));
        let month = NaN;
        let day = NaN;
        if (str.length === 10 && str.charAt(4) === '-' && str.charAt(7) === '-') {
            // YYYY-MM-DD format, presumably:
            month = parseInt(str.substr(5, 2));
            day = parseInt(str.substr(8, 2));
        } else if (str.length === 8 && String(parseInt(str)) === str) { // Without 'String(parseInt(str)) === str', '05/05/05' would pass this length test
            month = parseInt(str.substr(4, 2));
            day = parseInt(str.substr(6, 2));
        }
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
            throw "Date string not in YYYY-MM-DD or YYYYMMDD format";
        }
        return new PDate(triplet_to_days_value(year, month - 1, day));
    }
    /**
     * Parse a template string literal, e.g. const D = PDate.parseTemplateLiteral; const date1 = D`2016-01-01`;
     * @param {Object} strings Well-formed template call site object
     * @param {...*} keys - substitution values
     * @returns {PDate}
     */
    static parseTemplateLiteral(strings, ...keys) {
        return PDate.fromString(String.raw(strings, ...keys));
    }
    /**
     * Get the current date, according to the system's local time
     * @returns {PDate}
     */
    static today() {
        const js_date = new Date();
        return new PDate(triplet_to_days_value(js_date.getYear() + 1900, js_date.getMonth(), js_date.getDate()));
    }

    /**
     * Construct a PDate instance using its internal int representation (# of days since the millenium)
     * @param {Number} daysSinceMillenium - number representing the date
     */
    constructor(daysSinceMillenium) {
        assertIsNumber(daysSinceMillenium);
        assert(daysSinceMillenium >= 0);
        assert(daysSinceMillenium <= 365615); // Corresponds to Dec. 31, 3000
        // Store the daysSinceMillenium value into the private field that backs the .value property:
        this[days_value_key] = daysSinceMillenium;
        // Simpler, but far slower:
        // Object.defineProperty(this, "_days_value", {value: daysSinceMillenium, writable: false});
    }

    /**
     * Custom JSON serialization
     * @returns {number}
     */
    toJSON() { return this.value; }

    /**
     * Custom serialization when used with Immutable.js
     * @returns {number}
     */
    toJS() { return this.value; }

    /**
     * Get the year (2000-3000)
     * @returns {number}
     */
    get year() {
        // This formula is valid for any year 2000 or later
        const centuries = this[days_value_key] / 36525 | 0;
        return (2000 + (this.value + centuries - (centuries/4|0)) / 365.25) |0;
    }
    /**
     * Get the month (0-11)
     * @returns {number}
     */
    get month() {
        const nyear = this.year - 2000;
        // Compute the number of days between January 1, 2000 and the first day of the given year:
        const d = (nyear*365) + ((nyear + 3)/4|0) - ((nyear+99)/100|0) + ((nyear + 399)/400|0);
        const A = 'A'.charCodeAt(0);
        if (PDate.isLeapYear(nyear)) // Note: isLeapYear() works with an absolute year ('2015') or relative to 2000 ('15')
            return LEAP_YEAR.charCodeAt(this.value - d) - A;
        else
            return NORMAL_YEAR.charCodeAt(this.value - d) - A;
    }
    /**
     * Get the day of the month (1-31)
     * @returns {number}
     */
    get day() {
        return this.value - triplet_to_days_value(this.year, this.month, 1) + 1;
    }

    /** Get the day of the week (0 = Sunday, 6 = Saturday) */
    get dayOfWeek() { return (this.value + 6) % 7; }
    /** Get the day of the year (0-365) */
    get dayOfYear() { return this.value - triplet_to_days_value(this.year, 0, 1); }
    /** Get the internal date value (days since 2000-01-01) */
    get value() { return this[days_value_key]; }

    /**
     * Get the date as an ISO 8601 string ("2015-01-25")
     * @returns {string}
     */
    toString() {
        const year = this.year, month = this.month + 1, day = this.day;
        return year.toString() + (month < 10 ? "-0" : "-") + month + (day < 10 ? "-0" : "-") + day;
    }

    /**
     * Get the primitive value (enables correct sorting and comparison) 
     * Except note that equality checking won't work unless you coerce values
     * e.g. PDate.create(2010, 1, 1) == PDate.create(2010, 1, 1) : false
     * e.g. PDate.create(2010, 1, 1) == +PDate.create(2010, 1, 1) : true
     * @returns {number}
     */
    valueOf() { return this.value; }

    /**
     * Helper method: how many days are in the specified month of the specified year?
     * @param {number} year - Year
     * @param {number} month - Month (0-11)
     * @returns {number}
     */
    static daysInMonth(year, month) {
        assert(year >= 2000 && year <= 3000);
        assert(month >= MONTHS.JAN && month <= MONTHS.DEC, "Month is invalid.");
        if (month === MONTHS.FEB) {
            return PDate.isLeapYear(year) ? 29 : 28;
        }
        return DAYS_PER_MONTH[month];
    }
    /**
     * Is 'year' a leap year? Can be an absolute year (e.g. 2016) or relative to the millenium (e.g. 16).
     * @param {number} year - The year in question
     * @returns {boolean}
     */
    static isLeapYear(year) { year=year|0; return (year % 4 == 0) && (year % 100 != 0 || year % 400 == 0); }

    // Constants
    static get DAYS() { return DAYS; }
    static get MONTHS() { return MONTHS; }
}
