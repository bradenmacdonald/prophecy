"use strict";
const should = require('chai').should();
const PDate = require('../prophecy-dist').PDate;

describe('PDate', function() {

    function assertSane(pdate) {
        // BDD style version using chai - slows the "all valid values" test down 3x!
        /*(pdate.year).should.be.within(2000, 3000);
        (pdate.month).should.be.within(0, 11);
        (pdate.day).should.be.within(1, 31);
        (pdate.value).should.equal(new PDate(pdate.value).value);
        (pdate.value).should.equal(PDate.create(pdate.year, pdate.month, pdate.day).value);
        */
        // Optimized version:
        if (
            (pdate.year < 2000 || pdate.year > 3000) ||
            (pdate.month < 0 || pdate.month > 11) ||
            (pdate.day < 1 || pdate.day > 31)
        ) {
            throw new Error("PDate is not sane. Property is outside of valid range.");
        }
        if (
            (pdate.value !== new PDate(pdate.value).value) ||
            (pdate.value !== PDate.create(pdate.year, pdate.month, pdate.day).value)
        ) {
            throw new Error("PDate is not sane. Re-creation failed.");
        }
    }

    describe('.create()', () => {
        const specific_dates = [
            {args: [2000, PDate.MONTHS.JAN, 1], str: "2000-01-01", value: 0, day_of_week: PDate.DAYS.SAT, day_of_year: 0},
            {args: [2000, PDate.MONTHS.JAN, 31], str: "2000-01-31", value: 30, day_of_week: PDate.DAYS.MON, day_of_year: 30},
            {args: [2000, PDate.MONTHS.FEB, 1], str: "2000-02-01", value: 31, day_of_week: PDate.DAYS.TUE, day_of_year: 31},
            {args: [2025, PDate.MONTHS.NOV, 30], str: "2025-11-30", value: 9465, day_of_week: PDate.DAYS.SUN, day_of_year: 365-32},
            {args: [2025, PDate.MONTHS.DEC, 1], str: "2025-12-01", value: 9466, day_of_week: PDate.DAYS.MON, day_of_year: 365-31},
            {args: [2789, PDate.MONTHS.FEB, 28], str: "2789-02-28", value: 288235, day_of_week: PDate.DAYS.TUE, day_of_year: 58},
            {args: [2789, PDate.MONTHS.MAR, 1], str: "2789-03-01", value: 288236, day_of_week: PDate.DAYS.WED, day_of_year: 59},
        ];
        specific_dates.forEach(d => {
            it(`can construct a valid date from the triplet (${d.args})`, () => {
                const pdate = PDate.create(...d.args);
                assertSane(pdate);
                (pdate.toString()).should.equal(d.str);
                (pdate.value).should.equal(d.value);
                (pdate.dayOfWeek).should.equal(d.day_of_week);
                (pdate.dayOfYear).should.equal(d.day_of_year);
            });
        });

        it('Can handle tricky dates', () => {
            for (let year = 2000; year <= 3000; year++) {
                const j1 = PDate.create(year, PDate.MONTHS.JAN, 1);
                (j1.year).should.equal(year, `.year for Jan 1, ${year} should yield ${year}`);
                (j1.month).should.equal(PDate.MONTHS.JAN, `.month for Jan 1, ${year} should yield 0.`);
                (j1.day).should.equal(1, `.day for Jan 1, ${year} should yield 1.`);
                (j1.dayOfYear).should.equal(0, `.dayOfYear for Jan 1, ${year} should yield 0.`);
                assertSane(j1);

                const d31 = PDate.create(year, PDate.MONTHS.DEC, 31);
                (d31.year).should.equal(year, `.year for Dec. 31, ${year} should yield ${year}`);
                (d31.month).should.equal(PDate.MONTHS.DEC, `.month for Dec. 31, ${year} should yield 11.`);
                (d31.day).should.equal(31, `.day for Dec. 31, ${year} should yield 31.`);
                (d31.dayOfYear).should.equal(PDate.isLeapYear(year) ? 365 : 364);
                assertSane(d31);

                if (PDate.isLeapYear(year)) {
                    const f29 = PDate.create(year, PDate.MONTHS.FEB, 29);
                    (f29.year).should.equal(year);
                } else {
                    const mar1 = PDate.create(year, PDate.MONTHS.MAR, 1);
                    const feb28 = PDate.create(year, PDate.MONTHS.FEB, 28);
                    (mar1.value - feb28.value).should.equal(1);
                }
            }
        });
    });

    describe('fromString()', () => {

        const dateStrings = [
            "2000-01-01", // Y2K
            "2000-12-31",
            "2007-01-09", // Announcement of the iPhone
            "2010-10-10",
            "2016-02-29",
            "2222-10-01",
        ];
        for (let d of dateStrings) {
            it(`parses "${d}" correctly`, () => { PDate.fromString(d).toString().should.equal(d); });
            const dWithoutHyphens = d.split('-').join('');
            it(`parses "${dWithoutHyphens}" correctly`, () => { PDate.fromString(dWithoutHyphens).toString().should.equal(d); });
        }

        const badStrings = [
            "hello",
            "2016,01,01",
            "05/05/05",
            "2016-o1-o1",
        ];

        for (let bad of badStrings) {
            it(`throws when asked to parse "${bad}"`, () => {
                (() => { PDate.fromString(bad) }).should.throw("Date string not in YYYY-MM-DD or YYYYMMDD format");
            });
        }

    });

    describe('parseTemplateLiteral()', () => {
        it('can be used to create a date string literal', () => {
            const D = PDate.parseTemplateLiteral;
            const month = "01";
            const obj = D`${2000 + 16}-${month}-31`;
            obj.year.should.equal(2016);
            obj.toString().should.equal("2016-01-31");
        });
    });

    describe('today()', () => {
        it('Can detect the current date', () => {
            const js_date = new Date();
            const pdate = PDate.today();
            (pdate.year).should.equal(js_date.getYear() + 1900);
            (pdate.month).should.equal(js_date.getMonth());
            (pdate.day).should.equal(js_date.getDate());
        });
    });

    describe('constructor()', () => {
        it('Constructs a sane PDate for all valid values', () => {
            for (let i = 0; i < 36525 * 10; i++) {
                const d = new PDate(i);
                d.toString();
                assertSane(d);
            }
        });
    });

    describe('toJSON()', () => {
        it('Serializes PDate objects to JSON as integers', () => {
            const d = new PDate(5000);
            JSON.stringify({date: d}).should.equal('{"date":5000}');
        });
    });

    describe('toJS()', () => {
        it('Serializes PDate objects within Immutable.js data structures as integers', () => {
            const d = new PDate(5000);
            d.toJS().should.equal(5000);
        });
    });

    describe('.isLeapYear()', () => {
        it('matches known leap/not-leap year dates', () => {
            PDate.isLeapYear(2000).should.be.true;
            PDate.isLeapYear(2001).should.be.false;
            PDate.isLeapYear(2002).should.be.false;
            PDate.isLeapYear(2003).should.be.false;
            PDate.isLeapYear(2004).should.be.true;
            PDate.isLeapYear(2005).should.be.false;

            PDate.isLeapYear(2015).should.be.false;
            PDate.isLeapYear(2016).should.be.true;
            PDate.isLeapYear(2017).should.be.false;
            PDate.isLeapYear(2018).should.be.false;
            PDate.isLeapYear(2019).should.be.false;
            PDate.isLeapYear(2020).should.be.true;

            PDate.isLeapYear(2100).should.be.false;
            PDate.isLeapYear(2200).should.be.false;
            PDate.isLeapYear(2300).should.be.false;
            PDate.isLeapYear(2400).should.be.true;
            PDate.isLeapYear(2500).should.be.false;
            PDate.isLeapYear(2600).should.be.false;
            PDate.isLeapYear(2700).should.be.false;
            PDate.isLeapYear(2800).should.be.true;
            PDate.isLeapYear(2900).should.be.false;
            PDate.isLeapYear(3000).should.be.false;
        });
    });

    describe('comparison', () => {
        it('works correctly when sorted', () => {
            const dates = [PDate.create(2010, 2, 3), PDate.create(2020, 3, 4), PDate.create(2007, 8, 9)];
            dates.sort();
            dates.map(d => d.toString()).join(",").should.equal(
                "2007-09-09,2010-03-03,2020-04-04"
            );
        });

        it('works correctly when comparing dates', () => {
            (PDate.create(2010, 1, 1) < PDate.create(2010, 1, 1)).should.be.false;
            (PDate.create(2010, 1, 1) > PDate.create(2010, 1, 1)).should.be.false;
            // Unfortunately, equality checking won't work unless we coerce values
            (PDate.create(2010, 1, 1) == +PDate.create(2010, 1, 1)).should.be.true;

            (PDate.create(2010, 1, 2) < PDate.create(2010, 1, 1)).should.be.false;
            (PDate.create(2010, 1, 2) > PDate.create(2010, 1, 1)).should.be.true;
            (PDate.create(2010, 1, 2) == PDate.create(2010, 1, 1)).should.be.false;

            (PDate.create(2010, 1, 1) < PDate.create(2010, 1, 2)).should.be.true;
            (PDate.create(2010, 1, 1) > PDate.create(2010, 1, 2)).should.be.false;
            (PDate.create(2010, 1, 1) == PDate.create(2010, 1, 2)).should.be.false;
        })
    });
});
