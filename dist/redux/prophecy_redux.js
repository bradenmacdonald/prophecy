import { assert, assertIsNumber } from '../util';
import { Account, Budget, Category, CategoryGroup, PDate, Transaction } from '../prophecy';
import * as ACTION from './actions';
/**
 * The reducer for prophecy. Used to make the Prophecy engine work within a redux app.
 * @param {Budget} state - the state to modify
 * @param {Object} action - the action to apply to the state, if applicable
 * @returns {Budget} - returns the state, with any resulting modifications
 */
export function reducer(state = new Budget(), action) {
    // Basic checks:
    if (!action.type.startsWith(ACTION.PROPHECY_ACTION_PREFIX)) {
        // This is not a prophecy-specific action
        return state;
    }
    if (action.budgetId !== undefined && action.budgetId !== state.id) {
        // This action does not apply to this particular budget
        return state;
    }
    switch (action.type) {
        case ACTION.SET_CURRENCY: {
            return state.set('currencyCode', action.currencyCode);
        }
        case ACTION.SET_DATE: {
            const changes = {};
            for (let dateKey of ['startDate', 'endDate']) {
                if (dateKey in action) {
                    changes[dateKey] = new PDate(action[dateKey]);
                }
            }
            return state.merge(changes);
        }
        case ACTION.SET_NAME: {
            return state.set('name', action.name);
        }
        // Account actions:
        case ACTION.DELETE_ACCOUNT: {
            return state.deleteAccount(action.id);
        }
        case ACTION.UPDATE_ACCOUNT: {
            assertIsNumber(action.id);
            const existingAccount = state.accounts.get(action.id);
            const acct = existingAccount || new Account({ id: action.id });
            let newState = state;
            if (action.data) {
                assert(!('id' in action.data));
                newState = newState.updateAccount(acct.merge(action.data));
            }
            if (action.linkNullTransactions) {
                // Implement the "linkNullTransactions" param, required to make DELETE_ACCOUNT fully invertable:
                assert(existingAccount === undefined); // linkNullTransactions is only allowed for Account insertions
                const nullTransactions = newState.transactions.filter(t => t.accountId == null);
                action.linkNullTransactions.forEach(txnId => {
                    const txn = nullTransactions.get(txnId);
                    if (txn) {
                        newState = newState.updateTransaction(txn.set('accountId', action.id));
                    }
                });
            }
            if ('index' in action) {
                assertIsNumber(action.index);
                newState = newState.positionAccount(action.id, action.index);
            }
            return newState;
        }
        // Category actions:
        case ACTION.DELETE_CATEGORY: {
            return state.deleteCategory(action.id);
        }
        case ACTION.UPDATE_CATEGORY: {
            assertIsNumber(action.id);
            const existingCategory = state.categories.get(action.id);
            const category = existingCategory || new Category({ id: action.id });
            let newState = state;
            if (action.data) {
                assert(!('id' in action.data));
                newState = newState.updateCategory(category.merge(Category.cleanArgs(action.data)));
            }
            if ('index' in action) {
                assertIsNumber(action.index);
                newState = newState.positionCategory(action.id, action.index);
            }
            if (action.linkTransactionDetails) {
                // Implement the "linkTransactionDetails" param, required to make DELETE_CATEGORY fully invertable:
                assert(existingCategory === undefined); // linkTransactionDetails is only allowed for Category insertions
                // linkTransactionDetails is a list of tuples of [transaction ID, index into transaction.detail list]
                action.linkTransactionDetails.forEach(([txnId, detailsIndex]) => {
                    const txn = newState.transactions.get(txnId);
                    if (txn) {
                        newState = newState.updateTransaction(txn.updateIn(['detail', detailsIndex, 'categoryId'], categoryId => categoryId === null ? action.id : categoryId));
                    }
                });
            }
            return newState;
        }
        // Category Group actions:
        case ACTION.DELETE_CATEGORY_GROUP: {
            return state.deleteCategoryGroup(action.id);
        }
        case ACTION.UPDATE_CATEGORY_GROUP: {
            assertIsNumber(action.id);
            const existingGroup = state.categoryGroups.get(action.id);
            const group = existingGroup || new CategoryGroup({ id: action.id });
            let newState = state;
            if (action.data) {
                assert(!('id' in action.data));
                newState = newState.updateCategoryGroup(group.merge(action.data));
            }
            if ('index' in action) {
                assertIsNumber(action.index);
                newState = newState.positionCategoryGroup(action.id, action.index);
            }
            return newState;
        }
        // Transaction actions:
        case ACTION.DELETE_TRANSACTION: {
            return state.deleteTransaction(action.id);
        }
        case ACTION.UPDATE_TRANSACTION: {
            assertIsNumber(action.id);
            assert(!('id' in action.data));
            const data = Transaction.cleanArgs(action.data);
            const txn = state.transactions.get(action.id) || new Transaction({ id: action.id });
            return state.updateTransaction(txn.merge(data));
        }
        case ACTION.UPDATE_MULTIPLE_TRANSACTIONS: {
            let newState = state;
            action.subActions.forEach(subAction => {
                assert(subAction.type === ACTION.UPDATE_TRANSACTION || subAction.type === ACTION.DELETE_TRANSACTION);
                assert(subAction.budgetId === undefined || subAction.budgetId === state.id);
                newState = reducer(newState, subAction);
            });
            return newState;
        }
        default:
            return state;
    }
}
/**
 * The action inverter for prophecy.
 * Given an action and a state, produce the inverse of 'action', such that
 * inverse(action(state)) = state
 *
 * This is used to build undo functionality that is relatively robust
 * when multiple users can simultaneously be emitting actions.
 *
 * @param {Budget} state - the state that is about to be modified by action
 * @param {Object} action - the action to invert
 * @returns {?Object} - An action (a JS object) or null, if the action cannot be inverted.
 */
