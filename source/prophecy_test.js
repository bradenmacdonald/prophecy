"use strict";
const should = require('chai').should();
const Prophecy = require('../prophecy-dist');

describe('Prophecy Engine', function() {

    it('has the expected version numbers', () => {
        Prophecy.version.major.should.equal(0);
        Prophecy.version.minor.should.equal(3);
    });

});


