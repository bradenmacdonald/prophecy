/**
 * Prophecy Engine JavaScript API
 *
 * All of these classes should be namespaced within a 'Prophecy' global.
 */
import * as Imm from 'immutable';
export declare const Immutable: typeof Imm;
export { PRecord } from './precord';
export { Account } from './account';
export { Budget } from './budget';
export { Category, CategoryGroup, CategoryRule, CategoryRulePeriod } from './category';
export { Currency, CurrencyFormatter, SUPPORTED_CURRENCIES } from './currency';
export { default as PDate } from './pdate';
export { Transaction, TransactionDetail } from './transaction';
export { reducer, inverter } from './redux/prophecy_redux';
import * as _actions from './redux/actions';
export declare const actions: typeof _actions;
export declare const version: {
    major: number;
    minor: number;
};
