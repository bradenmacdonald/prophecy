const prefix = 'PRPHCY_';
export const PROPHECY_ACTION_PREFIX = prefix;

////////////////////////////////////////////////////////////////////////////////
// Miscellaneous actions

/**
 * NOOP:
 * Action that does nothing.
 *
 * This is generated as the inverse of an action that had no effect.
 */
export const NOOP = prefix + 'NOOP';

////////////////////////////////////////////////////////////////////////////////
// Budget settings

/**
 * SET_CURRENCY:
 * Action to change the currency of this budget.
 *
 * Arguments:
 *  - currencyCode (string): New ISO 4217 currency code (e.g. 'USD')
 *  - budgetId (string): ID of the budget (optional)
 */
export const SET_CURRENCY = prefix + 'SET_CURRENCY';

/**
 * SET_DATE:
 * Action to change the start and/or end date of this budget.
 *
 * Arguments:
 *  - startDate (int): PDate value for the start date, cast to integer (optional)
 *  - endDate (int): PDate value for the end date, cast to integer (optional)
 *  - budgetId (string): ID of the budget (optional)
 */
export const SET_DATE = prefix + 'SET_DATE';

/**
 * SET_NAME:
 * Action to change the name of this budget.
 *
 * Arguments:
 *  - name (string): New name of the budget
 *  - budgetId (string): ID of the budget (optional)
 */
export const SET_NAME = prefix + 'SET_NAME';

////////////////////////////////////////////////////////////////////////////////
// Accounts

/**
 * DELETE_ACCOUNT:
 * Action to delete an account. Will set the 'accountId' of any linked transactions to null.
 *
 * Arguments:
 *  - id (int): The ID of the account to delete
 *  - budgetId (string): ID of the budget (optional)
 */
export const DELETE_ACCOUNT = prefix + 'DELETE_ACCT';

/**
 * UPDATE_ACCOUNT:
 * Action to create/modify an account
 *
 * Arguments:
 *  - id (int): The ID of the account to create/modify
 *  - data (object): fields to set on the new/modifed account (optional)
 *  - budgetId (string): ID of the budget (optional)
 *  - index (int): Index/position of the account in the list (optional)
 *  - linkNullTransactions (Array): Array of transaction IDs whose accountId will be
 *    set to this account's ID if (1) that transaction's accountId is null, and (2)
 *    this is an account insertion (not update). This parameter mostly exists so
 *    that DELETE_ACCOUNT can be inverted to a single action. (optional)
 */
export const UPDATE_ACCOUNT = prefix + 'UPDATE_ACCT';

////////////////////////////////////////////////////////////////////////////////
// Categories

/**
 * DELETE_CATEGORY:
 * Action to delete a category.
 *
 * Arguments:
 *  - id (int): The ID of the category to delete
 *  - budgetId (string): ID of the budget (optional)
 */
export const DELETE_CATEGORY = prefix + 'DELETE_CAT';

/**
 * UPDATE_CATEGORY:
 * Action to create/modify a category
 *
 * Arguments:
 *  - id (int): The ID of the category to create/modify
 *  - data (object): fields to set on the new/modifed category (optional)
 *  - budgetId (string): ID of the budget (optional)
 *  - index (int): Index/position of the category within the group (optional)
 *  - linkTransactionDetails (Array): Array of tuples of [transaction ID, details index]
 *    that identifies TransactionDetails entries whose categoryId will be
 *    set to this category's ID if (1) that transaction's categoryId is null, and (2)
 *    this is an category insertion (not update). This parameter mostly exists so
 *    that DELETE_CATEGORY can be inverted to a single action. (optional)
 */
export const UPDATE_CATEGORY = prefix + 'UPDATE_CAT';

////////////////////////////////////////////////////////////////////////////////
// Category Groups

/**
 * DELETE_CATEGORY_GROUP:
 * Action to delete a category group. It must not contain any categories.
 *
 * Arguments:
 *  - id (int): The ID of the category group to delete
 *  - budgetId (string): ID of the budget (optional)
 */
export const DELETE_CATEGORY_GROUP = prefix + 'DELETE_CG';

/**
 * UPDATE_CATEGORY_GROUP:
 * Action to create/modify a category group
 *
 * Arguments:
 *  - id (int): The ID of the category group to create/modify
 *  - data (object): fields to set on the new/modifed category group (optional)
 *  - budgetId (string): ID of the budget (optional)
 *  - index (int): Index/position of the category group in the list (optional)
 */
export const UPDATE_CATEGORY_GROUP = prefix + 'UPDATE_CG';


////////////////////////////////////////////////////////////////////////////////
// Transactions

/**
 * DELETE_TRANSACTION:
 * Action to delete a transaction
 *
 * Arguments:
 *  - id (int): The ID of the transaction to delete
 *  - budgetId (string): ID of the budget (optional)
 */
export const DELETE_TRANSACTION = prefix + 'DELETE_TXN';

/**
 * UPDATE_TRANSACTION:
 * Action to create/modify a transaction
 *
 * Arguments:
 *  - id (int): The ID of the transaction to create/modify
 *  - data (object): fields to set on the new/modifed transactions
 *  - budgetId (string): ID of the budget (optional)
 */
export const UPDATE_TRANSACTION = prefix + 'UPDATE_TXN';

/**
 * UPDATE_MULTIPLE_TRANSACTIONS
 * Action to atomically update multiple transactions.
 * 
 * This is the only "compound action" that itself contains
 * multiple other actions. "Compound actions" are kept to a minimum
 * in order to make it easier for other reducers to watch for
 * changes using actions. (e.g. if there were a generic MULTIPLE_ACTIONS
 * action, a reducer that wanted to watch for changes to the budget name
 * would have to watch for both SET_NAME and MULTIPLE_ACTIONS containing
 * SET_NAME).
 *
 * Arguments:
 *  - subActions (array): array of UPDATE_TRANSACTION and DELETE_TRANSACTION
 *       actions to carry out as part of this action.
 *  - budgetId (string): ID of the budget (optional)
 **/
export const UPDATE_MULTIPLE_TRANSACTIONS = prefix + 'UPDATE_MANY_TXN';
