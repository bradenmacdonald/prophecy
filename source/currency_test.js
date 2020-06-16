"use strict";
const should = require('chai').should(); // eslint-disable-line
const Prophecy = require('../prophecy-dist');
const CurrencyFormatter = Prophecy.CurrencyFormatter;

describe('SUPPORTED_CURRENCIES', function() {

    it('Can lookup currencies by ISO 4217 code', () => {
        const usDollar = Prophecy.SUPPORTED_CURRENCIES["USD"];
        usDollar.name.should.equal("United States dollar");
        usDollar.symbols.length.should.equal(2);
        usDollar.symbols[0].should.equal("$");
        usDollar.symbols[1].should.equal("US$");
    });

    it('Can iterate over all supported currencies', () => {
        for (let code in Prophecy.SUPPORTED_CURRENCIES) {
            const currency = Prophecy.SUPPORTED_CURRENCIES[code];
            currency.code.should.be.a('string');
            currency.code.should.equal(code);
            currency.code.length.should.equal(3);
        }
    });

});


describe('CurrencyFormatter', function() {

    describe('.formatAmountRaw()', () => {

        const formatAmountRaw_data = [
            {currencyCode: "XBT", locale: undefined, amount: 100000000, formattedRaw: "1.00"},
            {currencyCode: "XBT", locale: undefined, amount: 100000001, formattedRaw: "1.00000001"},

            {currencyCode: "USD", locale: undefined, amount: 0, formattedRaw: "0.00"},
            {currencyCode: "USD", locale: undefined, amount: 1000.5, formattedRaw: "10.01"},
            {currencyCode: "USD", locale: undefined, amount: 1000.4, formattedRaw: "10.00"},
            {currencyCode: "USD", locale: undefined, amount: 1000.009, formattedRaw: "10.00"},
            {currencyCode: "USD", locale: undefined, amount: -123456.1, formattedRaw: "-1,234.56"},

            {currencyCode: "USD", locale: "en-CA", amount: 0, formattedRaw: "0.00"},
            {currencyCode: "USD", locale: "en-CA", amount: 1000.5, formattedRaw: "10.01"},
            {currencyCode: "USD", locale: "en-CA", amount: 1000.4, formattedRaw: "10.00"},
            {currencyCode: "USD", locale: "en-CA", amount: 1000.009, formattedRaw: "10.00"},
            {currencyCode: "USD", locale: "en-CA", amount: -123456.1, formattedRaw: "-1,234.56"},

            // Note: if the following tests fail in Node, it probably is missing ICU data.
            // Reinstall node with "./configure --with-intl=full-icu" or
            // "brew install node --with-full-icu"
            {currencyCode: "USD", locale: "de", amount: 0, formattedRaw: "0,00"},
            {currencyCode: "USD", locale: "de", amount: 1000.5, formattedRaw: "10,01"},
            {currencyCode: "USD", locale: "de", amount: 1000.4, formattedRaw: "10,00"},
            {currencyCode: "USD", locale: "de", amount: 1000.009, formattedRaw: "10,00"},
            {currencyCode: "USD", locale: "de", amount: -123456.1, formattedRaw: "-1.234,56"},

            // Eastern Arabic numerals.
            // Note that even though Arabic is an RTL language, numbers are ordered
            // the same way as English, e.g. lowest value digits on the right.
            {currencyCode: "USD", locale: "ar", amount: 0, formattedRaw: "٠٫٠٠"},
            {currencyCode: "USD", locale: "ar", amount: 1000.5, formattedRaw: "١٠٫٠١"},
            {currencyCode: "USD", locale: "ar", amount: 1000.4, formattedRaw: "١٠٫٠٠"},
            {currencyCode: "USD", locale: "ar", amount: 1000.009, formattedRaw: "١٠٫٠٠"},
            // On the line below, \u061c is the invisible "arabic letter mark" which shifts the
            // minus sign to the right. Some i18n implementations may insert a "right to left mark"
            // instead, which is \u200f and has the same effect. Either should be accepted.
            {currencyCode: "USD", locale: "ar", amount: -123456.1, formattedRaw: "\u061c-" + "١٬٢٣٤٫٥٦"},
        ];
        formatAmountRaw_data.forEach(d => {
            it(`can format ${d.currencyCode} ${d.amount} with locale ${d.locale} as ${d.formattedRaw}`, () => {
                const currency = Prophecy.SUPPORTED_CURRENCIES[d.currencyCode];
                const formatter = new CurrencyFormatter(currency, d.locale);
                const actual = formatter.formatAmountRaw(d.amount).replace('\u200f', '\u061c');
                actual.should.equal(d.formattedRaw);
            });
        });

    });

    describe('.formatAmount()', () => {

        const formatAmount_data = [
            {code: "CAD", userDefault: "CAD", locale: undefined, amount: 100, formatted: "$\xa01.00"},
            {code: "USD", userDefault: "CAD", locale: undefined, amount: 100, formatted: "US$\xa01.00"},
            {code: "CAD", userDefault: "USD", locale: undefined, amount: 100, formatted: "C$\xa01.00"},
            {code: "XBT", userDefault: "CAD", locale: undefined, amount: 100000000, formatted: "\u20BF\xa01.00"},
            {code: "XBT", userDefault: "CAD", locale: undefined, amount: 100000001, formatted: "\u20BF\xa01.00000001"},

            {code: "CAD", userDefault: "CAD", locale: "en", amount: 0, formatted: "$\xa00.00"},
            {code: "CAD", userDefault: "CAD", locale: "en", amount: 1000.5, formatted: "$\xa010.01"},
            {code: "CAD", userDefault: "CAD", locale: "en", amount: 1000.4, formatted: "$\xa010.00"},
            {code: "CAD", userDefault: "CAD", locale: "en", amount: 1000.009, formatted: "$\xa010.00"},
            {code: "CAD", userDefault: "CAD", locale: "en", amount: -123456.1, formatted: "-$\xa01,234.56"},

            // Note: if the following tests fail in Node, it probably is missing ICU data.
            // Reinstall node with "./configure --with-intl=full-icu" or
            // "brew install node --with-full-icu"
            {code: "EUR", userDefault: "EUR", locale: "de", amount: 0, formatted: "0,00\xa0€"},
            {code: "EUR", userDefault: "EUR", locale: "de", amount: 1000.5, formatted: "10,01\xa0€"},
            {code: "EUR", userDefault: "EUR", locale: "de", amount: 1000.4, formatted: "10,00\xa0€"},
            {code: "EUR", userDefault: "EUR", locale: "de", amount: 1000.009, formatted: "10,00\xa0€"},
            {code: "EUR", userDefault: "EUR", locale: "de", amount: -123456.1, formatted: "-1.234,56\xa0€"},

            {code: undefined, userDefault: "CAD", locale: "ar", amount: 0, formatted: "٠٫٠٠\xa0$"},
            {code: undefined, userDefault: "CAD", locale: "ar", amount: 1000.5, formatted: "١٠٫٠١\xa0$"},
            {code: undefined, userDefault: "CAD", locale: "ar", amount: 1000.4, formatted: "١٠٫٠٠\xa0$"},
            {code: undefined, userDefault: "CAD", locale: "ar", amount: 1000.009, formatted: "١٠٫٠٠\xa0$"},
            {code: undefined, userDefault: "CAD", locale: "ar", amount: -123456.1, formatted: "\u061c-١٬٢٣٤٫٥٦\xa0$"},
        ];
        formatAmount_data.forEach(d => {
            it(`can format ${d.code} ${d.amount} with locale ${d.locale}/${d.userDefault} as ${d.formatted}`, () => {
                const currency = Prophecy.SUPPORTED_CURRENCIES[d.code];
                const defaultCurrency = Prophecy.SUPPORTED_CURRENCIES[d.userDefault];
                const formatter = new CurrencyFormatter(defaultCurrency, d.locale);
                const actual = formatter.formatAmount(d.amount, currency).replace('\u200f', '\u061c');
                actual.should.equal(d.formatted);
            });
        });

    });
});
