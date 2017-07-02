import { __, assertIsNumber } from './util';
const _CODE = Symbol("code"); // Internal key used to make 'code' read-only
/** Class that describes a real-world currency. */
export class Currency {
    /**
     * Create a currency description.
     * @param {string} code - the ISO 4217 currency code (three characters)
     * @param {string} name - the full name of the currency ("Canadian Dollar")
     * @param {string[]} symbols - the symbols for this currency in order from most to least
     *                           ambiguous (e.g. ["$", "CA$"])
     * @param {number} decimals - The maximum number of decimal places that this currency can
     *                            support (e.g. '2' means $0.01 is the smallest amount.)
     */
    constructor(code, name, symbols, decimals = 2) {
        this.code = code;
        this.name = name;
        this.symbols = symbols;
        this.decimals = decimals;
    }
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
    roundAmount(amount) { return Math.round(amount); }
    /**
     * Custom JSON serialization
     * @returns {string} - This currency's currency code.
     */
    toJSON() { return this.code; }
}
/** Global constant map listing supported currencies. */
export const SUPPORTED_CURRENCIES = Object.freeze({
    CAD: new Currency("CAD", __("Canadian dollar"), ["$", "C$"]),
    EUR: new Currency("EUR", __("Euro"), ["€"]),
    USD: new Currency("USD", __("United States dollar"), ["$", "US$"]),
    JPY: new Currency("JPY", __("Japanese yen"), ["¥"], 0),
    XBT: new Currency("XBT", __("Bitcoin"), ["\u20BF"], 8),
});
class CustomNumberFormat extends Intl.NumberFormat {
}
export class CurrencyFormatter {
    constructor(defaultCurrency, locales) {
        this.defaultCurrency = defaultCurrency;
        this.locales = locales || 'en'; // Define a default locale for consistency
        // Cached NumberFormat instances, keyed by currency code:
        this.rawFormatters = {};
        this.formatters = {};
    }
    /**
     * Given an amount and a Currency, format the amount appropriately as a plain text string.
     * Note: it would be nice to just use toLocaleString() as follows:
     *    amount.toLocaleString("en-US", {style: "currency", currency: "CAD"})
     * However, that does not support Bitcoin.
     * @param {number} amount - the amount to format
     * @param {Currency=} currency - one of the currencies from SUPPORTED_CURRENCIES (optional)
     * @return {string} The amount, formatted as a string.
     */
    formatAmount(amount, currency) {
        assertIsNumber(amount);
        if (currency === undefined) {
            currency = this.defaultCurrency;
        }
        let formatter = this.formatters[currency.code];
        if (formatter === undefined) {
            formatter = this.formatters[currency.code] = new CustomNumberFormat(this.locales, {
                style: "currency",
                // The currency argument is supposed to be the ISO 4217 currency code, but
                // according to the spec (http://www.ecma-international.org/ecma-402/1.0/#sec-6.3)
                // if we pass an unknown currency code, the 'currency' agument is used as the
                // symbol. So pass a generic/fake code, and we'll later replace it with the
                // correct symbol. That way, we get the symbol in the correct place for the
                // user's locale, but we can also support currencies like Bitcoin that the
                // Javascript runtime may not natively support.
                currency: "XCC",
                minimumFractionDigits: Math.min(2, currency.decimals),
                maximumFractionDigits: currency.decimals,
            });
            let symbol = currency.symbols[0];
            const isDefaultCurrency = (currency.code === this.defaultCurrency.code);
            const symbolConflicts = (!isDefaultCurrency && symbol == this.defaultCurrency.symbols[0]);
            if (symbolConflicts && currency.symbols.length > 1) {
                symbol = currency.symbols[1];
            }
            formatter.symbol = symbol;
        }
        return formatter.format(amount * Math.pow(10, -currency.decimals)).replace("XCC", formatter.symbol);
    }
    /**
     * Given an amount and a Currency, format the amount as a plain text string with no symbol.
     * @param {number} amount - the amount to format
     * @param {Currency=} currency - one of the currencies from SUPPORTED_CURRENCIES (optional)
     * @return {string} The amount, formatted as a string, but without any currency symbol.
     */
    formatAmountRaw(amount, currency) {
        assertIsNumber(amount);
        if (currency === undefined) {
            currency = this.defaultCurrency;
        }
        let formatter = this.rawFormatters[currency.code];
        if (formatter === undefined) {
            formatter = this.rawFormatters[currency.code] = new Intl.NumberFormat(this.locales, {
                minimumFractionDigits: Math.min(2, currency.decimals),
                maximumFractionDigits: currency.decimals,
            });
        }
        return formatter.format(amount * Math.pow(10, -currency.decimals));
    }
}
//# sourceMappingURL=currency.js.map