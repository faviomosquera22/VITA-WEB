// Exercises the real API using the isolated, explicitly provisioned demo institution.
// Leaves five clearly labeled fictitious examples for the fair; reruns reuse them.
import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL ?? "http://localhost:3015";
const password = process.env.DEMO_PASSWORD;
assert(password, "DEMO_PASSWORD required");
async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json();
  return { response, data };
}
async function login(email, role) {
  const { response, data } = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, role, client: "ios" }),
  });
  assert.equal(response.status, 200, JSON.stringify(data));
  assert(data.sessionToken);
  return data;
}
const professional = await login(
  "fabio.mosquera@demo.vita.test",
  "professional",
);
const institution = await login("pantalla@demo.vita.test", "institution");
assert.equal(professional.user.institutionId, institution.user.institutionId);
const tokens = [professional.sessionToken, institution.sessionToken];
try {
  assert.equal(
    (await request("/api/institution/monitor")).response.status,
    401,
  );
  assert.equal(
    (await request("/api/cases", { token: institution.sessionToken })).response
      .status,
    401,
  );
  assert.equal(
    (await request("/api/patients", { token: institution.sessionToken }))
      .response.status,
    401,
  );
  assert.equal(
    (
      await request("/api/cases", {
        token: institution.sessionToken,
        method: "POST",
        body: "{}",
      })
    ).response.status,
    401,
  );
  const wrongRole = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: professional.user.email,
      password,
      role: "institution",
    }),
  });
  assert.equal(wrongRole.response.status, 401);
  const invalid = await request("/api/cases", {
    token: professional.sessionToken,
    method: "POST",
    body: JSON.stringify({
      patientName: " ",
      age: -1,
      reason: " ",
      triage: "rojo",
    }),
  });
  assert.equal(invalid.response.status, 400);
  const created = [];
  for (const [index, triage, status, careArea] of [
    [1, "rojo", "pendiente", "general"],
    [2, "amarillo", "pendiente", "general"],
    [3, "verde", "en_atencion", "general"],
    [4, "naranja", "en_atencion", "hospitalizacion"],
    [5, "azul", "finalizado", "general"],
  ]) {
    const payload = {
      patientName: `DEMO Feria · Caso ${index}`,
      age: 30 + index,
      reason:
        "Registro ficticio para verificar la vinculación app–web; no corresponde a una atención real.",
      triage,
      origin: "app",
      idempotencyKey: `fair-demo-sync-${index}`,
    };
    const first = await request("/api/cases", {
      token: professional.sessionToken,
      method: "POST",
      body: JSON.stringify(payload),
    });
    assert.equal(first.response.status, 201, JSON.stringify(first.data));
    const second = await request("/api/cases", {
      token: professional.sessionToken,
      method: "POST",
      body: JSON.stringify(payload),
    });
    assert.equal(
      second.data.id,
      first.data.id,
      "idempotency prevents duplicates",
    );
    const changed = await request(`/api/cases/${first.data.id}`, {
      token: professional.sessionToken,
      method: "PATCH",
      body: JSON.stringify({
        status,
        careArea,
        updatedAt: first.data.updatedAt,
      }),
    });
    assert.equal(changed.response.status, 200, JSON.stringify(changed.data));
    const stale = await request(`/api/cases/${first.data.id}`, {
      token: professional.sessionToken,
      method: "PATCH",
      body: JSON.stringify({
        status,
        careArea,
        updatedAt: first.data.updatedAt,
      }),
    });
    assert.equal(stale.response.status, 409, "concurrent edits are rejected");
    created.push(changed.data);
  }
  const list = await request("/api/cases", {
    token: professional.sessionToken,
  });
  for (const c of created)
    assert(
      list.data.some(
        (row) =>
          row.id === c.id &&
          row.status === c.status &&
          row.careArea === c.careArea,
      ),
    );
  const monitor = await request("/api/institution/monitor", {
    token: institution.sessionToken,
  });
  assert.equal(monitor.response.status, 200, JSON.stringify(monitor.data));
  assert(monitor.data.groups.find((g) => g.id === "hospital").count >= 1);
  assert(monitor.data.groups.find((g) => g.id === "emergency").count >= 2);
  assert(!JSON.stringify(monitor.data).includes("DEMO Feria · Caso"));
  assert(!JSON.stringify(monitor.data).includes("patientName"));
  assert(!JSON.stringify(monitor.data).includes("reason"));
  console.log(
    "PASS: mobile bearer login, role checks, persistent cases, idempotency, state changes, stale-edit conflict, hospitalization and anonymized institutional monitor.",
  );
  console.log(`Verified ${created.length} fictitious cases against ${base}`);
} finally {
  for (const token of tokens)
    await request("/api/auth/logout", { token, method: "POST" });
  assert.equal(
    (await request("/api/cases", { token: professional.sessionToken })).response
      .status,
    401,
  );
  console.log("PASS: logout revokes mobile sessions.");
}