export function inverter(state, action) {
    // Inner function to generate the inverted action's parameters:
    let result = (() => {
        switch (action.type) {
            case ACTION.NOOP: {
                return {};
            }
            // Setting actions:
            case ACTION.SET_CURRENCY: {
                return { currencyCode: state.get('currencyCode') };
            }
            case ACTION.SET_DATE: {
                const data = {};
                for (let dateType of ['startDate', 'endDate']) {
                    if (dateType in action) {
                        data[dateType] = +state[dateType];
                    }
                }
                return data;
            }
            case ACTION.SET_NAME: {
                return { name: state.name };
            }
            // Account actions:
            case ACTION.DELETE_ACCOUNT: {
                const acct = state.accounts.get(action.id);
                if (acct) {
                    const data = acct.toJS();
                    delete data.id;
                    // Restore the associated transactions that will have their accountId set null:
                    const linkNullTransactions = state.transactions.valueSeq().filter(t => t.accountId == action.id).map(t => t.id);
                    const index = state.accounts.keySeq().keyOf(action.id);
                    return { type: ACTION.UPDATE_ACCOUNT, id: action.id, data, linkNullTransactions, index };
                }
                return ACTION.NOOP;
            }
            case ACTION.UPDATE_ACCOUNT: {
                const acct = state.accounts.get(action.id);
                if (acct) {
                    // Generate the 'data' parameter required to undo this modification
                    // using another UPDATE_ACCOUNT action:
                    const acctJS = acct.toJS();
                    const inverse = { id: action.id };
                    if ('data' in action) {
                        inverse.data = {};
                        for (let key in action.data) {
                            if (acctJS[key] !== action.data[key]) {
                                inverse.data[key] = acctJS[key];
                            }
                        }
                    }
                    if ('index' in action) {
                        // Was the index/position of this account on the account list changed?
                        const oldIndex = state.accounts.keySeq().keyOf(action.id);
                        if (action.index !== oldIndex) {
                            inverse.index = oldIndex;
                        }
                    }
                    return inverse;
                }
                else {
                    // To undo this insertion, we need to delete the account:
                    return { type: ACTION.DELETE_ACCOUNT, id: action.id };
                }
            }
            // Category actions:
            case ACTION.DELETE_CATEGORY: {
                const category = state.categories.get(action.id);
                if (category) {
                    const data = category.toJS();
                    delete data.id;
                    // Restore the associated transaction details that will have their categoryId set null.
                    // We do this by including a list with tuples of (transaction ID, detail index).
                    const linkTransactionDetails = [];
                    state.transactions.forEach(txn => {
                        txn.detail.forEach((detail, idx) => {
                            if (detail.categoryId === category.id) {
                                linkTransactionDetails.push([txn.id, idx]);
                            }
                        });
                    });
                    const index = state.categories.filter(cat => cat.groupId == category.groupId).keySeq().keyOf(action.id);
                    return { type: ACTION.UPDATE_CATEGORY, id: action.id, data, linkTransactionDetails, index };
                }
                return ACTION.NOOP;
            }
            case ACTION.UPDATE_CATEGORY: {
                const category = state.categories.get(action.id);
                if (category) {
                    // Generate the 'data' parameter required to undo this modification
                    // using another UPDATE_CATEGORY action:
                    const categoryJS = category.toJS();
                    const inverse = { id: action.id };
                    if ('data' in action) {
                        inverse.data = {};
                        for (let key in action.data) {
                            if (categoryJS[key] !== action.data[key]) {
                                inverse.data[key] = categoryJS[key];
                            }
                        }
                    }
                    if ('index' in action) {
                        // Was the index/position of this category within the group changed?
                        const oldIndex = state.categories.filter(cat => cat.groupId == category.groupId).keySeq().keyOf(action.id);
                        if (action.index !== oldIndex) {
                            inverse.index = oldIndex;
                        }
                    }
                    return inverse;
                }
                else {
                    // To undo this insertion, we need to delete the category:
                    return { type: ACTION.DELETE_CATEGORY, id: action.id };
                }
            }
            // Category Group actions:
            case ACTION.DELETE_CATEGORY_GROUP: {
                const group = state.categoryGroups.get(action.id);
                if (group) {
                    const data = group.toJS();
                    delete data.id;
                    return { type: ACTION.UPDATE_CATEGORY_GROUP, id: action.id, data };
                }
                return ACTION.NOOP;
            }
            case ACTION.UPDATE_CATEGORY_GROUP: {
                const group = state.categoryGroups.get(action.id);
                if (group) {
                    // Generate the 'data' parameter required to undo this modification
                    // using another UPDATE_CATEGORY_GROUP action:
                    const groupJS = group.toJS();
                    const inverse = { id: action.id };
                    if ('data' in action) {
                        inverse.data = {};
                        for (let key in action.data) {
                            if (groupJS[key] !== action.data[key]) {
                                inverse.data[key] = groupJS[key];
                            }
                        }
                    }
                    if ('index' in action) {
                        // Was the index/position of this category group on changed?
                        const oldIndex = state.categoryGroups.keySeq().keyOf(action.id);
                        if (action.index !== oldIndex) {
                            inverse.index = oldIndex;
                        }
                    }
                    return inverse;
                }
                else {
                    // To undo this insertion, we need to delete the category group:
                    return { type: ACTION.DELETE_CATEGORY_GROUP, id: action.id };
                }
            }
            // Transaction actions:
            case ACTION.DELETE_TRANSACTION: {
                const txn = state.transactions.get(action.id);
                if (txn) {
                    const data = txn.toJS();
                    delete data.id;
                    return { type: ACTION.UPDATE_TRANSACTION, id: action.id, data };
                }
                return ACTION.NOOP;
            }
            case ACTION.UPDATE_TRANSACTION: {
                const txn = state.transactions.get(action.id);
                if (txn) {
                    // Generate the 'data' parameter required to undo this modification
                    // using another UPDATE_TRANSACTION action:
                    const txnJS = txn.toJS();
                    let data = {};
                    for (let key in action.data) {
                        if (txnJS[key] !== action.data[key]) {
                            data[key] = txnJS[key];
                        }
                    }
                    return { id: action.id, data };
                }
                else {
                    // To undo this insertion, we need to delete the transaction:
                    return { type: ACTION.DELETE_TRANSACTION, id: action.id };
                }
            }
            case ACTION.UPDATE_MULTIPLE_TRANSACTIONS: {
                let inverseSubActions = [];
                // Reverse iterate over action.subActions and invert each one:
                let newState = state;
                action.subActions.forEach(subAction => {
                    const inverseSubAction = inverter(newState, subAction);
                    delete inverseSubAction.budgetId; // Delete this since it's redundant
                    inverseSubActions.push(inverseSubAction);
                    newState = reducer(newState, subAction); // We need to update the state as we iterate the subActions in case any prior actions affect later ones.
                });
                inverseSubActions.reverse(); // The inverse actions should be applied in the opposite order
                return { subActions: inverseSubActions };
            }
        }
    })();
    if (result) {
        if (!result.type) {
            result.type = action.type; // type defaults to the same action type
        }
        result.budgetId = state.id;
        return result;
    }
    return null;
}
//# sourceMappingURL=prophecy_redux.js.map