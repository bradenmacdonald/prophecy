"use strict";
const should = require('chai').should();
const Immutable = require('immutable');
const Prophecy = require('../prophecy-dist');
const Account = Prophecy.Account;
const Budget = Prophecy.Budget;
const Category = Prophecy.Category;
const CategoryGroup = Prophecy.CategoryGroup;
const Currency = Prophecy.Currency;
const D = Prophecy.PDate.parseTemplateLiteral;
const PDate = Prophecy.PDate;
const Transaction = Prophecy.Transaction;

describe('Budget', function() {

    describe('immutability', () => {

        it('cannot be changed', () => {
            const t = new Budget();
            (() => { t.id = 5; }).should.throw();
            (() => { t.name = "Test"; }).should.throw();
            (() => { t.startDate = null; }).should.throw();
            (() => { t.endDate = null; }).should.throw();
            (() => { t.currencyCode = null; }).should.throw();
            (() => { t.currency = null; }).should.throw();
            (() => { t.categories = []; }).should.throw();
            (() => { t.categories = new Immutable.OrderedMap(); }).should.throw();
        });

    });

    describe('settings', () => {

        describe('name', () => {

            it('defaults to "New Budget"', () => { (new Budget()).name.should.equal("New Budget"); });

            it('can be initialized and can be modified, creating a copy of the Budget', () => {
                const orig = new Budget({name: "Alpha Budget"});
                const modified1 = orig.set('name', "Beta Budget");
                const modified2 = modified1.merge({name: "Γ Budget"});

                orig.name.should.equal("Alpha Budget");
                modified1.name.should.equal("Beta Budget");
                modified2.name.should.equal("Γ Budget");
            });

        });

        describe("startDate and endDate", () => {

            it('defaults to the current year', () => {
                should.equal(+(new Budget()).startDate, +D`${PDate.today().year}-01-01`);
                should.equal(+(new Budget()).endDate, +D`${PDate.today().year}-12-31`);
            });

            it('can be initialized and can be modified, creating a copy of the Budget', () => {
                const orig = new Budget({startDate: D`2016-01-01`, endDate: D`2016-12-31`});

                orig.startDate.should.be.an.instanceof(PDate);
                orig.endDate.should.be.an.instanceof(PDate);
                (+orig.startDate).should.equal(+D`2016-01-01`); // Note we need to use '+' to compare PDates
                (+orig.endDate).should.equal(+D`2016-12-31`); // Note we need to use '+' to compare PDates

                const modified1 = orig.set('endDate', D`2020-06-15`);
                modified1.endDate.should.be.an.instanceof(PDate);
                (+modified1.endDate).should.equal(+D`2020-06-15`);

                const modified2 = modified1.merge({startDate: D`2020-05-10`});
                modified2.startDate.should.be.an.instanceof(PDate);
                (+modified2.startDate).should.equal(+D`2020-05-10`);
            });

            it('does not allow endDate to be earlier than startDate', () => {
                (() => {
                    new Budget({startDate: D`2016-01-01`, endDate: D`2016-12-31`});
                }).should.not.throw();

                (() => {
                    new Budget({startDate: D`2016-06-15`, endDate: D`2016-06-15`});
                }).should.not.throw();

                (() => {
                    new Budget({startDate: D`2016-06-15`, endDate: D`2016-06-14`});
                }).should.throw();

                (() => {
                    new Budget({startDate: D`2016-06-15`, endDate: D`2010-01-01`});
                }).should.throw();
            });
        });

        describe('currencyCode', () => {

            it('defaults to "USD"', () => {
                (new Budget()).currencyCode.should.equal('USD');
            });

            it('defaults to USD when accessed via .currency', () => {
                (new Budget()).currency.code.should.equal('USD');
            });

            it('is a Currency object when accessed via .currency', () => {
                (new Budget()).currency.should.be.an.instanceof(Currency);
            });

            it('can be initialized and can be modified, creating a copy of the Budget', () => {
                const orig = new Budget({currencyCode: 'CAD'});
                const modified1 = orig.set('currencyCode', 'XBT');
                const modified2 = modified1.merge({currencyCode: 'USD'});

                orig.currency.code.should.equal('CAD');
                modified1.currency.code.should.equal('XBT');
                modified2.currency.code.should.equal('USD');
            });

            it('throws an error when currencyCode is invalid', () => {
                (() => { new Budget({currencyCode: 'ABC'}); }).should.throw();
            });

        });

    });

    describe('accounts', () => {

        it('are empty by default', () => {
            const budget = new Budget();
            budget.accounts.size.should.equal(0);
            (budget.accounts.get(0) === undefined).should.be.true;
        });

        it('can be initialized with initial values', () => {
            const budget = new Budget({
                accounts: [
                    new Account({id: 15, name: "Test Account", initialBalance: 50000, currencyCode: 'CAD'}),
                ],
            });
            Immutable.OrderedMap.isOrderedMap(budget.accounts).should.be.true;
            budget.accounts.size.should.equal(1);
            budget.accounts.first().name.should.equal("Test Account");
            budget.accounts.get(15).name.should.equal("Test Account");
            budget.accounts.get(15).initialBalance.should.equal(50000);
            budget.accounts.get(15).currency.code.should.equal('CAD');
            (budget.accounts.get(200) === undefined).should.be.true;
        });

        it('cannot be modified with set()', () => {
            const budget = new Budget();
            Immutable.OrderedMap.isOrderedMap(budget.accounts).should.be.true;
            (() => { budget.set('accounts', new Immutable.OrderedMap()); }).should.throw();
        });

        it('preserves order', () => {
            const budget = new Budget({
                accounts: [
                    new Account({id: 7, name: "Acct A"}),
                    new Account({id: 1, name: "Acct B"}),
                    new Account({id: 5, name: "Acct C"}),
                    new Account({id: 4, name: "Acct D"}),
                    new Account({id: 3, name: "Acct E"}),
                    new Account({id: 8, name: "Acct F"}),
                    new Account({id: 2, name: "Acct G"}),
                ],
            });
            budget.accounts.size.should.equal(7);
            budget.accounts.reduce((str, account) => str += account.name.substring(5), "").should.equal('ABCDEFG');
        });

        it('can be appended, modified and deleted, preserving order', () => {
            let budget = new Budget({
                accounts: [
                    new Account({id: 7, name: "Acct A"}),
                    new Account({id: 1, name: "Acct B"}),
                    new Account({id: 5, name: "Acct C"}), // Delete this
                    new Account({id: 4, name: "Acct D"}), // Rename this "Acct d"
                    new Account({id: 3, name: "Acct E"}),
                    new Account({id: 8, name: "Acct F"}),
                    new Account({id: 2, name: "Acct G"}),
                    // Append a new account here
                ],
            });
            budget = budget.deleteAccount(5);
            budget = budget.updateAccount(new Account({id: 4, name: "Acct d"}))
            budget = budget.updateAccount(new Account({id: 6, name: "Acct H"}))
            budget.accounts.reduce((str, account) => str += account.name.substring(5), "").should.equal('ABdEFGH');
        });

        it('can be deleted, changing related transactions to have a null accountId', () => {
            const budget = new Budget({
                accounts: [
                    new Account({id: 10, name: "Cash"}),
                    new Account({id: 20, name: "Credit"}),
                    new Account({id: 30, name: "Chequing"}),
                    new Account({id: 40, name: "Savings"}),
                ],
                transactions: [
                    new Transaction({id: 1, accountId: 10, detail: [{amount: -100, description: "Spent $1 cash"}]}),
                    new Transaction({id: 2, accountId: 40, detail: [{amount: 1000, description: "Added $10 to savings"}]}),
                    new Transaction({id: 3, accountId: 30, detail: [{amount: -8000, description: "Spent $80 from chequing"}]}),
                    new Transaction({id: 4, accountId: 40, detail: [{amount: -500, description: "Spent $5 from savings"}]}),
                    new Transaction({id: 5, detail: [{description: "A blank transaction"}]}),
                ],
            });
            const budget2 = budget.deleteAccount(40);
            budget.accounts.size.should.equal(4);
            budget2.accounts.size.should.equal(3);
            budget.accounts.get(40).should.be.instanceof(Account);
            (budget2.accounts.get(40) === undefined).should.be.true;
            // Check that the transactions were updated:
            should.equal(budget2.transactions.get(1).accountId, 10);
            should.equal(budget2.transactions.get(2).accountId, null);
            should.equal(budget2.transactions.get(3).accountId, 30);
            should.equal(budget2.transactions.get(4).accountId, null);
            should.equal(budget2.transactions.get(5).accountId, null);
        });

        it('allows changing the order of accounts', () => {
            let budget = new Budget({
                accounts: [
                    new Account({id: 1, name: "Acct b"}),
                    new Account({id: 2, name: "Acct g"}),
                    new Account({id: 3, name: "Acct E"}),
                    new Account({id: 4, name: "Acct D"}),
                    new Account({id: 5, name: "Acct c"}),
                    new Account({id: 7, name: "Acct A"}),
                    new Account({id: 8, name: "Acct f"}),
                    new Account({id: 9, name: "Acct H"}),
                ],
            });
            budget = budget.positionAccount(9, 1); // H (to second place)
            budget = budget.positionAccount(3, 2); // E (to third place)
            budget = budget.positionAccount(7, 3); // A (to fourth place)
            budget = budget.positionAccount(4, 4); // D (to fifth place)
            budget.accounts.reduce((str, account) => str += account.name.substring(5), "").should.equal('bHEADgcf');
        });

    });

    describe('categories', () => {

        it('are empty by default', () => {
            const budget = new Budget();
            budget.categories.size.should.equal(0);
        });

        it('can be initialized with initial values', () => {
            const budget = new Budget({
                categoryGroups: [new CategoryGroup({id: 1, name: "Group"})],
                categories: [
                    new Category({
                        id: 1,
                        name: "Test Category",
                        groupId: 1,
                        notes: "just testing",
                    }),
                ],
            });
            Immutable.OrderedMap.isOrderedMap(budget.categories).should.be.true;
            budget.categories.size.should.equal(1);
            budget.categories.get(1).name.should.equal("Test Category");
            budget.categories.get(1).groupId.should.equal(1);
            budget.categories.get(1).notes.should.equal("just testing");
            (budget.categories.get(200) === undefined).should.be.true;
        });

        it('can be created and modified using updateCategory()', () => {
            const budget = new Budget({
                categoryGroups: [new CategoryGroup({id: 1, name: "Group"})],
                categories: [],
            });
            budget.categories.size.should.equal(0);

            // Insert a category:
            const budget2 = budget.updateCategory(
                new Category({id: 1, name: "Test Category", groupId: 1, notes: "just testing"})
            );
            budget2.categories.size.should.equal(1);
            budget2.categories.get(1).name.should.equal("Test Category");
            budget2.categories.get(1).groupId.should.equal(1);
            budget2.categories.get(1).notes.should.equal("just testing");

            // Modify the category:
            const budget3 = budget2.updateCategory(budget2.categories.get(1).merge({
                name: "Modified Name",
                rules: [
                    new Prophecy.CategoryRule({amount: 22200, startDate: D`2010-10-01`, endDate: null, repeatN: 1, period: Prophecy.CategoryRulePeriod.Year}),
                ],
                currencyCode: "CAD",
                metadata: {editCount: 2},
            }));
            budget3.categories.size.should.equal(1);
            budget3.categories.get(1).name.should.equal("Modified Name");
            budget3.categories.get(1).groupId.should.equal(1);
            budget3.categories.get(1).notes.should.equal("just testing");
            budget3.categories.get(1).currency.code.should.equal("CAD");
            budget3.categories.get(1).rules.first().amount.should.equal(22200);
            (+budget3.categories.get(1).rules.first().startDate).should.equal(+D`2010-10-01`); // Note we need to use '+' to compare PDates
            budget3.categories.get(1).metadata.get('editCount').should.equal(2);
        });

        it('can be deleted, changing related transactions to have a null categoryId', () => {
            const budget = new Budget({
                categoryGroups: [new CategoryGroup({id: 1, name: "Group"})],
                categories: [
                    new Category({id: 10, groupId: 1, name: "Activities"}),
                    new Category({id: 20, groupId: 1, name: "Housing"}),
                    new Category({id: 30, groupId: 1, name: "Transportation"}),
                ],
                transactions: [
                    new Transaction({id: 1, detail: [{categoryId: 10, amount: -100, description: "An Activity"}]}),
                    new Transaction({id: 2, detail: [{categoryId: 30, amount: 1000, description: "A transportation expense"}]}),
                    new Transaction({id: 3, detail: [{categoryId: 30, amount: -8000, description: "Another transportation expense"}]}),
                    new Transaction({id: 4, detail: [{categoryId: 20, amount: -5000, description: "Rent"}]}),
                    new Transaction({id: 5, detail: [{description: "A blank transaction"}]}),
                ],
            });
            const budget2 = budget.deleteCategory(30); // Delete "Transportation"
            budget.categories.size.should.equal(3);
            budget2.categories.size.should.equal(2);
            (budget2.categories.get(30) === undefined).should.be.true;
            // Check that the transactions were updated:
            should.equal(budget2.transactions.get(1).detail.first().categoryId, 10);
            should.equal(budget2.transactions.get(2).detail.first().categoryId, null);
            should.equal(budget2.transactions.get(3).detail.first().categoryId, null);
            should.equal(budget2.transactions.get(4).detail.first().categoryId, 20);
            should.equal(budget2.transactions.get(5).detail.first().categoryId, null);
        });

        describe('are stably sorted first by group order then in custom order', () => {
            const budget = new Budget({
                categoryGroups: [
                    new CategoryGroup({id: 10, name: "First Group"}),
                    new CategoryGroup({id:  5, name: "Second Group"}),
                    new CategoryGroup({id:  8, name: "Third Group"}),
                ],
                categories: [
                    new Category({id:  1, name:  "Cat 5-1", groupId:  5}),
                    new Category({id:  2, name:  "Cat 5-2", groupId:  5}),
                    new Category({id:  3, name:  "Cat 5-3", groupId:  5}),
                    new Category({id:  4, name:  "Cat 5-4", groupId:  5}),
                    new Category({id:  5, name:  "Cat 8-1", groupId:  8}),
                    new Category({id:  6, name:  "Cat 8-2", groupId:  8}),
                    new Category({id:  7, name:  "Cat 10-1", groupId:  10}),
                    new Category({id:  8, name:  "Cat 10-2", groupId:  10}),
                    new Category({id:  9, name:  "Cat 10-3", groupId:  10}),
                    new Category({id: 10, name:  "Cat 10-4", groupId:  10}),
                    new Category({id: 11, name:  "Cat 8-3", groupId:  8}), // Note this one is not in the right spot (should be with the other group 8 entries)
                ],
            });

            it("is enforced at budget init time", () => {
                Immutable.Map.isMap(budget.categories).should.be.true;
                budget.categories.valueSeq().map(cat => cat.name).toJS().should.deep.equal([
                    "Cat 10-1", // Category group 10 is the first category group
                    "Cat 10-2",
                    "Cat 10-3",
                    "Cat 10-4",
                    "Cat 5-1", // Category group 5 is the second category group
                    "Cat 5-2",
                    "Cat 5-3",
                    "Cat 5-4",
                    "Cat 8-1", // Category group 8 is the third category group
                    "Cat 8-2",
                    "Cat 8-3",
                ]);
            });

            it("can be modified with positionCategory()", () => {
                // Move 10-4 to be the second within category 10:
                const budget2 = budget.positionCategory(10, 1);
                // Move 5-1 to be last within category 5:
                const budget3 = budget2.positionCategory(1, 3);
                budget3.categories.valueSeq().map(cat => cat.name).toJS().should.deep.equal([
                    "Cat 10-1",
                    "Cat 10-4", // <-- Moved this one two spots up
                    "Cat 10-2",
                    "Cat 10-3",
                    "Cat 5-2",
                    "Cat 5-3",
                    "Cat 5-4",
                    "Cat 5-1", // <-- Moved this one two spots down
                    "Cat 8-1",
                    "Cat 8-2",
                    "Cat 8-3",
                ]);
            });

            it("puts categories at the end of the group when inserting them", () => {
                const budget2 = budget.updateCategory(new Category({id: 12, name: "Cat 5-5 (new)", groupId: 5}));
                budget2.categories.valueSeq().map(cat => cat.name).toJS().should.deep.equal([
                    "Cat 10-1",
                    "Cat 10-2",
                    "Cat 10-3",
                    "Cat 10-4",
                    "Cat 5-1",
                    "Cat 5-2",
                    "Cat 5-3",
                    "Cat 5-4",
                    "Cat 5-5 (new)",
                    "Cat 8-1",
                    "Cat 8-2",
                    "Cat 8-3",
                ]);
            });

            it("puts categories at the end of the group when moving them", () => {
                // Move category 7 (10-1) from group 10 to 5
                const budget2 = budget.updateCategory(budget.categories.get(7).merge({
                    groupId: 5,
                    name: "Cat 10-1 before, now 5-5"
                }));
                budget2.categories.valueSeq().map(cat => cat.name).toJS().should.deep.equal([
                    // Was here
                    "Cat 10-2",
                    "Cat 10-3",
                    "Cat 10-4",
                    "Cat 5-1",
                    "Cat 5-2",
                    "Cat 5-3",
                    "Cat 5-4",
                    "Cat 10-1 before, now 5-5", // Now here
                    "Cat 8-1",
                    "Cat 8-2",
                    "Cat 8-3",
                ]);
            });
        });

        it('cannot be modified with set()', () => {
            const budget = new Budget();
            Immutable.OrderedMap.isOrderedMap(budget.categories).should.be.true;
            (() => { budget.set('categories', new Immutable.OrderedMap()); }).should.throw();
        });

        it('must have a valid groupId', () => {
            const makeBudgetWithCategory = (args) => {
                return new Budget({
                    categoryGroups: [new CategoryGroup({id: 1, name: "Group"})],
                    categories: [new Category(Object.assign({id: 1, name: "Test Category"}, args))],
                });
            }
            (() => { makeBudgetWithCategory({groupId: 1}); }).should.not.throw();
            (() => { makeBudgetWithCategory({groupId: 18}); }).should.throw();
            (() => { makeBudgetWithCategory({groupId: null}); }).should.throw();
        });

    });

    describe('category groups', () => {

        it('are empty by default', () => {
            const budget = new Budget();
            budget.categoryGroups.size.should.equal(0);
        });

        it('can be initialized with initial values and their order is preserved', () => {
            const budget = new Budget({
                categoryGroups: [
                    new CategoryGroup({id: 1, name: "First Group"}),
                    new CategoryGroup({id: 3, name: "Second Group"}),
                    new CategoryGroup({id: 2, name: "Third Group"}),
                ],
            });
            Immutable.OrderedMap.isOrderedMap(budget.categoryGroups).should.be.true;
            budget.categoryGroups.size.should.equal(3);
            budget.categoryGroups.first().name.should.equal("First Group");
            budget.categoryGroups.last().name.should.equal("Third Group");
            budget.categoryGroups.get(1).name.should.equal("First Group");
            budget.categoryGroups.get(1).id.should.equal(1);
            budget.categoryGroups.valueSeq().get(0).name.should.equal("First Group");
            budget.categoryGroups.valueSeq().get(1).name.should.equal("Second Group");
            budget.categoryGroups.valueSeq().get(2).name.should.equal("Third Group");
            (budget.categoryGroups.get(200) === undefined).should.be.true;
        });

        it('cannot be modified with set()', () => {
            const budget = new Budget();
            Immutable.OrderedMap.isOrderedMap(budget.categoryGroups).should.be.true;
            (() => { budget.set('categoryGroups', new Immutable.OrderedMap()); }).should.throw();
        });

        it('can be deleted, unless categories exist in that group.', () => {
            const budget = new Budget({
                categoryGroups: [
                    new CategoryGroup({id: 1, name: "First Group"}),
                    new CategoryGroup({id: 2, name: "Second Group"}),
                ],
                categories: [
                    new Category({
                        id: 1,
                        name: "Test Category",
                        groupId: 1,
                    }),
                ],
            });
            (() => {
                budget.deleteCategoryGroup(1);
            }).should.throw();
            const budget2 = budget.deleteCategoryGroup(2);
            budget2.categoryGroups.size.should.equal(1);
            budget2.categoryGroups.first().name.should.equal("First Group");
        });

        it('can be created and modified with updateCategoryGroup()', () => {
            const budget = new Budget();
            budget.categoryGroups.size.should.equal(0);
            // Test insertion:
            const budget2 = budget.updateCategoryGroup(new CategoryGroup({
                id: 1,
                name: "First Group",
            }));
            budget2.categoryGroups.size.should.equal(1);
            budget2.categoryGroups.first().name.should.equal("First Group");
            // Test modification
            const budget3 = budget2.updateCategoryGroup(
                budget2.categoryGroups.get(1).set('name', "New Group Name")
            );
            budget3.categoryGroups.size.should.equal(1);
            budget3.categoryGroups.first().name.should.equal("New Group Name");
        });

        it('can be re-ordered using positionCategoryGroup()', () => {
            const budget = new Budget({
                categoryGroups: [
                    new CategoryGroup({id: 1, name: "Group 1"}),
                    new CategoryGroup({id: 2, name: "Group 2"}),
                    new CategoryGroup({id: 3, name: "Group 3"}),
                ],
            });

            const budget2 = budget.positionCategoryGroup(2, 0);
            budget2.categoryGroups.size.should.equal(3);
            budget2.categoryGroups.valueSeq().get(0).name.should.equal("Group 2");
            budget2.categoryGroups.valueSeq().get(1).name.should.equal("Group 1");
            budget2.categoryGroups.valueSeq().get(2).name.should.equal("Group 3");

            const budget3 = budget.positionCategoryGroup(1, 2);
            budget3.categoryGroups.size.should.equal(3);
            budget3.categoryGroups.valueSeq().get(0).name.should.equal("Group 2");
            budget3.categoryGroups.valueSeq().get(1).name.should.equal("Group 3");
            budget3.categoryGroups.valueSeq().get(2).name.should.equal("Group 1");
        });
    });

    describe('transactions', () => {

        it('are empty by default', () => {
            const budget = new Budget();
            budget.transactions.size.should.equal(0);
        });

        it('can be initialized with initial values', () => {
            const budget = new Budget({
                transactions: [
                    new Transaction({id: 15, who: "TestCo"}),
                ],
            });
            Immutable.OrderedMap.isOrderedMap(budget.transactions).should.be.true;
            budget.transactions.size.should.equal(1);
            budget.transactions.first().who.should.equal("TestCo");
            budget.transactions.get(15).who.should.equal("TestCo");
            (budget.transactions.get(200) === undefined).should.be.true;
        });

        it('sort initial values', () => {
            const budget = new Budget({
                transactions: [
                    new Transaction({id: 6, who: "JuneCo", date: PDate.create(2016, 5, 2)}),
                    new Transaction({id: 5, who: "MayCo", date: PDate.create(2016, 4, 2)}),
                    new Transaction({id: 100, who: "JanCo", date: PDate.create(2016, 0, 1)}),
                    new Transaction({id: 11, who: "NovCo", date: PDate.create(2016, 10, 1)}),
                ],
            });
            budget.transactions.size.should.equal(4);
            const result = budget.transactions.toArray();
            // Jan:
            result[0].id.should.equal(100);
            result[0].who.should.equal("JanCo");
            budget.transactions.first().who.should.equal("JanCo");
            budget.transactions.get(100).who.should.equal("JanCo");
            // May:
            result[1].id.should.equal(5);
            result[1].who.should.equal("MayCo");
            budget.transactions.get(5).who.should.equal("MayCo");
            // June:
            result[2].id.should.equal(6);
            result[2].who.should.equal("JuneCo");
            budget.transactions.get(6).who.should.equal("JuneCo");
            // Nov:
            result[3].id.should.equal(11);
            result[3].who.should.equal("NovCo");
            budget.transactions.get(11).who.should.equal("NovCo");
            budget.transactions.last().who.should.equal("NovCo");
        });

        it('cannot be modified with set()', () => {
            const budget = new Budget();
            Immutable.OrderedMap.isOrderedMap(budget.transactions).should.be.true;
            (() => { budget.set('transactions', new Immutable.OrderedMap()); }).should.throw();
        });

        it('can be deleted', () => {
            const budget1 = new Budget({
                transactions: [
                    new Transaction({id: 100, who: "JanCo", date: PDate.create(2016, 0, 1)}),
                    new Transaction({id: 5, who: "MayCo", date: PDate.create(2016, 4, 2)}),
                    new Transaction({id: 6, who: "JuneCo", date: PDate.create(2016, 5, 2)}),
                    new Transaction({id: 11, who: "NovCo", date: PDate.create(2016, 10, 1)}),
                ],
            });
            const budget2 = budget1.deleteTransaction(6);
            // Budget 1 should be unmodified:
            budget1.transactions.size.should.equal(4);
            // But Budget 2 should have only three transactions:
            budget2.transactions.size.should.equal(3);
            // And the order should be preserved:
            Immutable.is(
                budget2.transactions.valueSeq(),
                Immutable.Seq([  // Note: .deep.equal etc. considers all PDates equal
                    new Transaction({id: 100, who: "JanCo", date: PDate.create(2016, 0, 1)}),
                    new Transaction({id: 5, who: "MayCo", date: PDate.create(2016, 4, 2)}),
                    new Transaction({id: 11, who: "NovCo", date: PDate.create(2016, 10, 1)}),
                ])
            ).should.be.true;
        });

        it('can be modified', () => {
            const budget1 = new Budget({
                transactions: [
                    new Transaction({id: 100, who: "JanCo", date: PDate.create(2016, 0, 1)}),
                    new Transaction({id: 5, who: "MayCo", date: PDate.create(2016, 4, 2)}),
                    new Transaction({id: 6, who: "JuneCo", date: PDate.create(2016, 5, 2)}),
                    new Transaction({id: 11, who: "NovCo", date: PDate.create(2016, 10, 1)}),
                ],
            });
            const budget2 = budget1.updateTransaction(
                new Transaction({id: 6, who: "JuneCo 19", date: PDate.create(2016, 5, 19)})
            );
            // Budget 1 should be unmodified:
            budget1.transactions.get(6).who.should.equal("JuneCo");
            budget1.transactions.get(6).date.toString().should.equal("2016-06-02");
            // But Budget 2 should have the modified transaction:
            budget2.transactions.size.should.equal(4);
            budget2.transactions.get(6).who.should.equal("JuneCo 19");
            budget2.transactions.get(6).date.toString().should.equal("2016-06-19");
            // And the order should be preserved:
            budget2.transactions.toArray()[2].id.should.equal(6);
        });

        it('rejects an invalid accountId', () => {
            let budget = new Budget({
                accounts: [new Account({id: 10, name: "Cash", initialBalance: 8000, currencyCode: "CAD"})],
                transactions: [],
            });
            const addTransaction = (id, who, accountId) => {
                budget = budget.updateTransaction(new Transaction({id, who, accountId}));
            };
            // Invalid account ID should be rejected:
            (() => { addTransaction(1, "JuneCo", 0); }).should.throw();
            (() => { addTransaction(2, "JuneCo", 7); }).should.throw();
            // Valid account ID should be accepted:
            addTransaction(3, "ValidCo", 10);
            // Null account ID should be accepted:
            addTransaction(4, "NullCo", null);
            // Check for the modified transaction:
            budget.transactions.size.should.equal(2);
            budget.transactions.get(3).who.should.equal("ValidCo");
            budget.transactions.get(3).accountId.should.equal(10);
            budget.transactions.get(4).who.should.equal("NullCo");
            should.equal(budget.transactions.get(4).accountId, null);
        });

        it('stay sorted when a date is modified', () => {
            const budget1 = new Budget({
                transactions: [
                    new Transaction({id: 100, who: "JanCo", date: PDate.create(2016, 0, 1)}),
                    new Transaction({id: 5, who: "MayCo", date: PDate.create(2016, 4, 2)}),
                    new Transaction({id: 6, who: "JuneCo", date: PDate.create(2016, 5, 2)}),
                    new Transaction({id: 11, who: "NovCo", date: PDate.create(2016, 10, 1)}),
                ],
            });
            const budget2 = budget1.updateTransaction(
                new Transaction({id: 6, who: "FebCo", date: PDate.create(2016, 1, 2)})
            );
            // Budget 1 should be unmodified:
            budget1.transactions.get(6).who.should.equal("JuneCo");
            budget1.transactions.get(6).date.toString().should.equal("2016-06-02");
            // But Budget 2 should have the modified transaction:
            budget2.transactions.size.should.equal(4);
            budget2.transactions.get(6).who.should.equal("FebCo");
            budget2.transactions.get(6).date.toString().should.equal("2016-02-02");
            // And the order should be updated:
            budget2.transactions.toArray()[0].who.should.equal("JanCo");
            budget2.transactions.toArray()[1].who.should.equal("FebCo");
            budget2.transactions.toArray()[1].id.should.equal(6);
            budget2.transactions.toArray()[2].who.should.equal("MayCo");
            budget2.transactions.toArray()[3].who.should.equal("NovCo");
        });

        it('can be appended to, with correct sorting', () => {
            const budget1 = new Budget({
                transactions: [
                    new Transaction({id: 100, who: "JanCo", date: PDate.create(2016, 0, 1)}),
                    new Transaction({id: 5, who: "MayCo", date: PDate.create(2016, 4, 2)}),
                    new Transaction({id: 6, who: "JuneCo", date: PDate.create(2016, 5, 2)}),
                    new Transaction({id: 11, who: "NovCo", date: PDate.create(2016, 10, 1)}),
                ],
            });
            const budget2 = budget1.updateTransaction(
                new Transaction({id: 8, who: "AugustCo", date: PDate.create(2016, 7, 1)})
            ).updateTransaction(
                new Transaction({id: 50, who: "UnknownCo", date: null}) // null dates should be last
            );
            // Budget 1 should be unmodified:
            budget1.transactions.size.should.equal(4);
            // But Budget 2 should have the new transactions:
            budget2.transactions.size.should.equal(6);
            budget2.transactions.get(8).who.should.equal("AugustCo");
            budget2.transactions.get(50).who.should.equal("UnknownCo");
            // And the order should be correct:
            budget2.transactions.map(t => t.who).toArray().should.deep.equal([
                "JanCo", "MayCo", "JuneCo", "AugustCo", "NovCo", "UnknownCo",
            ]);
            budget2.transactions.last().id.should.equal(50);
        });

    });

    describe('accountBalance', () => {

        const accounts = [
            new Account({id: 1, name: "Cash", initialBalance: 8000, currencyCode: "CAD"}),
            new Account({id: 2, name: "Chequing", initialBalance: 123456, currencyCode: "CAD"}),
            new Account({id: 3, name: "Savings", initialBalance: 456789, currencyCode: "CAD"}),
            new Account({id: 4, name: "Credit Card", initialBalance: -50000, currencyCode: "CAD"}),
        ];

        it('equals Account.initialBalance when there are no transactions', () => {
            const budget = new Budget({
                accounts,
                transactions: [],
            });
            budget.accountBalances[1].should.equal(8000); // $80.00 Cash
            budget.accountBalances[2].should.equal(123456); // $1,234.56 Chequing
            budget.accountBalances[3].should.equal(456789); // $4,567.89 Savings
            budget.accountBalances[4].should.equal(-50000); // -500.00 Credit Card
        });

        it('sums the balance of each account for all non-pending transactions', () => {
            const budget = new Budget({
                accounts,
                transactions: [
                    new Transaction({id: 1, accountId: 1, detail: [{amount: -100, description: "Spent $1 cash"}], pending: false}),
                    new Transaction({id: 2, accountId: 3, detail: [{amount: 10000, description: "Added $100 to savings"}], pending: false}),
                    new Transaction({id: 3, accountId: 4, detail: [{amount: -5000, description: "(Pending) will spend $50 on credit card"}], pending: true}),
                    new Transaction({id: 4, accountId: 1, detail: [{amount: 4500, description: "Got $45 cash"}], pending: false}),
                ],
            });
            budget.accountBalances[1].should.equal(8000 - 100 + 4500); // Cash
            budget.accountBalances[2].should.equal(123456); // Chequing
            budget.accountBalances[3].should.equal(456789 + 10000); // Savings
            budget.accountBalances[4].should.equal(-50000); // Credit card

            const budget2 = budget.updateTransaction(
                // Make the credit card transaction non-pending:
                budget.transactions.get(3).set('pending', false).setIn(['detail', 0, 'description'], 'Spent $50 on credit card')
            ).updateTransaction(
                // And add another credit card transaction
                new Transaction({id: 5, accountId: 4, detail: [{amount: -1545, description: "Spent $15.45 on credit card"}], pending: false})
            );

            budget2.accountBalances[4].should.equal(-50000 - 5000 -1545); // Credit card

            // The original budget should be unmodified:
            budget.accountBalances[4].should.equal(-50000); // Credit card
        });

        it('considers transactions that have no accountId separately', () => {
            const budget = new Budget({
                accounts,
                transactions: [
                    new Transaction({id: 1, accountId: 1, detail: [{amount: -100, description: "Spent $1 cash"}], pending: false}),
                    new Transaction({id: 3, accountId: null, detail: [{amount: -1212, description: "$50 with account unspecified"}], pending: false}),
                    new Transaction({id: 4, accountId: 1, detail: [{amount: 4500, description: "Got $45 cash"}], pending: false}),
                ],
            });
            budget.accountBalances[1].should.equal(8000 - 100 + 4500); // Cash
            budget.accountBalances[4].should.equal(-50000); // Credit card
        });

    });

    describe('accountBalanceAsOfTransaction', () => {
        const budget = new Budget({
            accounts: [
                new Account({id: 1, name: "Cash", initialBalance: 8000, currencyCode: "CAD"}),
                new Account({id: 2, name: "Chequing", initialBalance: 123456, currencyCode: "CAD"}),
                new Account({id: 3, name: "Savings", initialBalance: 456789, currencyCode: "CAD"}),
                new Account({id: 4, name: "Credit Card", initialBalance: -50000, currencyCode: "CAD"}),
            ],
            transactions: [
                new Transaction({date: D`2010-10-01`, id: 1, accountId: 1, detail: [{amount: -100, description: "Spent $1 cash"}], pending: false}),
                new Transaction({date: D`2010-10-02`, id: 2, accountId: 3, detail: [{amount: 10000, description: "Added $100 to savings"}], pending: false}),
                new Transaction({date: D`2010-10-03`, id: 3, accountId: 4, detail: [{amount: -5000, description: "(Pending) will spend $50 on credit card"}], pending: true}),
                new Transaction({date: D`2010-10-04`, id: 4, accountId: 1, detail: [{amount: 4500, description: "Got $45 cash"}], pending: false}),
                new Transaction({date: D`2010-10-05`, id: 5, accountId: 4, detail: [{amount: -9000, description: "Spent $90 on credit card"}], pending: false}),
            ],
        });

        it('can correctly determine the balance of any account as of any non-pending dated transaction', () => {
            // First transaction, spent $1 cash:
            budget.accountBalanceAsOfTransaction(1, 1).should.equal(8000 - 100); // Cash
            budget.accountBalanceAsOfTransaction(1, 2).should.equal(123456); // Chequing
            budget.accountBalanceAsOfTransaction(1, 3).should.equal(456789); // Savings
            budget.accountBalanceAsOfTransaction(1, 4).should.equal(-50000); // Credit Card
            // Second transaction, added $100 to savings:
            budget.accountBalanceAsOfTransaction(2, 1).should.equal(8000 - 100); // Cash
            budget.accountBalanceAsOfTransaction(2, 2).should.equal(123456); // Chequing
            budget.accountBalanceAsOfTransaction(2, 3).should.equal(456789 + 10000); // Savings
            budget.accountBalanceAsOfTransaction(2, 4).should.equal(-50000); // Credit Card
            // Third transaction is pending so should not affect anything, and should return undefined.
            should.equal(budget.accountBalanceAsOfTransaction(3, 1), undefined);
            should.equal(budget.accountBalanceAsOfTransaction(3, 2), undefined);
            should.equal(budget.accountBalanceAsOfTransaction(3, 3), undefined);
            should.equal(budget.accountBalanceAsOfTransaction(3, 4), undefined);
            // Fourth transaction, got $45 cash:
            budget.accountBalanceAsOfTransaction(4, 1).should.equal(8000 - 100 + 4500); // Cash
            budget.accountBalanceAsOfTransaction(4, 2).should.equal(123456); // Chequing
            budget.accountBalanceAsOfTransaction(4, 3).should.equal(456789 + 10000); // Savings
            budget.accountBalanceAsOfTransaction(4, 4).should.equal(-50000); // Credit Card
            // Fifth transaction, spent $90 on credit card:
            budget.accountBalanceAsOfTransaction(5, 1).should.equal(8000 - 100 + 4500); // Cash
            budget.accountBalanceAsOfTransaction(5, 2).should.equal(123456); // Chequing
            budget.accountBalanceAsOfTransaction(5, 3).should.equal(456789 + 10000); // Savings
            budget.accountBalanceAsOfTransaction(5, 4).should.equal(-50000 - 9000); // Credit Card
        });
    });

    describe('categoryBalancesOnDate', () => {

        const [DINING, GROCERIES, RENT] = [10, 20, 30];

        const budget = new Budget({
            startDate: D`2016-01-01`,
            endDate: D`2016-12-31`,
            currencyCode: 'CAD',
            categoryGroups: [new CategoryGroup({id: 1, name: "Expenses"})],
            categories: [
                new Category({id: DINING, name: "Dining", groupId: 1, currencyCode: "CAD"}),
                new Category({id: GROCERIES, name: "Groceries", groupId: 1, currencyCode: "CAD"}),
                new Category({id: RENT, name: "Rent", groupId: 1, currencyCode: "CAD"}),
            ],
            transactions: [
                // Spent $10 dining on Jan 10:
                new Transaction({id: 100, date: D`2016-01-10`, detail: [{amount: -1000, categoryId: DINING}], pending: false}),
                // Spent $50 on groceries on Jan 15:
                new Transaction({id: 101, date: D`2016-01-15`, detail: [{amount: -5000, categoryId: GROCERIES}], pending: false}),
                // Spent $600 on rent on Jan 16:
                new Transaction({id: 102, date: D`2016-01-16`, detail: [{amount: -60000, categoryId: RENT}], pending: false}),
                // Spent $20 dining on Jan 16:
                new Transaction({id: 103, date: D`2016-01-16`, detail: [{amount: -2000, categoryId: DINING}], pending: false}),
            ],
        });

        it('shows all categories have a balance of zero initially.', () => {
            // Jan 1:
            const balances = budget.categoryBalancesOnDate(budget.startDate);
            balances.get(DINING, 0).should.equal(0);
            balances.get(GROCERIES, 0).should.equal(0);
            balances.get(RENT, 0).should.equal(0);
        });

        it('works for sample transactions up to Jan 15, and is inclusive', () => {
            // Jan 15:
            const balances = budget.categoryBalancesOnDate(D`2016-01-15`);
            balances.get(DINING, 0).should.equal(-1000);
            balances.get(GROCERIES, 0).should.equal(-5000);
            balances.get(RENT, 0).should.equal(0);
        });

        it('works for sample transactions up to Jan 16, and is inclusive', () => {
            // Jan 16:
            const balances = budget.categoryBalancesOnDate(D`2016-01-16`);
            balances.get(DINING, 0).should.equal(-3000);
            balances.get(GROCERIES, 0).should.equal(-5000);
            balances.get(RENT, 0).should.equal(-60000);
        });

        it('will include transactions that come before the budget start date', () => {
            const budget2 = budget.updateTransaction(new Transaction({
                id: 200, date: D`2015-06-06`, detail: [{amount: -4321, categoryId: DINING}]
            }));
            const balances = budget2.categoryBalancesOnDate(budget.startDate);
            balances.get(DINING, 0).should.equal(-4321);
            balances.get(GROCERIES, 0).should.equal(0);
        });

        it('correctly handles transactions that move from one category to another', () => {
            const balances = budget.categoryBalancesOnDate(budget.endDate);
            balances.get(DINING, 0).should.equal(-3000);
            balances.get(GROCERIES, 0).should.equal(-5000);
            balances.get(RENT, 0).should.equal(-60000);
            const budget2 = budget.updateTransaction(new Transaction({
                id: 200, date: D`2016-01-25`, detail: [
                    {amount: -1200, categoryId: DINING},
                    {amount: +1200, categoryId: GROCERIES}
                ],
            }));
            budget2.transactions.get(200).amount.should.equal(0);
            const balances2 = budget2.categoryBalancesOnDate(budget.endDate);
            balances2.get(DINING, 0).should.equal(-4200);
            balances2.get(GROCERIES, 0).should.equal(-3800);
            balances2.get(RENT, 0).should.equal(-60000);
        });

        it('can be used via the categoryBalanceByDate(categoryId, date) shortcut', () => {
            budget.categoryBalanceByDate(DINING, D`2016-01-15`).should.equal(-1000);
            budget.categoryBalanceByDate(GROCERIES, D`2016-01-15`).should.equal(-5000);
            budget.categoryBalanceByDate(RENT, D`2016-01-15`).should.equal(0);
            budget.categoryBalanceByDate(DINING, D`2016-01-16`).should.equal(-3000);
            budget.categoryBalanceByDate(GROCERIES, D`2016-01-16`).should.equal(-5000);
            budget.categoryBalanceByDate(RENT, D`2016-01-16`).should.equal(-60000);
        });

    });

    describe('categoryBudgetsOnDate', () => {

        const [DINING, GROCERIES, INCOME] = [10, 20, 30];

        const budget = new Budget({
            startDate: D`2016-01-01`,
            endDate: D`2016-12-31`,
            currencyCode: 'CAD',
            categoryGroups: [
                new CategoryGroup({id: 1, name: "Expenses"}),
                new CategoryGroup({id: 2, name: "Income"}),
            ],
            categories: [
                new Category({id: DINING, name: "Dining", groupId: 1, currencyCode: "CAD", rules: [
                    // Dining: $100 per 5 days
                    {amount: -10000, repeatN: 5, period: Prophecy.CategoryRulePeriod.Day},
                ]}),
                new Category({id: GROCERIES, name: "Groceries", groupId: 1, currencyCode: "CAD", rules: [
                    // Groceries: $500/month from 2014 until mid-2016
                    {amount: -50000, repeatN: 1, period: Prophecy.CategoryRulePeriod.Month, startDate: D`2014-01-01`, endDate: D`2016-06-30`},
                    // Then decreased to $450/month:
                    {amount: -45000, repeatN: 1, period: Prophecy.CategoryRulePeriod.Month, startDate: D`2016-07-01`},
                ]}),
                // An automatic category, whose budget is defined based on transactions.
                new Category({id: INCOME, name: "Income", groupId: 2, currencyCode: "CAD", rules: null}),
            ],
            transactions: [
                // Spent $10 dining on Jan 10:
                new Transaction({id: 100, date: D`2016-01-10`, detail: [{amount: -1000, categoryId: DINING}], pending: false}),
                // Spent $50 on groceries on Jan 15:
                new Transaction({id: 101, date: D`2016-01-15`, detail: [{amount: -5000, categoryId: GROCERIES}], pending: false}),
                // Earned $1500 Jan 15:
                new Transaction({id: 102, date: D`2016-01-15`, detail: [{amount: +150000, categoryId: INCOME}], pending: false}),
                // (Pending) Earned $1500 Feb 15:
                new Transaction({id: 103, date: D`2016-02-15`, detail: [{amount: +150000, categoryId: INCOME}], pending: false}),
            ],
        });

        it("has correct values for sample 2016 budget on 2016-01-01", () => {
            const budgets = budget.categoryBudgetsOnDate(budget.startDate);
            budgets.get(DINING).should.equal(-10000); // day 1 of "100 every 5 days"
            budgets.get(GROCERIES).should.equal(-50000); // $500/month in first half of the year. Only includes time within budget date range (2016).
            budgets.get(INCOME).should.equal(0);
        });

        it("has correct values for sample 2016 budget on 2016-01-15", () => {
            const budgets = budget.categoryBudgetsOnDate(D`2016-01-15`);
            budgets.get(DINING).should.equal(3 * -10000); // day 15 of "100 every 5 days"
            budgets.get(GROCERIES).should.equal(-50000);
            budgets.get(INCOME).should.equal(+150000);
        });

        it("has correct values for sample 2016 budget on 2016-01-16", () => {
            const budgets = budget.categoryBudgetsOnDate(D`2016-01-16`);
            budgets.get(DINING).should.equal(4 * -10000); // day 16 of "100 every 5 days"
            budgets.get(GROCERIES).should.equal(-50000);
            budgets.get(INCOME).should.equal(+150000);
        });

        it("has correct values for sample 2016 budget on 2016-02-15", () => {
            const budgets = budget.categoryBudgetsOnDate(D`2016-02-15`);
            budgets.get(DINING).should.equal(10 * -10000); // day 46 of "100 every 5 days"
            budgets.get(GROCERIES).should.equal(2 * -50000); // $500/month, now in second month
            budgets.get(INCOME).should.equal(2 * +150000);
        });

        it("has correct values for sample 2016 budget groceries on 2016-07-01", () => {
            const budgets = budget.categoryBudgetsOnDate(D`2016-07-01`);
            budgets.get(GROCERIES).should.equal(6 * -50000 + 1 * -45000); // $500/month through June, $450/mo for July
        });

        it("has correct values for sample 2016 budget groceries on 2016-08-31", () => {
            const budgets = budget.categoryBudgetsOnDate(D`2016-08-31`);
            budgets.get(GROCERIES).should.equal(6 * -50000 + 2 * -45000); // $500/month through June, $450/mo for July & August
        });

    });

    describe('serialization', () => {

        const budget1 = new Budget({
            id: 'budget1',
            name: "A Test Budget",
            startDate: D`2016-01-01`,
            endDate: D`2016-12-31`,
            currencyCode: "CAD",
            accounts: [
                new Account({id: 1, name: "Cash", initialBalance: 8000, currencyCode: "CAD"}),
            ],
            categoryGroups: [
                new CategoryGroup({id: 123, name: "Expenses"}),
            ],
            categories: [
                new Category({id: 300, name: "Bobs", groupId: 123, currencyCode: "CAD"}),
            ],
            transactions: [
                new Transaction({id: 10, who: "BobCo", accountId: 1, detail: [{amount: -100, categoryId: 300, description: "Spent $1 cash"}], pending: false, isTransfer: false, metadata: {foo: "bar"}}),
            ],
        });

        const budget1ExpectedJS = {
            version: {major: Prophecy.version.major, minor: Prophecy.version.minor},
            id: 'budget1',
            name: "A Test Budget",
            startDate: 5844,
            endDate: 6209,
            currencyCode: "CAD",
            accounts: [{id: 1, name: "Cash", initialBalance: 8000, currencyCode: "CAD", metadata: {}}, ],
            categoryGroups: [
                {id: 123, name: "Expenses"},
            ],
            categories: [
                {id: 300, name: "Bobs", groupId: 123, currencyCode: "CAD", notes: "", rules: null, metadata: {}},
            ],
            transactions: [
                {id: 10, date: null, who: "BobCo", accountId: 1, detail: [{amount: -100, categoryId: 300, description: "Spent $1 cash"}], pending: false, isTransfer: false, metadata: {foo: "bar"}, userId: null}
            ],
        };

        const budget2 = new Budget({
            id: 'budget2',
            name: "Another Test Budget",
            startDate: D`2016-01-01`,
            endDate: D`2016-12-31`,
            currencyCode: "USD",
        });

        const budget2ExpectedJS = {
            version: {major: Prophecy.version.major, minor: Prophecy.version.minor},
            id: 'budget2',
            name: "Another Test Budget",
            startDate: 5844,
            endDate: 6209,
            currencyCode: "USD",
            accounts: [],
            categories: [],
            categoryGroups: [],
            transactions: [],
        };

        it('serializes to JSON', () => {
            const json1 = JSON.stringify(budget1);
            JSON.parse(json1).should.deep.equal(budget1ExpectedJS);
            const json2 = JSON.stringify(budget2);
            JSON.parse(json2).should.deep.equal(budget2ExpectedJS);
        });

        it('serializes to JS', () => {
            budget1.toJS().should.deep.equal(budget1ExpectedJS);
            budget2.toJS().should.deep.equal(budget2ExpectedJS);
        });

        it('serializes to JSON and back', () => {
            const json1 = JSON.stringify(budget1);
            const restored1 = Budget.fromJS(JSON.parse(json1));
            should.equal(Immutable.is(restored1, budget1), true);

            const json2 = JSON.stringify(budget2);
            const restored2 = Budget.fromJS(JSON.parse(json2));
            should.equal(Immutable.is(restored2, budget2), true);
        })
    });

});
