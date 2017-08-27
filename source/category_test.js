"use strict";
const should = require('chai').should();
const Immutable = require('immutable');
const Prophecy = require('../prophecy-dist');
const Category = Prophecy.Category;
const CategoryRule = Prophecy.CategoryRule;
const CategoryGroup = Prophecy.CategoryGroup;
const CategoryRulePeriod = Prophecy.CategoryRulePeriod;
const PDate = Prophecy.PDate;


// Define some syntactic sugar and dates for use in these tests:
const D = PDate.parseTemplateLiteral;
const jan1 = D`2016-01-01`;
const may1 = D`2016-05-01`;
const sep1 = D`2016-09-01`;
const dec31 = D`2016-12-31`;




describe('CategoryRule', function() {

    describe('initialization', () => {
        it('can be constructed with no arguments', () => {
            const rule = new CategoryRule();
            rule.amount.should.equal(0);
            rule.repeatN.should.equal(1);
        });
        it('can be constructed with some arguments', () => {
            const rule = new CategoryRule({amount: 15});
            rule.amount.should.equal(15);
            rule.repeatN.should.equal(1);
        });
    });

    describe('countOccurrencesBetween', () => {

        // Simple tests that can apply to all repetition periods:

        for (let periodName of ['Day', 'Week', 'Month', 'Year']) {
            const period = CategoryRulePeriod[periodName];
            it('returns 1 occurence for a "1 ' + periodName + '" repetition between Jan 1, 2016 and Jan 1, 2016 when startDate and endDate are null.', () => {
                const rule = new CategoryRule({startDate: null, endDate: null, repeatN: 1, period});
                rule.countOccurrencesBetween(jan1, jan1).should.equal(1);
            });
            it('returns 0 occurences for a "1 ' + periodName + '" repetition between Jan 1, 2016 and Jan 1, 2016 when startDate is December 31, 2016.', () => {
                const rule = new CategoryRule({startDate: dec31, endDate: null, repeatN: 1, period});
                rule.countOccurrencesBetween(jan1, jan1).should.equal(0);
            });
            it('returns 0 occurences for a "1 ' + periodName + '" repetition between Dec 31, 2016 and Dec 31, 2016 when endDate is January 1, 2016.', () => {
                const rule = new CategoryRule({startDate: null, endDate: jan1, repeatN: 1, period});
                rule.countOccurrencesBetween(dec31, dec31).should.equal(0);
            });
        }

        describe('with period=null', () => {

            it('has one occurrence when startDate and endDate are null', () => {
                const rule = new CategoryRule({startDate: null, endDate: null, period: null});
                rule.countOccurrencesBetween(jan1, jan1).should.equal(1);
                rule.countOccurrencesBetween(jan1, dec31).should.equal(1);
            });

            it('has 0 occurrences when dateEnd is earlier than startDate', () => {
                const rule = new CategoryRule({startDate: sep1, endDate: null, period: null});
                rule.countOccurrencesBetween(jan1, may1).should.equal(0);
                const rule2 = new CategoryRule({startDate: sep1, endDate: dec31, period: null});
                rule2.countOccurrencesBetween(jan1, may1).should.equal(0);
            });

            it('has 0 occurrences when dateBegin is later than endDate', () => {
                const rule = new CategoryRule({startDate: null, endDate: may1, period: null});
                rule.countOccurrencesBetween(sep1, dec31).should.equal(0);
                const rule2 = new CategoryRule({startDate: jan1, endDate: may1, period: null});
                rule2.countOccurrencesBetween(sep1, dec31).should.equal(0);
            });

            it('has 1 occurrence when [dateBegin..dateEnd] is within [startDate..endDate]', () => {
                const rule = new CategoryRule({startDate: jan1, endDate: dec31, period: null});
                rule.countOccurrencesBetween(may1, sep1).should.equal(1);
            });

            it('has 1 occurrence when [dateBegin..dateEnd] equals [startDate..endDate]', () => {
                const rule = new CategoryRule({startDate: jan1, endDate: dec31, period: null});
                rule.countOccurrencesBetween(jan1, dec31).should.equal(1);
            });

            it('has 1 occurrence when [startDate..endDate] is within [dateBegin..dateEnd]', () => {
                const rule = new CategoryRule({startDate: may1, endDate: sep1, period: null});
                rule.countOccurrencesBetween(jan1, dec31).should.equal(1);
            });

            it('has 1 occurrence when [startDate..endDate] overlaps [dateBegin..dateEnd]', () => {
                const rule = new CategoryRule({startDate: jan1, endDate: sep1, period: null});
                rule.countOccurrencesBetween(may1, dec31).should.equal(1);

                const rule2 = new CategoryRule({startDate: may1, endDate: dec31, period: null});
                rule2.countOccurrencesBetween(jan1, sep1).should.equal(1);
            });

        });

        function check(expectations, period) {
            for (let params of expectations) {
                it(`repeatN=${params.repeatN}, startDate ${params.startDate}, endDate ${params.endDate} gives ${params.expect} occurrences between ${params.dateBegin} and ${params.dateEnd}`, () => {
                    const rule = new CategoryRule({startDate: params.startDate, endDate: params.endDate, repeatN: params.repeatN, period});
                    rule.countOccurrencesBetween(params.dateBegin, params.dateEnd).should.equal(params.expect);
                });
            }
        }

        describe('with period=Day', () => {

            const expectations = [
                {startDate: null, endDate: null, repeatN: 1, dateBegin: jan1, dateEnd: dec31, expect: 366}, // 2016 was a leap year
                {startDate: jan1, endDate: dec31, repeatN: 1, dateBegin: jan1, dateEnd: dec31, expect: 366},
                // Test # of days in February + first day of March:
                {startDate: D`2015-02-01`, endDate: D`2015-03-01`, repeatN: 1, dateBegin: D`2015-01-01`, dateEnd: D`2015-12-31`, expect: 29},
                {startDate: D`2016-02-01`, endDate: D`2016-03-01`, repeatN: 1, dateBegin: D`2016-01-01`, dateEnd: D`2016-12-31`, expect: 30},
                // Test dateBegin/dateEnd inside larger startDate - endDate series:
                {startDate: D`2016-01-01`, endDate: D`2016-12-31`, repeatN: 1, dateBegin: D`2016-08-01`, dateEnd: D`2016-08-13`, expect: 13},
                // Test repeatN being different than 1:
                {startDate: D`2016-01-01`, endDate: D`2016-01-13`, repeatN: 2, dateBegin: D`2016-01-01`, dateEnd: D`2016-01-31`, expect: 7}, // Odd days in January 2016 between Jan 1 and 13
                {startDate: D`2016-01-01`, endDate: D`2016-01-14`, repeatN: 2, dateBegin: D`2016-01-01`, dateEnd: D`2016-01-31`, expect: 7}, // Odd days in January 2016 between Jan 1 and 14
                {startDate: D`2016-01-02`, endDate: D`2016-01-13`, repeatN: 2, dateBegin: D`2016-01-01`, dateEnd: D`2016-01-31`, expect: 6}, // Even days in January 2016 between Jan 2 and 13
                {startDate: D`2016-01-02`, endDate: D`2016-01-14`, repeatN: 2, dateBegin: D`2016-01-01`, dateEnd: D`2016-01-31`, expect: 7}, // Even days in January 2016 between Jan 2 and 14
                {startDate: D`2016-08-01`, endDate: D`2016-08-13`, repeatN: 2, dateBegin: D`2016-01-01`, dateEnd: D`2016-12-31`, expect: 7}, // Odd days in August 2016
                {startDate: D`2016-01-01`, endDate: D`2016-12-31`, repeatN: 2, dateBegin: D`2016-08-01`, dateEnd: D`2016-08-13`, expect: 6}, // Even days of the year; should be 6 even days of the year in August 2016 (not same thing as even days of the month)
                {startDate: D`2016-01-02`, endDate: D`2016-12-31`, repeatN: 2, dateBegin: D`2016-08-01`, dateEnd: D`2016-08-13`, expect: 7}, // Odd days of the year
                {startDate: D`2016-01-03`, endDate: D`2016-12-31`, repeatN: 7, dateBegin: D`2016-08-01`, dateEnd: D`2016-08-31`, expect: 4}, // Rule is 'every Sunday in 2016'; should be 4 Sundays in August 2016
            ];

            check(expectations, CategoryRulePeriod.Day);
        });

        describe('with period=Week', () => {

            const expectations = [
                {startDate:          null, endDate: null, repeatN: 1, dateBegin: D`2016-01-01`, dateEnd: D`2016-12-31`, expect: 53}, // 2016 was a leap year with 53 Fridays, and 2016-01-31 was a Friday
                {startDate: D`2016-01-01`, endDate: null, repeatN: 1, dateBegin: D`2016-01-01`, dateEnd: D`2016-12-31`, expect: 53}, // 2016 was a leap year with 53 Fridays, and 2016-01-31 was a Friday
                {startDate: D`2012-04-17`, endDate: null, repeatN: 2, dateBegin: D`2016-01-01`, dateEnd: D`2016-12-31`, expect: 26}, // "Every two weeks starting April 17, 2012 (a Tuesday)" has 26 occurrences in 2016
                {startDate: D`2012-04-17`, endDate: null, repeatN: 2, dateBegin: D`2016-01-01`, dateEnd: D`2016-07-18`, expect: 14}, // "Every two weeks starting April 17, 2012 (a Tuesday)" has 14 occurrences between Jan 1 and July 18, 2016
                {startDate: D`2012-04-17`, endDate: null, repeatN: 2, dateBegin: D`2016-01-01`, dateEnd: D`2016-07-19`, expect: 15}, // "Every two weeks starting April 17, 2012 (a Tuesday)" has 15 occurrences between Jan 1 and July 19, 2016 (a Tuesday)
                {startDate: D`2012-04-17`, endDate: null, repeatN: 2, dateBegin: D`2016-01-01`, dateEnd: D`2016-07-20`, expect: 15}, // "Every two weeks starting April 17, 2012 (a Tuesday)" has 15 occurrences between Jan 1 and July 20, 2016
            ];

            check(expectations, CategoryRulePeriod.Week);
        });

        describe('with period=Month', () => {

            const expectations = [
                {startDate: null, endDate: null, repeatN: 1, dateBegin: D`2016-01-01`, dateEnd: D`2016-12-31`, expect: 12}, // Every month in 2016
                {startDate: D`2016-01-15`, endDate: null, repeatN: 3, dateBegin: D`2016-01-01`, dateEnd: D`2016-12-31`, expect: 4}, // Every three months in 2016 (quarterly)
                {startDate: D`2016-01-15`, endDate: D`2016-08-01`, repeatN: 3, dateBegin: D`2016-01-01`, dateEnd: D`2016-12-31`, expect: 3}, // Every three months in 2016 (quarterly) until August (Jan 15, Apr 15, Jul 15)
                {startDate: D`2016-01-15`, endDate: D`2016-10-14`, repeatN: 3, dateBegin: D`2016-01-01`, dateEnd: D`2016-12-31`, expect: 3}, // Every three months in 2016 (quarterly) until October 14 (Jan 15, Apr 15, Jul 15)
                {startDate: D`2016-01-15`, endDate: D`2016-10-15`, repeatN: 3, dateBegin: D`2016-01-01`, dateEnd: D`2016-12-31`, expect: 4}, // Every three months in 2016 (quarterly) until October 15 (Jan 15, Apr 15, Jul 15, Oct 15)
                {startDate: D`2016-01-15`, endDate: D`2016-10-16`, repeatN: 3, dateBegin: D`2016-01-01`, dateEnd: D`2016-12-31`, expect: 4}, // Every three months in 2016 (quarterly) until October 16 (Jan 15, Apr 15, Jul 15, Oct 15)
                // Even though every month doesn't have a 31st day, we can repeat each month on the 31st and get 12 repetitions in the year:
                {startDate: D`2016-01-31`, endDate: null, repeatN: 1, dateBegin: D`2016-01-01`, dateEnd: D`2016-12-31`, expect: 12},
            ];

            check(expectations, CategoryRulePeriod.Month);

        });

        describe('with period=Year', () => {

            const expectations = [
                {startDate:          null, endDate:          null, repeatN: 1, dateBegin: D`2016-01-01`, dateEnd: D`2016-12-31`, expect: 1},
                {startDate: D`2016-01-01`, endDate:          null, repeatN: 1, dateBegin: D`2016-01-01`, dateEnd: D`2016-12-31`, expect: 1},
                {startDate: D`2016-12-31`, endDate:          null, repeatN: 1, dateBegin: D`2016-01-01`, dateEnd: D`2016-12-31`, expect: 1},

                {startDate: D`2012-01-01`, endDate:          null, repeatN: 1, dateBegin: D`2016-01-01`, dateEnd: D`2016-12-31`, expect: 1},
                {startDate: D`2012-01-01`, endDate: D`2015-12-31`, repeatN: 1, dateBegin: D`2016-01-01`, dateEnd: D`2016-12-31`, expect: 0},
                {startDate: D`2012-01-01`, endDate: D`2016-01-01`, repeatN: 1, dateBegin: D`2016-01-01`, dateEnd: D`2016-12-31`, expect: 1},
                {startDate: D`2012-01-01`, endDate: D`2020-01-01`, repeatN: 1, dateBegin: D`2016-01-01`, dateEnd: D`2016-12-31`, expect: 1},

                {startDate: D`2006-06-06`, endDate: D`2012-12-12`, repeatN: 1, dateBegin: D`2000-01-01`, dateEnd: D`2222-12-31`, expect: 7},
            ];

            check(expectations, CategoryRulePeriod.Year);

        });

    });
});


