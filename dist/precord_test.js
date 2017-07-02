"use strict";
const expect = require('chai').expect;
const Prophecy = require('../prophecy-dist');
const PRecord = Prophecy.PRecord;
describe('PRecord', function () {
    /** A test of PRecord and its invariant checking */
    class XorTestRecord extends PRecord({
        fieldA: 0,
        fieldB: 1,
    }) {
        _checkInvariants() {
            if (!(this.fieldA ^ this.fieldB)) {
                throw new Error("Expected A xor B.");
            }
        }
    }
    describe('_checkInvariants', () => {
        it('throws an exception when invalid data is passed to a Record constructor', () => {
            expect(() => { new XorTestRecord({ fieldA: 0, fieldB: 0 }); }).to.throw();
            expect(() => { new XorTestRecord({ fieldA: 1, fieldB: 0 }); }).to.not.throw();
            expect(() => { new XorTestRecord({ fieldA: 0, fieldB: 1 }); }).to.not.throw();
            expect(() => { new XorTestRecord({ fieldA: 1, fieldB: 1 }); }).to.throw();
        });
        it('throws an exception when invalid data is set with set()', () => {
            let base = new XorTestRecord({ fieldA: 0, fieldB: 1 });
            expect(() => { base.set('fieldB', 0); }).to.throw();
            expect(() => { base.set('fieldB', 1); }).to.not.throw();
        });
        it('only checks the final result of a merge()', () => {
            let base = new XorTestRecord({ fieldA: 0, fieldB: 1 });
            expect(() => {
                const changed = base.merge({ fieldA: 1, fieldB: 0 });
                changed.fieldA.should.equal(1);
                changed.fieldB.should.equal(0);
            }).to.not.throw();
            expect(() => {
                base.merge({ fieldA: 0, fieldB: 0 });
            }).to.throw();
        });
    });
    /** A test of PRecord and its invariant validation */
    class SolarSystem extends PRecord({
        marsInhabited: false,
        earthInhabited: true
    }) {
        _validate(context) {
            if (!this.marsInhabited) {
                context.addWarning('marsInhabited', "No humans on mars!");
            }
            if (!this.earthInhabited) {
                context.addWarning('earthInhabited', "No humans on earth!");
            }
            if (!this.earthInhabited && !this.marsInhabited) {
                context.addError(null, "Humanity extinct!");
            }
        }
    }
    const mockBudget = {};
    const goodSystem = new SolarSystem({ marsInhabited: true, earthInhabited: true });
    const earthOnlySystem = new SolarSystem({ marsInhabited: false, earthInhabited: true });
    const extinctSystem = new SolarSystem({ marsInhabited: false, earthInhabited: false });
    describe('validation', () => {
        it('validateForBudget() returns no errors when the record is valid', () => {
            const result = goodSystem.validateForBudget(mockBudget);
            expect(result.errors.length).to.equal(0);
            expect(result.warnings.length).to.equal(0);
            expect(result.allIssues.length).to.equal(0);
        });
        it('allows construction of a state with validation errors, but reports them with validateForBudget()', () => {
            const result = extinctSystem.validateForBudget(mockBudget);
            expect(result.errors.length).to.equal(1);
            expect(result.errors[0].field).to.be.null;
            expect(result.errors[0].message).to.equal("Humanity extinct!");
            expect(result.warnings.length).to.equal(2);
            expect(result.warnings[0].field).to.equal('marsInhabited');
            expect(result.warnings[0].message).to.equal('No humans on mars!');
            expect(result.warnings[1].field).to.equal('earthInhabited');
            expect(result.warnings[1].message).to.equal('No humans on earth!');
            expect(result.allIssues.length).to.equal(3);
        });
        it('assertIsValidForBudget() throws an exception if there are errors but not warnings', () => {
            // Valid, should not throw
            expect(() => { goodSystem.assertIsValidForBudget(mockBudget); }).to.not.throw();
            // Warning, should not throw
            expect(earthOnlySystem.validateForBudget(mockBudget).warnings.length).to.equal(1);
            expect(() => { earthOnlySystem.assertIsValidForBudget(mockBudget); }).to.not.throw();
            // Error, should throw:
            expect(() => { extinctSystem.assertIsValidForBudget(mockBudget); }).to.throw();
        });
        it('getFieldIssues() and .overallIssues return errors and warnings for specific fields.', () => {
            const result = extinctSystem.validateForBudget(mockBudget);
            expect(result.getFieldIssues('marsInhabited').length).to.equal(1);
            expect(result.getFieldIssues('marsInhabited')[0].message).to.equal("No humans on mars!");
            expect(result.getFieldIssues('earthInhabited').length).to.equal(1);
            expect(result.getFieldIssues('earthInhabited')[0].message).to.equal("No humans on earth!");
            expect(result.overallIssues.length).to.equal(1);
            expect(result.overallIssues[0].message).to.equal("Humanity extinct!");
        });
    });
});
//# sourceMappingURL=precord_test.js.map