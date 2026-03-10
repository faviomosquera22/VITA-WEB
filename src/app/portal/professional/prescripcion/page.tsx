import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import { mockPatients, type MedicationRecord } from "../_data/clinical-mock-data";

type PrescriptionOrder = {
  id: string;
  genericName: string;
  dci: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  indication: string;
  prescriber: string;
  status: "Prescrita" | "Validada farmacia" | "Administrada";
};

type ValidationAlert = {
  id: string;
  type: "Interaccion" | "Alergia" | "Dosis";
  severity: "Alta" | "Media";
  detail: string;
  recommendation: string;
};

const orderDraft: PrescriptionOrder[] = [
  {
    id: "rx-1",
    genericName: "Acido acetilsalicilico",
    dci: "Acido acetilsalicilico",
    dose: "100 mg",
    route: "Oral",
    frequency: "Cada 24h",
    duration: "30 dias",
    indication: "Antiagregacion en sindrome coronario",
    prescriber: "Dra. Sofia Montalvo",
    status: "Validada farmacia",
  },
  {
    id: "rx-2",
    genericName: "Warfarina",
    dci: "Warfarina sodica",
    dose: "5 mg",
    route: "Oral",
    frequency: "Cada 24h",
    duration: "14 dias",
    indication: "Profilaxis tromboembolica",
    prescriber: "Dra. Sofia Montalvo",
    status: "Prescrita",
  },
  {
    id: "rx-3",
    genericName: "Amoxicilina",
    dci: "Amoxicilina",
    dose: "500 mg",
    route: "Oral",
    frequency: "Cada 8h",
    duration: "7 dias",
    indication: "Cobertura empirica respiratoria",
    prescriber: "Dra. Sofia Montalvo",
    status: "Prescrita",
  },
];

const pharmacyStock = [
  { dci: "Acido acetilsalicilico", available: 320, expiresAt: "2026-11-18", status: "Disponible" },
  { dci: "Warfarina sodica", available: 42, expiresAt: "2026-07-02", status: "Stock bajo" },
  { dci: "Amoxicilina", available: 0, expiresAt: "2026-04-30", status: "Sin stock" },
];

const medicationReconciliation = [
  {
    id: "rec-1",
    medication: "Losartan 50 mg",
    home: "Si",
    hospitalization: "Si",
    discharge: "Si",
    note: "Mantener por HTA cronica.",
  },
  {
    id: "rec-2",
    medication: "Metformina 850 mg",
    home: "Si",
    hospitalization: "No",
    discharge: "Si",
    note: "Suspendida temporalmente durante hospitalizacion.",
  },
  {
    id: "rec-3",
    medication: "Insulina regular",
    home: "No",
    hospitalization: "Si",
    discharge: "Evaluar",
    note: "Ajustar al alta segun control glucemico final.",
  },
];

