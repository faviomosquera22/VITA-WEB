import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMonitorSnapshot,
  belongsToGroup,
  type FlowCase,
} from "../src/lib/case-flow.ts";
const now = new Date("2026-10-01T03:30:00Z"); // September 30 in Ecuador.
const base: FlowCase = {
  id: "aaaaaaaa-0000-0000-0000-000000000000",
  triage: "rojo",
  status: "pendiente",
  careArea: "general",
  date: now.toISOString(),
  updatedAt: now.toISOString(),
};
test("emergencies overlap operational states but closed cases leave emergency", () => {
  assert.equal(belongsToGroup(base, "emergency", now), true);
  assert.equal(belongsToGroup(base, "new", now), true);
  assert.equal(
    belongsToGroup({ ...base, status: "finalizado" }, "emergency", now),
    false,
  );
});
test("hospitalization is distinct from general attention", () => {
  const hospital = {
    ...base,
    status: "en_atencion" as const,
    careArea: "hospitalizacion" as const,
  };
  assert.equal(belongsToGroup(hospital, "hospital", now), true);
  assert.equal(belongsToGroup(hospital, "attention", now), false);
  assert.equal(
    belongsToGroup({ ...hospital, status: "finalizado" }, "hospital", now),
    false,
  );
});
test("finalized today respects Ecuador midnight", () => {
  assert.equal(
    belongsToGroup(
      { ...base, status: "finalizado", updatedAt: "2026-09-30T06:00:00Z" },
      "completed",
      now,
    ),
    true,
  );
  assert.equal(
    belongsToGroup(
      { ...base, status: "finalizado", updatedAt: "2026-09-30T04:59:59Z" },
      "completed",
      now,
    ),
    false,
  );
});
test("monitor omits all clinical identity fields and counts beyond five visible cases", () => {
  const source = Array.from({ length: 7 }, (_, i) => ({
    ...base,
    id: `${String(i).padStart(8, "0")}-0000-0000-0000-000000000000`,
    patientName: "SECRET",
    reason: "SECRET",
    room: "SECRET",
  }));
  const snapshot = buildMonitorSnapshot(source, "Demo", now);
  assert.equal(snapshot.totalActive, 7);
  assert.equal(snapshot.groups[0].count, 7);
  assert.equal(snapshot.groups[0].cases.length, 5);
  assert.equal(JSON.stringify(snapshot).includes("SECRET"), false);
});
