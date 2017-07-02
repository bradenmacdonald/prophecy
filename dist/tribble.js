import { PRecord } from './precord';
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
const good1 = new XorTestRecord({ fieldA: 1, fieldB: 0 });
const good2 = new XorTestRecord({ fieldA: 0, fieldB: 1 });
const base = new XorTestRecord({ fieldA: 0, fieldB: 1 });
base.set('fieldB', 1);
base.set('fieldB', 'awooga');
base.set('fieldC', 1);
//# sourceMappingURL=tribble.js.map