describe('Category', function() {
    
    describe('initialization', () => {
        it('can be constructed with no arguments', () => {
            const cat = new Category();
            cat.name.should.equal("");
            should.equal(cat.groupId, null);
        });
        it('can be constructed with some arguments', () => {
            const cat = new Category({name: "test"});
            cat.name.should.equal("test");
            should.equal(cat.groupId, null);
        });
    });

    describe('immutability', () => {

        it('cannot be changed', () => {
            const c = new Category();
            (() => { c.id = 5; }).should.throw();
            (() => { c.name = null; }).should.throw();
            (() => { c.rules = []; }).should.throw();

            const c2 = c.merge({id: 5, name: "New Name"});
            c2.id.should.equal(5);
            c2.name.should.equal("New Name");
            should.equal(c.id, null);
            c.name.should.equal("");
        });

    });

    describe('validation', () => {

        it('requires ID to be a positive integer if set', () => {

            (() => { new Category({id: 10}); }).should.not.throw();
            (() => { new Category({id: null}); }).should.not.throw();
            (() => { new Category({id: 1.5}); }).should.throw();
            (() => { new Category({id: 0}); }).should.throw();
            (() => { new Category({id: -1}); }).should.throw();
            (() => { new Category({id: 'a'}); }).should.throw();
        });

        it('does not allow overlapping CategoryRules to be attached to the same category', () => {

            // We need a budget context for this test, in order to make null endDate have defined behavior.
            const budget = new Prophecy.Budget({startDate: D`2016-01-01`, endDate: D`2016-12-31`, categoryGroups: [
                new CategoryGroup({id: 9, name: "Dummy Group"}),
            ]});
            const categoryFactoryWithRules = function(rules) {
                return () => { budget.updateCategory(new Category({id: 1, groupId: 9, rules: Immutable.List(rules)})); };
            };

            // Some valid categories with non-overlapping rules:

            categoryFactoryWithRules([
                new CategoryRule({startDate: D`2016-01-01`, endDate: D`2016-06-15`, period: CategoryRulePeriod.Day}),
                new CategoryRule({startDate: D`2016-06-16`, endDate: D`2016-12-31`, period: CategoryRulePeriod.Day}),
            ]).should.not.throw();

            categoryFactoryWithRules([
                new CategoryRule({startDate: D`2016-01-01`, endDate: D`2016-06-15`, period: CategoryRulePeriod.Day}),
                new CategoryRule({startDate: D`2016-06-16`, endDate: null, period: CategoryRulePeriod.Day}),
            ]).should.not.throw();

            // Invalid, overlapping rules:

            categoryFactoryWithRules([
                new CategoryRule({startDate: D`2016-01-01`, endDate: D`2016-06-15`, period: CategoryRulePeriod.Day}),
                new CategoryRule({startDate: D`2016-01-01`, endDate: D`2016-12-31`, period: CategoryRulePeriod.Day}),
            ]).should.throw();

            categoryFactoryWithRules([
                new CategoryRule({startDate: null, endDate: null, period: null}),
                new CategoryRule({startDate: D`2016-01-01`, endDate: D`2016-12-31`, period: CategoryRulePeriod.Day}),
            ]).should.throw();
        });

    });

    describe('serialization', () => {

        const category1 = new Category({
            id: 123,
            name: "Property Insurance",
            rules: Immutable.List.of(
                new CategoryRule({amount: 22200, startDate: D`2016-06-01`, endDate: null, repeatN: 1, period: CategoryRulePeriod.Year})
            ),
            notes: "Paid annually in June",
            currencyCode: "CAD",
            groupId: 5,
            metadata: Immutable.Map({editCount: 6}),
        });
        const category1ExpectedJS = {
            id: 123,
            name: "Property Insurance",
            rules: [
                {amount: 22200, startDate: 5996, endDate: null, repeatN: 1, period: 5},
            ],
            notes: "Paid annually in June",
            currencyCode: "CAD",
            groupId: 5,
            metadata: {editCount: 6},
        };

        it('serializes to JSON', () => {
            const categoryJSON = JSON.stringify(category1);
            JSON.parse(categoryJSON).should.deep.equal(category1ExpectedJS);
        });

        it('serializes to JSON and back', () => {
            const categoryJSON = JSON.stringify(category1);
            const category2 = Category.fromJS(JSON.parse(categoryJSON));
            Immutable.is(category1, category2).should.be.true;
            // Make sure this comparison works:
            const otherData = JSON.parse(categoryJSON);
            otherData.id = 456;
            const category3 = Category.fromJS(otherData);
            category3.should.not.deep.equal(category1);
        })
    });

});



describe('CategoryGroup', function() {

    describe('immutability', () => {

        it('cannot be changed', () => {
            const c = new CategoryGroup();
            (() => { c.id = 5; }).should.throw();
            (() => { c.name = null; }).should.throw();

            const c2 = c.merge({id: 5, name: "New Name"});
            c2.id.should.equal(5);
            c2.name.should.equal("New Name");
            should.equal(c.id, null);
            c.name.should.equal("");
        });

    });

    describe('serialization', () => {

        const group1 = new CategoryGroup({
            id: 123,
            name: "Housing",
        });
        const group1ExpectedJS = {
            id: 123,
            name: "Housing",
        };

        it('serializes to JSON', () => {
            const categoryJSON = JSON.stringify(group1);
            JSON.parse(categoryJSON).should.deep.equal(group1ExpectedJS);
        });

        it('serializes to JSON and back', () => {
            const categoryJSON = JSON.stringify(group1);
            const group2 = CategoryGroup.fromJS(JSON.parse(categoryJSON));
            group2.should.deep.equal(group1);
            // Make sure this comparison works:
            const otherData = JSON.parse(categoryJSON);
            otherData.id = 456;
            const group3 = Category.fromJS(otherData);
            group3.should.not.deep.equal(group1);
        })
    });

});