export default function PrescriptionPage() {
  const patient = mockPatients[0];
  const alerts = buildValidationAlerts(orderDraft, patient.antecedentes.allergies, patient.medicationRecords);
  const validatedByPharmacy = orderDraft.filter((order) => order.status !== "Prescrita").length;

  return (
    <ModulePage
      title="Prescripcion y farmacia"
      subtitle="Prescripcion electronica DCI, validacion farmaceutica, seguridad e integracion con kardex."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Paciente" value={patient.fullName} hint={`HC ${patient.medicalRecordNumber}`} />
        <StatCard label="Ordenes en borrador" value={orderDraft.length} hint="Prescripcion electronica activa" />
        <StatCard label="Validadas farmacia" value={validatedByPharmacy} hint="Flujo medico-farmaceutico" />
        <StatCard label="Alertas de seguridad" value={alerts.length} hint="Interacciones, alergias y dosis" />
      </div>

      <Panel title="Prescripcion electronica (DCI)" subtitle="Nombre generico, dosis, via, frecuencia, duracion e indicacion">
        <div className="space-y-2">
          {orderDraft.map((order) => (
            <article key={order.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-900">
                  {order.dci} · {order.dose}
                </p>
                <PrescriptionStatusBadge status={order.status} />
              </div>
              <p className="text-[11px] text-slate-500">
                Via {order.route} · {order.frequency} · Duracion {order.duration}
              </p>
              <p className="text-[11px] text-slate-600">Indicacion: {order.indication}</p>
              <p className="text-[11px] text-slate-500">Prescriptor: {order.prescriber}</p>
            </article>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Validacion de seguridad en tiempo real" subtitle="Interacciones, alergias cruzadas y alertas de dosis">
          <div className="space-y-2">
            {alerts.length === 0 ? (
              <p className="text-xs text-slate-500">Sin alertas activas para las ordenes actuales.</p>
            ) : (
              alerts.map((alert) => (
                <article key={alert.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900">{alert.type}</p>
                    <AlertSeverityBadge severity={alert.severity} />
                  </div>
                  <p className="text-[11px] text-slate-600">{alert.detail}</p>
                  <p className="text-[11px] text-slate-500">Accion sugerida: {alert.recommendation}</p>
                </article>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Dispensacion y kardex" subtitle="Ciclo completo: prescribir, validar, dispensar y administrar">
          <div className="space-y-2">
            {orderDraft.map((order) => (
              <article key={`${order.id}-flow`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-900">{order.dci}</p>
                <p className="text-[11px] text-slate-500">
                  Flujo: Medico ({order.status !== "Prescrita" ? "OK" : "Pendiente"}) · Farmacia (
                  {order.status === "Validada farmacia" || order.status === "Administrada" ? "OK" : "Pendiente"}) · Enfermeria (
                  {order.status === "Administrada" ? "OK" : "Pendiente"})
                </p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Conciliacion de medicamentos" subtitle="Ingreso vs hospitalizacion vs alta">
          <div className="space-y-2">
            {medicationReconciliation.map((entry) => (
              <article key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-900">{entry.medication}</p>
                <p className="text-[11px] text-slate-500">
                  Hogar: {entry.home} · Hospitalizacion: {entry.hospitalization} · Alta: {entry.discharge}
                </p>
                <p className="text-[11px] text-slate-600">{entry.note}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Stock y vencimientos de farmacia" subtitle="Disponibilidad para dispensacion segura">
          <div className="space-y-2">
            {pharmacyStock.map((stock) => (
              <article key={stock.dci} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">{stock.dci}</p>
                  <StockStatusBadge status={stock.status} />
                </div>
                <p className="text-[11px] text-slate-500">Disponibles: {stock.available}</p>
                <p className="text-[11px] text-slate-600">Vencimiento: {stock.expiresAt}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </ModulePage>
  );
}

function buildValidationAlerts(
  orders: PrescriptionOrder[],
  allergies: string[],
  activeMedication: MedicationRecord[]
): ValidationAlert[] {
  const alerts: ValidationAlert[] = [];
  const allNames = [...orders.map((item) => item.dci.toLowerCase()), ...activeMedication.map((item) => item.name.toLowerCase())];

  if (allNames.some((name) => name.includes("warfarina")) && allNames.some((name) => name.includes("aspirina"))) {
    alerts.push({
      id: "int-1",
      type: "Interaccion",
      severity: "Alta",
      detail: "Combinacion de warfarina con acido acetilsalicilico eleva riesgo de sangrado.",
      recommendation: "Confirmar indicacion dual, vigilar INR y signos de sangrado.",
    });
  }

  if (orders.some((item) => item.dci.toLowerCase().includes("amoxicilina")) && allergies.some((item) => item.toLowerCase().includes("penic"))) {
    alerts.push({
      id: "all-1",
      type: "Alergia",
      severity: "Alta",
      detail: "Paciente con antecedente de alergia a penicilinas y prescripcion de amoxicilina.",
      recommendation: "Bloquear orden y seleccionar antibiotico alternativo.",
    });
  }

  if (orders.some((item) => item.dci.toLowerCase().includes("warfarina") && item.dose.includes("5"))) {
    alerts.push({
      id: "dose-1",
      type: "Dosis",
      severity: "Media",
      detail: "Inicio de warfarina requiere protocolo de ajuste individual y control temprano.",
      recommendation: "Programar INR de control en 48h y ajustar segun respuesta.",
    });
  }

  return alerts;
}

function PrescriptionStatusBadge({ status }: { status: PrescriptionOrder["status"] }) {
  const className: Record<PrescriptionOrder["status"], string> = {
    Prescrita: "border-amber-200 bg-amber-50 text-amber-700",
    "Validada farmacia": "border-sky-200 bg-sky-50 text-sky-700",
    Administrada: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold", className[status]].join(" ")}>{status}</span>;
}

function AlertSeverityBadge({ severity }: { severity: ValidationAlert["severity"] }) {
  const className =
    severity === "Alta"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-amber-200 bg-amber-50 text-amber-700";

  return <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold", className].join(" ")}>{severity}</span>;
}

function StockStatusBadge({ status }: { status: string }) {
  const className =
    status === "Disponible"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "Stock bajo"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-red-200 bg-red-50 text-red-700";

  return <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold", className].join(" ")}>{status}</span>;
}
