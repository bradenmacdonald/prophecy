"use strict";
const should = require('chai').should();
const Immutable = require('immutable');
const Prophecy = require('../prophecy-dist');
const Account = Prophecy.Account;

describe('Account', function() {

    describe('immutability', () => {

        it('cannot be changed', () => {
            const a = new Account();
            (() => { a.id = 5; }).should.throw();
            (() => { a.name = null; }).should.throw();
            (() => { a.initialBalance = 15; }).should.throw();
            (() => { a.currencyCode = "CAD"; }).should.throw();
        });

    });

    describe('currencyCode', () => {

        it('defaults to USD', () => {
            const a = new Account();
            a.currencyCode.should.equal("USD");
            a.currency.code.should.equal("USD");
        });

        it('requires currencyCode to be valid', () => {
            (() => { new Account({currencyCode: "USD"}); }).should.not.throw();
            (() => { new Account({currencyCode: "CAD"}); }).should.not.throw();
            (() => { new Account({currencyCode: "XYZ"}); }).should.throw();
            (() => { new Account({currencyCode: null}); }).should.throw();
            (() => { new Account({currencyCode: 15}); }).should.throw();
        });

    });

    describe('initialBalance', () => {

        it('defaults to 0', () => {
            const a = new Account();
            a.initialBalance.should.equal(0);
        });

        it('must be a number', () => {
            (() => { new Account({initialBalance: 1500}); }).should.not.throw();
            (() => { new Account({initialBalance: -50}); }).should.not.throw();
            (() => { new Account({initialBalance: "XYZ"}); }).should.throw();
            (() => { new Account({initialBalance: null}); }).should.throw();
        });

    });

    describe('metadata', () => {
        it('is a map and we can set and get values', () => {
            const account = new Account();
            Immutable.Map.isMap(account.metadata).should.be.true;

            const account2 = account.setIn(['metadata', 'key1'], 'value1');
            account2.metadata.get('key1').should.equal('value1');
        });
    });

    describe('serialization', () => {

        const data = {
            id: 123,
            name: "Cash",
            initialBalance: 20000.0,
            currencyCode: "CAD",
            metadata: {foo: "bar"},
        };

        it('serializes to JSON', () => {
            const account = new Account(data);
            const accountJSON = JSON.stringify(account);
            JSON.parse(accountJSON).should.deep.equal(data);
        });

        it('serializes to JSON and back', () => {
            const account = new Account(data);
            const accountJSON = JSON.stringify(account);
            const account2 = Account.fromJS(JSON.parse(accountJSON));
            account2.should.deep.equal(account);
            // Make sure this comparison works:
            const otherData = JSON.parse(accountJSON);
            otherData.id = 456;
            const account3 = Account.fromJS(otherData);
            account3.should.not.deep.equal(account);
        })
    });

});
