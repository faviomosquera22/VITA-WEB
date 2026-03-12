import assert from "node:assert/strict";
import test from "node:test";

import { evaluateAdultVitals } from "@/lib/triage/engine/adultVitalRules";
import type { VitalSigns } from "@/lib/triage/triageTypes";

function baseVitals(): VitalSigns {
  return {
    takenAt: new Date().toISOString(),
    takenBy: "nurse-1",
    systolicBP: 120,
    diastolicBP: 80,
    heartRate: 80,
    respiratoryRate: 18,
    temperature: 37,
    spo2: 98,
    glasgowTotal: 15,
    criticalFlags: [],
  };
}

test("SpO2 85 debe activar prioridad I en adulto", () => {
  const vitals = baseVitals();
  vitals.spo2 = 85;

  const result = evaluateAdultVitals(vitals, ["spo2"]);
  const winner = [...result.candidates].sort((a, b) => a.priority - b.priority)[0];

  assert.equal(winner.priority, 1);
  assert.ok(result.criticalFlags.some((flag) => flag.parameter === "spo2"));
});

test("Dolor 8 sin compromiso vital debe quedar prioridad II", () => {
  const vitals = baseVitals();
  vitals.painScale = 8;

  const result = evaluateAdultVitals(vitals);
  const winner = [...result.candidates].sort((a, b) => a.priority - b.priority)[0];

  assert.equal(winner.priority, 2);
});
