import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  associateFeeGapForDate,
  autumnMembershipBenefit,
  effectiveMembershipFeeYear,
  isAssociateAccessLimitedByFee
} = require("../server/membership-fee-policy.js");

const septemberAssociate = {
  joinedAt: "2026-09-30T10:00:00Z",
  membershipFeeYear: 2026,
  annualAmount: 50,
  yearlyFees: { 2026: 50 }
};
assert.equal(autumnMembershipBenefit(septemberAssociate), null);
assert.equal(effectiveMembershipFeeYear(septemberAssociate, "2026-11-15T10:00:00Z"), 2026);
assert.equal(associateFeeGapForDate(septemberAssociate, "2026-11-15T10:00:00Z"), 0);

const autumnAssociate = {
  joinedAt: "2026-11-15T10:00:00Z",
  membershipFeeYear: 2027,
  annualAmount: 50,
  yearlyFees: { 2027: 50 }
};
assert.deepEqual(autumnMembershipBenefit(autumnAssociate), {
  joinedYear: 2026,
  joinedMonth: 11,
  feeYear: 2027
});
assert.equal(
  effectiveMembershipFeeYear(autumnAssociate, "2026-11-20T10:00:00Z"),
  2027,
  "Durante el año de alta bonificado se revisa la cuota del año siguiente"
);
assert.equal(
  associateFeeGapForDate(autumnAssociate, "2026-11-20T10:00:00Z"),
  0,
  "Una alta de noviembre con cuota 2027 pagada no debe quedar pendiente de cuota 2026"
);
assert.equal(isAssociateAccessLimitedByFee(autumnAssociate, "2026-11-20T10:00:00Z"), false);
assert.equal(
  effectiveMembershipFeeYear(autumnAssociate, "2027-01-10T10:00:00Z"),
  2027,
  "Al llegar enero sigue vigente la cuota 2027 ya abonada"
);
assert.equal(associateFeeGapForDate(autumnAssociate, "2027-01-10T10:00:00Z"), 0);
assert.equal(
  effectiveMembershipFeeYear(autumnAssociate, "2028-01-10T10:00:00Z"),
  2028,
  "La bonificación no congela el ejercicio: en 2028 se revisa 2028"
);
assert.equal(associateFeeGapForDate(autumnAssociate, "2028-01-10T10:00:00Z"), 50);
assert.equal(isAssociateAccessLimitedByFee(autumnAssociate, "2028-01-10T10:00:00Z"), true);

const unpaidAutumnAssociate = {
  ...autumnAssociate,
  yearlyFees: { 2027: 0 }
};
assert.equal(associateFeeGapForDate(unpaidAutumnAssociate, "2026-11-20T10:00:00Z"), 50);

const manuallyCorrectedNonAutumn = {
  joinedAt: "2026-05-10T10:00:00Z",
  membershipFeeYear: 2027,
  annualAmount: 50,
  yearlyFees: { 2027: 50 }
};
assert.equal(
  effectiveMembershipFeeYear(manuallyCorrectedNonAutumn, "2026-11-20T10:00:00Z"),
  2026,
  "Una corrección manual fuera de octubre-diciembre no debe saltarse automáticamente el año natural"
);

console.log("Política de cuota V1.1: ejercicio efectivo octubre-diciembre OK.");
