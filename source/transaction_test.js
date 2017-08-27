"use strict";
const should = require('chai').should();
const Immutable = require('immutable');
const Prophecy = require('../prophecy-dist');
const Transaction = Prophecy.Transaction;
const TransactionDetail = Prophecy.TransactionDetail;

describe('Transaction', function() {

    describe('immutability', () => {

        it('cannot be changed', () => {
            const t = new Transaction();
            (() => { t.id = 5; }).should.throw();
            (() => { t.date = null; }).should.throw();
            (() => { t.accountId = 15; }).should.throw();
            (() => { t.who = "Bob"; }).should.throw();
            (() => { t.detail = []; }).should.throw();
            (() => { t.detail.get(0).amount == 0; }).should.not.throw();
            (() => { t.detail.get(0).amount = 500; }).should.throw();
        });

    });

    describe('detail', () => {

        it('requires "detail" to be non-empty', () => {
            const makeBadTransaction = () => {
                new Transaction({detail: Immutable.List(),});
            };
            makeBadTransaction.should.throw();

            const goodTransaction = new Transaction();
            const makeTransactionBad = () => {
                goodTransaction.set("detail", Immutable.List());
            };
            makeTransactionBad.should.throw();
        });

        it('does not allow NaN or other invalid amount values', () => {
            const baseTransaction = new Transaction();
            // Valid:
            (() => { baseTransaction.setIn(['detail', 0, 'amount'], 100); }).should.not.throw();
            // Invalid:
            (() => { baseTransaction.setIn(['detail', 0, 'amount'], 'abc'); }).should.throw();
            (() => { baseTransaction.setIn(['detail', 0, 'amount'], NaN); }).should.throw();
        });

    });

    describe('serialization', () => {

        const txn1 = new Transaction({
            id: 123,
            date: Prophecy.PDate.create(2015, 1, 1),
            accountId: 456,
            who: "BillCorp",
            detail: Immutable.List.of(
                new TransactionDetail({amount: 15.0, description: "Split Transaction Part A", categoryId: null}),
                new TransactionDetail({amount: 300.0, description: "Part B", categoryId: null})
            ),
        });

        const txn1ExpectedJS = {
            id: 123,
            date: 5510,
            accountId: 456,
            who: "BillCorp",
            detail: [
                {amount: 15.0, description: "Split Transaction Part A", categoryId: null},
                {amount: 300.0, description: "Part B", categoryId: null},
            ],
            userId: null,
            pending: true,
            isTransfer: false,
            metadata: {},
        };

        const txn2 = new Transaction({
            pending: true,
            metadata: Immutable.Map({a: 1}),
        });

        const txn2ExpectedJS = {
            id: null,
            date: null,
            accountId: null,
            who: "",
            detail: [{amount: 0, description: "", categoryId: null}],
            userId: null,
            pending: true,
            isTransfer: false,
            metadata: {a: 1},
        };

        it('serializes to JSON', () => {
            const json1 = JSON.stringify(txn1);
            JSON.parse(json1).should.deep.equal(txn1ExpectedJS);
            const json2 = JSON.stringify(txn2);
            JSON.parse(json2).should.deep.equal(txn2ExpectedJS);
        });

        it('serializes to JS', () => {
            txn1.toJS().should.deep.equal(txn1ExpectedJS);
            txn2.toJS().should.deep.equal(txn2ExpectedJS);
        });

        it('serializes to JSON and back', () => {
            const json1 = JSON.stringify(txn1);
            const restored1 = Transaction.fromJS(JSON.parse(json1));
            should.equal(Immutable.is(restored1, txn1), true);

            const json2 = JSON.stringify(txn2);
            const restored2 = Transaction.fromJS(JSON.parse(json2));
            should.equal(Immutable.is(restored2, txn2), true);
        })
    });

    describe('amount', () => {

        it('defaults to zero', () => {
            const t = new Transaction();
            t.amount.should.equal(0);
            t.amount.should.equal(0); // Check memoized version
        });

        it('sums the detail (split transaction) amounts', () => {
            const transaction1 = new Transaction({
                detail: [
                    {amount: 100.0, description: "Single Transaction!", categoryId: null},
                ],
            });
            transaction1.amount.should.equal(100.0);
            transaction1.amount.should.equal(100.0); // Check the memoized version

            const transaction2 = new Transaction({
                detail: Immutable.List.of(
                    new TransactionDetail({amount: 15.0, description: "Split Transaction Part A", categoryId: null}),
                    new TransactionDetail({amount: 300.0, description: "Part B", categoryId: null})
                ),
            });
            transaction2.amount.should.equal(315.0);
            transaction2.amount.should.equal(315.0); // Check the memoized version
        });
    });

    describe('isTransfer', () => {
        it('transfer transactions cannot have a category set', () => {
            const transaction = new Transaction({
                detail: [{amount: 100.0, description: "Single Transaction!", categoryId: 1500}],
            });
            transaction.isTransfer.should.equal(false);
            should.throw(() => { transaction.set('isTransfer', true); });
            should.not.throw(() => { transaction.setIn(['detail', 0, 'categoryId'], null).set('isTransfer', true); });
        })
    })
});
