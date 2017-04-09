"use strict";
const should = require('chai').should();
const Prophecy = require('../../prophecy-dist');
const createStore = require('redux').createStore;

const actions = Prophecy.actions;
const D = Prophecy.PDate.parseTemplateLiteral;
// For testing, use a modified reducer that ensures actions are JSON-serializable:
const testReducer = (state, action) => {
    action = JSON.parse(JSON.stringify(action));
    return Prophecy.reducer(state, action);
}

/**
 * Create a new redux store, using the Prophecy reducer.
 */
function newStore(initialState = undefined) {
    return createStore(testReducer, initialState);
}


describe('Prophecy Redux API', function() {

    describe('actions', () => {

        /**
         * Test that an action's inverse action perfectly undoes the action.
         */
        function testUndo(action, initialBudget = new Prophecy.Budget()) {
            const original = initialBudget;
            const modified = testReducer(original, action);
            const inverseAction = Prophecy.inverter(original, action);
            should.not.equal(inverseAction, null);
            const unmodified = testReducer(modified, inverseAction);
            should.equal(original.equals(modified), false);
            should.equal(original.equals(unmodified), true);
        }

        describe('NOOP', () => {
            const action = {type: actions.NOOP};

            it('has no effect', () => {
                const budget1 = new Prophecy.Budget({currencyCode: "CAD"});
                const budget2 = testReducer(budget1, action);
                should.equal(Prophecy.Immutable.is(budget1, budget2), true);
            });

            it('is its own inverse', () => {
                const inverseAction = Prophecy.inverter(new Prophecy.Budget(), action);
                should.not.equal(inverseAction, null);
                inverseAction.type.should.equal(actions.NOOP);
            });
        });

        describe('SET_CURRENCY', () => {
            it('sets the budget currency', () => {
                const budget = testReducer(undefined, {type: actions.SET_CURRENCY, currencyCode: "XBT"});
                budget.currencyCode.should.equal("XBT");
            });

            it('has an inverse', () => {
                testUndo({type: actions.SET_CURRENCY, currencyCode: "CAD"});
            });
        });

        describe('SET_DATE', () => {
            it('sets the budget startDate and/or endDate', () => {
                const budget = testReducer(undefined, {type: actions.SET_DATE, startDate: +D`2016-01-02`, endDate: +D`2017-02-03`});
                budget.startDate.toString().should.equal("2016-01-02");
                budget.endDate.toString().should.equal("2017-02-03");

                const budget2 = testReducer(budget, {type: actions.SET_DATE, startDate: +D`2016-06-15`})
                budget2.startDate.toString().should.equal("2016-06-15");
                budget2.endDate.toString().should.equal("2017-02-03");

                const budget3 = testReducer(budget2, {type: actions.SET_DATE, endDate: +D`2016-11-30`})
                budget3.startDate.toString().should.equal("2016-06-15");
                budget3.endDate.toString().should.equal("2016-11-30");
            });

            it('has an inverse', () => {
                testUndo({type: actions.SET_DATE, startDate: +D`2016-01-02`, endDate: +D`2017-02-03`});
            });
        });

        describe('SET_NAME', () => {
            it('sets the budget name', () => {
                const budget = testReducer(undefined, {type: actions.SET_NAME, name: "Foobar"});
                budget.name.should.equal("Foobar");
            });

            it('has an inverse', () => {
                testUndo({type: actions.SET_NAME, name: "New Name"});
            });
        });

        describe('DELETE_ACCOUNT', () => {
            const initialBudget = new Prophecy.Budget({
                accounts: [new Prophecy.Account({id: 42, name: "Cash"})],
                transactions: [new Prophecy.Transaction({id: 15, who: "TestCo", accountId: 42})],
            });

            it("can delete an account", () => {
                const budget2 = testReducer(initialBudget, {type: actions.DELETE_ACCOUNT, id: 42});
                initialBudget.accounts.size.should.equal(1);
                budget2.accounts.size.should.equal(0);
                should.equal(budget2.transactions.get(15).accountId, null);
            });

            it('has an inverse', () => {
                testUndo({type: actions.DELETE_ACCOUNT, id: 42}, initialBudget);
            });
        });

        describe('UPDATE_ACCOUNT', () => {
            // A couple actions we'll use for multiple tests:
            const basicInsertAction = {
                type: actions.UPDATE_ACCOUNT,
                id: 10,
                data: {name: "Test Account"},
            };
            const subsequentUpdateAction = {
                type: actions.UPDATE_ACCOUNT,
                id: 10,
                data: {initialBalance: 12300, currencyCode: 'CAD'},
            };

            it('can create an account', () => {
                const budget1 = new Prophecy.Budget();
                budget1.accounts.size.should.equal(0);

                // Try an insert:
                const budget2 = testReducer(budget1, basicInsertAction);
                budget2.accounts.size.should.equal(1);
                budget2.accounts.get(10).name.should.equal("Test Account");
            });

            it('can modify an account', () => {
                const budget2 = testReducer(undefined, basicInsertAction);
                budget2.accounts.size.should.equal(1);
                budget2.accounts.get(10).name.should.equal("Test Account");

                // Try an update:
                const budget3 = testReducer(budget2, subsequentUpdateAction);
                budget3.accounts.size.should.equal(1);
                budget3.accounts.get(10).name.should.equal("Test Account");
                budget3.accounts.get(10).initialBalance.should.equal(12300);
                budget3.accounts.get(10).currencyCode.should.equal('CAD');
            });

            it('has an inverse (insertion)', () => { testUndo(basicInsertAction); });
            it('has an inverse (modification)', () => {
                const initialBudget = testReducer(undefined, basicInsertAction);
                testUndo(subsequentUpdateAction, initialBudget);
            });

            const initialBudget = new Prophecy.Budget({
                accounts: [
                    new Prophecy.Account({id: 10, name: "Account A"}),
                    new Prophecy.Account({id: 11, name: "Account B"}),
                    new Prophecy.Account({id: 12, name: "Account C"}),
                    new Prophecy.Account({id: 13, name: "Account D"}),
                ],
            });

            it("can change the order of accounts", () => {
                const budget2 = testReducer(initialBudget, {type: actions.UPDATE_ACCOUNT, id: 12, index: 0});
                initialBudget.accounts.reduce((str, account) => str += account.name.substring(8), "").should.equal('ABCD');
                budget2.accounts.reduce((str, account) => str += account.name.substring(8), "").should.equal('CABD');
            });

            it('has an inverse (re-ordering)', () => {
                testUndo({type: actions.UPDATE_ACCOUNT, id: 12, index: 0}, initialBudget);
            });
        });

        describe('DELETE_CATEGORY', () => {
            const initialBudget = new Prophecy.Budget({
                categoryGroups: [new Prophecy.CategoryGroup({id: 15, name: "Transportation"})],
                categories: [new Prophecy.Category({id: 15, name: "Test Category", groupId: 15})],
                transactions: [new Prophecy.Transaction({id: 20, detail: [{categoryId: 15, amount: 500}]})],
            });

            it("can delete a category", () => {
                const budget2 = testReducer(initialBudget, {type: actions.DELETE_CATEGORY, id: 15});
                initialBudget.categories.size.should.equal(1);
                budget2.categories.size.should.equal(0);
                should.equal(budget2.transactions.first().detail.first().categoryId, null);
            });

            it('has an inverse', () => {
                testUndo({type: actions.DELETE_CATEGORY, id: 15}, initialBudget);
            });
        });

        describe('UPDATE_CATEGORY', () => {
            const budget1 = new Prophecy.Budget({
                categoryGroups: [
                    new Prophecy.CategoryGroup({id: 10, name: "Category Group A"}),
                    new Prophecy.CategoryGroup({id: 11, name: "Category Group B"}),
                    new Prophecy.CategoryGroup({id: 12, name: "Category Group C"}),
                    new Prophecy.CategoryGroup({id: 13, name: "Category Group D"}),
                ],
            });
            const basicInsertAction =      {type: actions.UPDATE_CATEGORY, id: 10, data: {name: "Cat A-1", groupId: 10}};
            const subsequentUpdateAction = {type: actions.UPDATE_CATEGORY, id: 10, data: {name: "Cat A-1-M", groupId: 10}};

            it('can create a category', () => {
                budget1.categories.size.should.equal(0);
                // Try an insert:
                const budget2 = testReducer(budget1, basicInsertAction);
                budget2.categories.size.should.equal(1);
                budget2.categories.get(10).name.should.equal("Cat A-1");
            });

            it('can modify a category', () => {
                const budget2 = testReducer(budget1, basicInsertAction);
                budget2.categories.size.should.equal(1);
                budget2.categories.get(10).name.should.equal("Cat A-1");
                // Try an update:
                const budget3 = testReducer(budget2, subsequentUpdateAction);
                budget3.categories.size.should.equal(1);
                budget3.categories.get(10).name.should.equal("Cat A-1-M");
            });

            it("can change the order of categories", () => {
                let budget2 = budget1;
                budget2 = testReducer(budget2, {type: actions.UPDATE_CATEGORY, id: 10, data: {name: "Cat A-Zuerst", groupId: 10}});
                budget2 = testReducer(budget2, {type: actions.UPDATE_CATEGORY, id: 20, data: {name: "Cat A-Second", groupId: 10}});
                budget2 = testReducer(budget2, {type: actions.UPDATE_CATEGORY, id: 30, data: {name: "Cat A-3rd", groupId: 10}});
                budget2 = testReducer(budget2, {type: actions.UPDATE_CATEGORY, id: 40, data: {name: "Cat B-1", groupId: 11}});
                budget2 = testReducer(budget2, {type: actions.UPDATE_CATEGORY, id: 50, data: {name: "Cat B-2", groupId: 11}});
                budget2 = testReducer(budget2, {type: actions.UPDATE_CATEGORY, id: 60, data: {name: "Cat C-2", groupId: 12}});
                budget2.categories.reduce((str, category) => str += category.name.substr(4, 3) + ' ', "").should.equal('A-Z A-S A-3 B-1 B-2 C-2 ');
                const budget3 = testReducer(budget2, {type: actions.UPDATE_CATEGORY, id: 50, data: {name: "Cat A-Δ", groupId: 10}}); // B-2 becomes A-delta
                budget3.categories.reduce((str, category) => str += category.name.substr(4, 3) + ' ', "").should.equal('A-Z A-S A-3 A-Δ B-1 C-2 ');
                // Also test that we could have done that and specify a new index within group A at the same time:
                const budget4 = testReducer(budget2, {type: actions.UPDATE_CATEGORY, id: 50, data: {name: "Cat A-0", groupId: 10}, index: 0}); // B-2 becomes A-0
                budget4.categories.reduce((str, category) => str += category.name.substr(4, 3) + ' ', "").should.equal('A-0 A-Z A-S A-3 B-1 C-2 ');
            });

            it('has an inverse (insertion)', () => { testUndo(basicInsertAction, budget1); });
            it('has an inverse (modification)', () => {
                const initialBudget = testReducer(budget1, basicInsertAction);
                testUndo(subsequentUpdateAction, initialBudget);
            });
            it('has an inverse (re-ordering)', () => {
                let budget = budget1;
                budget = testReducer(budget, {type: actions.UPDATE_CATEGORY, id: 10, data: {name: "Cat A-1", groupId: 10}});
                budget = testReducer(budget, {type: actions.UPDATE_CATEGORY, id: 20, data: {name: "Cat A-2", groupId: 10}});
                budget = testReducer(budget, {type: actions.UPDATE_CATEGORY, id: 30, data: {name: "Cat A-3", groupId: 10}});
                testUndo({type: actions.UPDATE_CATEGORY, id: 30, index: 0}, budget);
            });
        });

        describe('DELETE_CATEGORY_GROUP', () => {
            const initialBudget = new Prophecy.Budget({
                categoryGroups: [new Prophecy.CategoryGroup({id: 15, name: "Transportation"})],
            });

            it("can delete a category group", () => {
                const budget2 = testReducer(initialBudget, {type: actions.DELETE_CATEGORY_GROUP, id: 15});
                initialBudget.categoryGroups.size.should.equal(1);
                budget2.categoryGroups.size.should.equal(0);
            });

            it('has an inverse', () => {
                testUndo({type: actions.DELETE_CATEGORY_GROUP, id: 15}, initialBudget);
            });
        });

        describe('UPDATE_CATEGORY_GROUP', () => {
            const basicInsertAction =      {type: actions.UPDATE_CATEGORY_GROUP, id: 10, data: {name: "A Test Group"}};
            const subsequentUpdateAction = {type: actions.UPDATE_CATEGORY_GROUP, id: 10, data: {name: "Modified Test Group"}};

            it('can create a category group', () => {
                const budget1 = new Prophecy.Budget();
                budget1.categoryGroups.size.should.equal(0);
                // Try an insert:
                const budget2 = testReducer(budget1, basicInsertAction);
                budget2.categoryGroups.size.should.equal(1);
                budget2.categoryGroups.get(10).name.should.equal("A Test Group");
            });

            it('can modify a category group', () => {
                const budget2 = testReducer(undefined, basicInsertAction);
                budget2.categoryGroups.size.should.equal(1);
                budget2.categoryGroups.get(10).name.should.equal("A Test Group");
                // Try an update:
                const budget3 = testReducer(budget2, subsequentUpdateAction);
                budget3.categoryGroups.size.should.equal(1);
                budget3.categoryGroups.get(10).name.should.equal("Modified Test Group");
            });

            const initialBudget = new Prophecy.Budget({
                categoryGroups: [
                    new Prophecy.CategoryGroup({id: 10, name: "Category Group A"}),
                    new Prophecy.CategoryGroup({id: 11, name: "Category Group B"}),
                    new Prophecy.CategoryGroup({id: 12, name: "Category Group C"}),
                    new Prophecy.CategoryGroup({id: 13, name: "Category Group D"}),
                ],
            });

            it("can change the order of category groups", () => {
                const budget2 = testReducer(initialBudget, {type: actions.UPDATE_CATEGORY_GROUP, id: 12, index: 0});
                initialBudget.categoryGroups.reduce((str, group) => str += group.name.substring(15), "").should.equal('ABCD');
                budget2.categoryGroups.reduce((str, group) => str += group.name.substring(15), "").should.equal('CABD');
            });


            it('has an inverse (insertion)', () => { testUndo(basicInsertAction); });
            it('has an inverse (modification)', () => {
                const initialBudget = testReducer(undefined, basicInsertAction);
                testUndo(subsequentUpdateAction, initialBudget);
            });
            it('has an inverse (re-ordering)', () => {
                testUndo({type: actions.UPDATE_CATEGORY_GROUP, id: 12, index: 0}, initialBudget);
            });
        });

        describe('DELETE_TRANSACTION', () => {
            const initialBudget = new Prophecy.Budget({
                transactions: [new Prophecy.Transaction({id: 15, who: "TestCo"})],
            });

            it("can delete a transaction", () => {
                const budget2 = testReducer(initialBudget, {type: actions.DELETE_TRANSACTION, id: 15});
                initialBudget.transactions.size.should.equal(1);
                budget2.transactions.size.should.equal(0);
            });

            it('has an inverse', () => {
                testUndo({type: actions.DELETE_TRANSACTION, id: 15}, initialBudget);
            });
        });

        describe('UPDATE_TRANSACTION', () => {
            // A couple actions we'll use for multiple tests:
            const basicInsertAction = {
                type: actions.UPDATE_TRANSACTION,
                id: 10,
                data: {date: +D`2011-12-13`, who: "TestCo"},
            };
            const subsequentUpdateAction = {
                type: actions.UPDATE_TRANSACTION,
                id: 10,
                data: {date: +D`2010-10-10`, detail: [
                    {amount: 123, description: "Desc"},
                ]},
            };

            it('can create a transaction', () => {
                const budget1 = new Prophecy.Budget();
                budget1.transactions.size.should.equal(0);

                // Try an insert:
                const budget2 = testReducer(budget1, basicInsertAction);
                budget2.transactions.size.should.equal(1);
                budget2.transactions.get(10).date.toString().should.equal("2011-12-13");
                budget2.transactions.get(10).who.should.equal("TestCo");
            });

            it('can modify a transaction', () => {
                const budget2 = testReducer(undefined, basicInsertAction);
                budget2.transactions.size.should.equal(1);
                budget2.transactions.get(10).who.should.equal("TestCo");

                // Try an update:
                const budget3 = testReducer(budget2, subsequentUpdateAction);
                budget3.transactions.size.should.equal(1);
                budget3.transactions.get(10).date.toString().should.equal("2010-10-10");
                budget3.transactions.get(10).who.should.equal("TestCo");
                budget3.transactions.get(10).detail.size.should.equal(1);
                budget3.transactions.get(10).detail.get(0).amount.should.equal(123);
                budget3.transactions.get(10).detail.get(0).description.should.equal("Desc");
            });

            it('overwrites metadata when changing metadata (potential pitfall)', () => {
                const budget2 = testReducer(undefined, basicInsertAction);
                budget2.transactions.size.should.equal(1);
                budget2.transactions.get(10).who.should.equal("TestCo");

                // Try set metadata key "alpha" to "42":
                const budget3 = testReducer(budget2, {
                    type: actions.UPDATE_TRANSACTION,
                    id: 10,
                    data: {metadata: {alpha: 42}},
                });
                budget3.transactions.get(10).metadata.get('alpha').should.equal(42);
                // Now set metadata key "beta" to "quadrant" - this will replaces ALL metadata, erasing alpha
                const budget4 = testReducer(budget2, {
                    type: actions.UPDATE_TRANSACTION,
                    id: 10,
                    data: {metadata: {beta: "quadrant"}},
                });
                should.equal(budget4.transactions.get(10).metadata.get('alpha'), undefined);
                budget4.transactions.get(10).metadata.get('beta').should.equal("quadrant");
            });

            it('has an inverse (insertion)', () => { testUndo(basicInsertAction); });
            it('has an inverse (modification)', () => {
                const initialBudget = testReducer(undefined, basicInsertAction);
                testUndo(subsequentUpdateAction, initialBudget);
            });
        });

        describe('UPDATE_MULTIPLE_TRANSACTIONS', () => {

            const exampleGroupedAction = {
                type: actions.UPDATE_MULTIPLE_TRANSACTIONS,
                subActions: [
                    {type: actions.UPDATE_TRANSACTION, id: 10, data: {date: +D`2011-12-13`, who: "InsertionCo"}},
                    {type: actions.UPDATE_TRANSACTION, id: 20, data: {date: +D`2011-12-13`, who: "InsertionCo 2"}},
                    {type: actions.UPDATE_TRANSACTION, id: 20, data: {who: "ModifiedCo"}},
                    {type: actions.UPDATE_TRANSACTION, id: 30, data: {who: "SoonToBeDeleted Corp."}},
                    {type: actions.DELETE_TRANSACTION, id: 30},
                ],
            };

            it('can modify transactions in bulk', () => {
                const budget = testReducer(undefined, exampleGroupedAction);
                budget.transactions.size.should.equal(2);
                budget.transactions.get(10).who.should.equal("InsertionCo");
                budget.transactions.get(20).who.should.equal("ModifiedCo");
                should.equal(budget.transactions.get(30), undefined);
            });

            it('has an inverse', () => { testUndo(exampleGroupedAction); });
        });

    });

    describe('store', () => {

        it('has a known default state', () => {
            const store = newStore();
            const state = store.getState();
            const year = Prophecy.PDate.today().year;
            state.toJS().should.deep.equal({
                version: {major: Prophecy.version.major, minor: Prophecy.version.minor},
                id: null,
                name: "New Budget",
                startDate: +D`${year}-01-01`,
                endDate: +D`${year}-12-31`,
                currencyCode: 'USD',
                accounts: [],
                categories: [],
                categoryGroups: [],
                transactions: [],
            });
        });

        // An example set of changes that covers
        // all possible actions that can be made on a Prophecy Budget
        const actionSet = [
            {type: actions.SET_NAME, name: "2016 Budget", budgetId: null},
            {type: actions.SET_DATE, startDate: +D`2016-01-01`, endDate: +D`2016-12-31`},
            {type: actions.SET_CURRENCY, currencyCode: 'XBT', budgetId: null},
            {type: actions.SET_CURRENCY, currencyCode: 'CAD', budgetId: null},
            {type: actions.NOOP},
            {type: actions.UPDATE_ACCOUNT, id: 10, data: {name: "Cash", currencyCode: 'CAD', initialBalance: 1500}},
            {type: actions.UPDATE_ACCOUNT, id: 20, data: {name: "Chequing", currencyCode: 'CAD', initialBalance: 0}},
            {type: actions.UPDATE_ACCOUNT, id: 20, data: {initialBalance: 100000}}, // Set initial balance to $100
            {type: actions.UPDATE_ACCOUNT, id: 30, data: {name: "Chequing (US)", currencyCode: 'USD', initialBalance: 0}},
            {type: actions.UPDATE_ACCOUNT, id: 40, data: {name: "Fourth Account", currencyCode: 'CAD', initialBalance: 0}},
            {type: actions.NOOP},
            {type: actions.UPDATE_CATEGORY_GROUP, id: 1, data: {name: "Transportation"}},
            {type: actions.UPDATE_CATEGORY_GROUP, id: 2, data: {name: "Housing"}},
            {type: actions.UPDATE_CATEGORY_GROUP, id: 3, data: {name: "Activities"}, index: 0},
            {type: actions.UPDATE_CATEGORY_GROUP, id: 4, data: {name: "Misc. Expenses"}},
            {type: actions.DELETE_CATEGORY_GROUP, id: 4},
            {type: actions.NOOP},
            {type: actions.UPDATE_CATEGORY, id: 100, data: {groupId: 1, name: "Monthly Transit Pass", currencyCode: 'CAD', rules: [
                {amount: 5000, startDate: +D`2016-01-01`, endDate: null, repeatN: 1, period: Prophecy.CategoryRulePeriod.Month}
            ]}},
            {type: actions.UPDATE_CATEGORY, id: 200, data: {groupId: 1, name: "Other transport expense category", currencyCode: 'USD'}},
            {type: actions.NOOP},
            {type: actions.UPDATE_TRANSACTION, id: 1,
                data: {date: +D`2016-01-01`, detail: [{description: "A short-lived transaction", categoryId: 200}], accountId: 30},
            },
            {type: actions.DELETE_CATEGORY, id: 200},
            {type: actions.UPDATE_TRANSACTION, id: 2,
                data: {date: +D`2016-01-15`, detail: [{amount: 123, description: "Desc", categoryId: 100}]},
            },
            {type: actions.UPDATE_TRANSACTION, id: 2,
                data: {date: +D`2016-01-20`, accountId: 20},
            },
            {type: actions.DELETE_ACCOUNT, id: 30}, // Delete "Chequing (US)". It must not be the first or last account, to make sure the undo test puts it back into the same spot.
            {type: actions.DELETE_TRANSACTION, id: 1}, // Delete "A short-lived transaction"
            {type: actions.UPDATE_ACCOUNT, id: 20, index: 0}, // Move Chequing to be the first account
            {type: actions.UPDATE_MULTIPLE_TRANSACTIONS, subActions: [
                // Group multiple transaction updates together
                {type: actions.UPDATE_TRANSACTION, id: 3, data: {date: +D`2016-07-03`}}, // An insertion
                {type: actions.UPDATE_TRANSACTION, id: 4, data: {date: +D`2016-07-04`}}, // Another insertion
                {type: actions.UPDATE_TRANSACTION, id: 4, data: {accountId: 40}}, // Modification - set the account ID
                {type: actions.DELETE_TRANSACTION, id: 3}, // Delete newly-inserted transaction 3
            ]},
        ];
        // The end result of the above actions, in JS form:
        const actionSetEndResult = {
            version: {major: Prophecy.version.major, minor: Prophecy.version.minor},
            id: null,
            name: "2016 Budget",
            startDate: +D`2016-01-01`,
            endDate: +D`2016-12-31`,
            currencyCode: 'CAD',
            accounts: [
                {id: 20, name: "Chequing", currencyCode: 'CAD', initialBalance: 100000, metadata: {}},
                {id: 10, name: "Cash", currencyCode: 'CAD', initialBalance: 1500, metadata: {}},
                {id: 40, name: "Fourth Account", currencyCode: 'CAD', initialBalance: 0, metadata: {}},
            ],
            categoryGroups: [
                {id: 3, name: "Activities"},
                {id: 1, name: "Transportation"},
                {id: 2, name: "Housing"},
            ],
            categories: [
                {id: 100, groupId: 1, name: "Monthly Transit Pass", currencyCode: 'CAD', metadata: {}, notes: "", rules: [
                    {amount: 5000, startDate: +D`2016-01-01`, endDate: null, repeatN: 1, period: Prophecy.CategoryRulePeriod.Month}
                ]},
            ],
            transactions: [
                {
                    id: 2, date: +D`2016-01-20`, accountId: 20, who: "",
                    detail: [{amount: 123, description: "Desc", categoryId: 100}],
                    metadata: {}, pending: true, isTransfer: false, userId: null
                },
                {
                    id: 4, date: +D`2016-07-04`, accountId: 40, who: "",
                    detail: [{amount: 0, description: "", categoryId: null}],
                    metadata: {}, pending: true, isTransfer: false, userId: null
                },
            ],
        }

        it('can reconstruct the same state by playing a series of actions', () => {
            const store = newStore();
            for (let action of actionSet) {
                store.dispatch(action);
            }
            store.getState().toJS().should.deep.equal(actionSetEndResult);
        });

        it('can reliably undo each change', () => {
            const store = newStore();
            const initialState = store.getState();
            let stateHistory = [];
            let undoActions = [];
            // Apply the actions:
            for (let action of actionSet) {
                stateHistory.push(store.getState());
                const inverseAction = Prophecy.inverter(store.getState(), action);
                store.dispatch(action);
                undoActions.push(inverseAction);
            }
            store.getState().toJS().should.deep.equal(actionSetEndResult);
            // Now work backwards, undoing each action:
            while (undoActions.length) {
                const expectedState = stateHistory.pop();
                const undoAction = undoActions.pop();
                store.dispatch(undoAction);
                should.equal(store.getState().equals(expectedState), true);
            }
            should.equal(store.getState().equals(initialState), true);
        });

        it ('covers every possible action type in the preceding tests', () => {
            const allActions = new Set(Object.keys(actions).map((k) => actions[k]));
            allActions.delete(actions.PROPHECY_ACTION_PREFIX);

            const actionsCovered = new Set(actionSet.map(a => a.type));

            const difference = [...allActions].filter(a => !actionsCovered.has(a));
            difference.should.deep.equal([]);
        });

        it("ignores actions that don't match the budget ID, if a budget ID is specified", () => {
            const store = newStore(new Prophecy.Budget({id: 15}));
            store.getState().id.should.equal(15);
            const origName = "New Budget";
            store.getState().name.should.equal(origName);
            store.dispatch({type: actions.SET_NAME, name: "2016 Budget", budgetId: null});
            store.getState().name.should.equal(origName);
            store.dispatch({type: actions.SET_NAME, name: "2016 Budget", budgetId: 999});
            store.getState().name.should.equal(origName);
            store.dispatch({type: actions.SET_NAME, name: "2016 Budget", budgetId: 15});
            store.getState().name.should.equal("2016 Budget");
            // Should also work if no budget ID is specified:
            store.dispatch({type: actions.SET_NAME, name: "2017 Budget"});
            store.getState().name.should.equal("2017 Budget");
        });

    });
});
