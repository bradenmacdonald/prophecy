/**
 * Prophecy Engine JavaScript API
 *
 * All of these classes should be namespaced within a 'Prophecy' global.
 */
import * as Imm from 'immutable';
export const Immutable = Imm;
export {PRecord} from './precord';

export {Account} from './account';
export {Budget} from './budget';
export {Category, CategoryGroup, CategoryRule, CategoryRulePeriod} from './category';
export {Currency, CurrencyFormatter, SUPPORTED_CURRENCIES} from './currency';
export {default as PDate} from './pdate';
export {Transaction, TransactionDetail} from './transaction';

export {reducer, inverter} from './redux/prophecy_redux';
import * as _actions from './redux/actions';
export const actions = _actions;

import {majorVersion, minorVersion} from './budget';
export const version = {major: majorVersion, minor: minorVersion};
