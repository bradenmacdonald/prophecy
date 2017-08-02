import { Budget } from '../prophecy';
export declare type ActionType = {
    type: string;
    [key: string]: any;
};
/**
 * The reducer for prophecy. Used to make the Prophecy engine work within a redux app.
 * @param {Budget} state - the state to modify
 * @param {Object} action - the action to apply to the state, if applicable
 * @returns {Budget} - returns the state, with any resulting modifications
 */
export declare function reducer(state: Budget | undefined, action: ActionType): Budget;
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
export declare function inverter(state: Budget, action: ActionType): any;
