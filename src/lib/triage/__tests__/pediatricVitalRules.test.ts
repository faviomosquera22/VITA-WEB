import assert from "node:assert/strict";
import test from "node:test";

import { evaluatePediatricVitals } from "@/lib/triage/engine/pediatricVitalRules";
import type { VitalSigns } from "@/lib/triage/triageTypes";

function baseVitals(): VitalSigns {
  return {
    takenAt: new Date().toISOString(),
    takenBy: "nurse-1",
    systolicBP: 95,
    diastolicBP: 60,
    heartRate: 120,
    respiratoryRate: 28,
    temperature: 37,
    spo2: 97,
    glasgowTotal: 15,
    criticalFlags: [],
  };
}

test("Lactante 6 meses FC 180 usa umbral pediatrico (prioridad II)", () => {
  const vitals = baseVitals();
  vitals.heartRate = 180;

  const result = evaluatePediatricVitals(vitals, 6, "months");
  const winner = [...result.candidates].sort((a, b) => a.priority - b.priority)[0];

  assert.equal(winner.priority, 2);
});

test("TEP alterado en 2 lados activa prioridad I", () => {
  const result = evaluatePediatricVitals(baseVitals(), 2, "years", {
    appearanceAltered: true,
    breathingWorkAltered: true,
    skinCirculationAltered: false,
  });

  const winner = [...result.candidates].sort((a, b) => a.priority - b.priority)[0];
  assert.equal(winner.priority, 1);
});
