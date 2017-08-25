/**
 * Prophecy Engine JavaScript API
 *
 * All of these classes should be namespaced within a 'Prophecy' global.
 */
import * as Imm from 'immutable';
export declare const Immutable: typeof Imm;
export { PRecord } from './precord';
export { Account, AccountValues } from './account';
export { Budget, BudgetValues } from './budget';
export { Category, CategoryValues, CategoryGroup, CategoryRule, CategoryRulePeriod, CategoryRuleValues } from './category';
export { Currency, CurrencyFormatter, SUPPORTED_CURRENCIES } from './currency';
export { default as PDate } from './pdate';
export { Transaction, TransactionDetail, TransactionValues } from './transaction';
export { reducer, inverter } from './redux/prophecy_redux';
import * as _actions from './redux/actions';
export declare const actions: typeof _actions;
export declare const version: {
    major: number;
    minor: number;
};
