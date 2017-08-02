/** Class that describes a real-world currency. */
export declare class Currency {
    /**
     * Get the ISO 4217 currency code (uniquely identifies this currency)
     * @return {string} The ISO 4217 currency code.
     */
    readonly code: string;
    readonly name: string;
    readonly symbols: string[];
    readonly decimals: number;
    /**
     * Create a currency description.
     * @param {string} code - the ISO 4217 currency code (three characters)
     * @param {string} name - the full name of the currency ("Canadian Dollar")
     * @param {string[]} symbols - the symbols for this currency in order from most to least
     *                           ambiguous (e.g. ["$", "CA$"])
     * @param {number} decimals - The maximum number of decimal places that this currency can
     *                            support (e.g. '2' means $0.01 is the smallest amount.)
     */
    constructor(code: string, name: string, symbols: string[], decimals?: number);
    /**
     * Round a given amount of this currency to the minimum supported value.
     * For dollars, this will round to the nearest $0.01
     * This is not meant for cash transactions, where the rounding rules are different
     * (https://en.wikipedia.org/wiki/Cash_rounding for more details on that).
     * This is generally the same as integer rounding because currency amounts are represented
     * as floating-point numbers multiplied by the minimal number of decimal places the currency
     * supports - so $3.2105 is stored as '321.05' and rounded to '312' or $3.21 exactly.
     * @param {number} amount - The amount/value to round.
     * @returns {number} The rounded amount/value.
     */
    roundAmount(amount: number): number;
    /**
     * Custom JSON serialization
     * @returns {string} - This currency's currency code.
     */
    toJSON(): string;
}
/** Global constant map listing supported currencies. */
export declare const SUPPORTED_CURRENCIES: Readonly<{
    [currencyCode: string]: Currency;
}>;
export declare class CurrencyFormatter {
    readonly defaultCurrency: Currency;
    readonly locales: string | string[];
    private rawFormatters;
    private formatters;
    constructor(defaultCurrency: Currency, locales?: string | string[]);
    /**
     * Given an amount and a Currency, format the amount appropriately as a plain text string.
     * Note: it would be nice to just use toLocaleString() as follows:
     *    amount.toLocaleString("en-US", {style: "currency", currency: "CAD"})
     * However, that does not support Bitcoin.
     * @param {number} amount - the amount to format
     * @param {Currency=} currency - one of the currencies from SUPPORTED_CURRENCIES (optional)
     * @return {string} The amount, formatted as a string.
     */
    formatAmount(amount: number, currency?: Currency): string;
    /**
     * Given an amount and a Currency, format the amount as a plain text string with no symbol.
     * @param {number} amount - the amount to format
     * @param {Currency=} currency - one of the currencies from SUPPORTED_CURRENCIES (optional)
     * @return {string} The amount, formatted as a string, but without any currency symbol.
     */
    formatAmountRaw(amount: number, currency?: Currency): string;
}
