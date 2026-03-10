import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import { mockPatients, type FluidBalanceRecord, type PatientRecord } from "../_data/clinical-mock-data";

type BedState = "Ocupada" | "Libre" | "Limpieza" | "Reservada";

type BedSlot = {
  id: string;
  room: string;
  bed: string;
  state: BedState;
  patientName?: string;
};

const bedMap: BedSlot[] = [
  { id: "b-1", room: "Sala A", bed: "A-01", state: "Ocupada", patientName: "Maria Lopez" },
  { id: "b-2", room: "Sala A", bed: "A-02", state: "Ocupada", patientName: "Juan Perez" },
  { id: "b-3", room: "Sala A", bed: "A-03", state: "Limpieza" },
  { id: "b-4", room: "Sala A", bed: "A-04", state: "Libre" },
  { id: "b-5", room: "Sala B", bed: "B-01", state: "Ocupada", patientName: "Sofia Mendoza" },
  { id: "b-6", room: "Sala B", bed: "B-02", state: "Reservada" },
  { id: "b-7", room: "Sala B", bed: "B-03", state: "Libre" },
  { id: "b-8", room: "Sala B", bed: "B-04", state: "Ocupada", patientName: "Ana Torres" },
];

const adtEvents = [
  {
    id: "adt-1",
    datetime: "2026-03-10 07:25",
    action: "Admision",
    patient: "Sofia Mendoza",
    detail: "Ingreso a Sala B · cama B-01 por control metabolico.",
  },
  {
    id: "adt-2",
    datetime: "2026-03-10 09:10",
    action: "Traslado",
    patient: "Juan Perez",
    detail: "Traslado de observacion a hospitalizacion Sala A · cama A-02.",
  },
  {
    id: "adt-3",
    datetime: "2026-03-10 11:45",
    action: "Alta",
    patient: "Carlos Gomez",
    detail: "Alta medica con indicaciones y seguimiento ambulatorio en 72h.",
  },
];

export default function HospitalizationPage() {
  const hospitalized = mockPatients.filter((patient) => patient.careMode === "Hospitalizacion");
  const occupiedBeds = bedMap.filter((slot) => slot.state === "Ocupada").length;
  const availableBeds = bedMap.filter((slot) => slot.state === "Libre").length;
  const fluidSummary = summarizeFluid(hospitalized);
  const epicrisisPatient = hospitalized[0] ?? mockPatients[0];

  return (
    <ModulePage
      title="Hospitalizacion y camas"
      subtitle="Mapa de camas en tiempo real, flujo ADT, balance hidrico y epicrisis estructurada."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Camas ocupadas" value={occupiedBeds} hint={`Total mapa: ${bedMap.length}`} />
        <StatCard label="Camas libres" value={availableBeds} hint="Disponibles para admision" />
        <StatCard label="Pacientes hospitalizados" value={hospitalized.length} hint="Con seguimiento activo" />
        <StatCard label="Balance 24h global" value={`${fluidSummary.balance} ml`} hint="Ingreso menos egreso" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Mapa de camas" subtitle="Estado por sala y cama: ocupada, libre, limpieza o reservada">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {bedMap.map((slot) => (
              <article key={slot.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">
                    {slot.room} · {slot.bed}
                  </p>
                  <BedStateBadge state={slot.state} />
                </div>
                <p className="text-[11px] text-slate-500">{slot.patientName ?? "Sin paciente asignado"}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Movimientos ADT" subtitle="Admision, traslado y alta con trazabilidad operativa">
          <div className="space-y-2">
            {adtEvents.map((event) => (
              <article key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">
                    {event.action} · {event.patient}
                  </p>
                  <span className="text-[11px] text-slate-500">{event.datetime}</span>
                </div>
                <p className="text-[11px] text-slate-600">{event.detail}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Balance hidrico por hospitalizacion" subtitle="Entradas, salidas y diuresis para vigilancia clinica">
          <div className="space-y-2">
            {hospitalized.map((patient) => {
              const totals = summarizePatientFluid(patient.fluidBalances);

              return (
                <article key={patient.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-900">{patient.fullName}</p>
                  <p className="text-[11px] text-slate-500">
                    Ingreso: {totals.intake} ml · Egreso: {totals.output} ml · Balance: {totals.balance} ml
                  </p>
                  <p className="text-[11px] text-slate-600">Diuresis acumulada: {totals.diuresis} ml</p>
                </article>
              );
            })}
          </div>
        </Panel>

        <Panel title="Epicrisis preestructurada" subtitle="Borrador automatico para cierre de hospitalizacion">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">
              Paciente: {epicrisisPatient.fullName} · HC {epicrisisPatient.medicalRecordNumber}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">Diagnostico de ingreso: {epicrisisPatient.primaryDiagnosis}</p>
            <p className="text-[11px] text-slate-500">
              Diagnostico al alta: {epicrisisPatient.secondaryDiagnoses.join(", ") || "Sin diagnosticos secundarios"}
            </p>
            <p className="text-[11px] text-slate-500">Condicion al alta: Estable hemodinamicamente.</p>
            <p className="mt-2 text-[11px] text-slate-600">
              Resumen: Paciente con evolucion favorable, controles clinicos estables y plan de seguimiento por consulta externa.
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Indicaciones: continuar tratamiento, control en 72h y signos de alarma explicados a familiar.
            </p>
          </article>
        </Panel>
      </div>
    </ModulePage>
  );
}

function summarizeFluid(patients: PatientRecord[]) {
  return patients.reduce(
    (acc, patient) => {
      const totals = summarizePatientFluid(patient.fluidBalances);
      acc.intake += totals.intake;
      acc.output += totals.output;
      acc.balance += totals.balance;
      acc.diuresis += totals.diuresis;
      return acc;
    },
    { intake: 0, output: 0, balance: 0, diuresis: 0 }
  );
}

function summarizePatientFluid(entries: FluidBalanceRecord[]) {
  return entries.reduce(
    (acc, entry) => {
      const intake =
        entry.intake.oral +
        entry.intake.intravenous +
        entry.intake.dilutedMedication +
        entry.intake.enteralParenteral +
        entry.intake.other;
      const output =
        entry.output.diuresis +
        entry.output.vomiting +
        entry.output.drains +
        entry.output.liquidStools +
        entry.output.aspiration +
        entry.output.insensibleLoss +
        entry.output.other;

      acc.intake += intake;
      acc.output += output;
      acc.balance += intake - output;
      acc.diuresis += entry.output.diuresis;
      return acc;
    },
    { intake: 0, output: 0, balance: 0, diuresis: 0 }
  );
}

function BedStateBadge({ state }: { state: BedState }) {
  const className: Record<BedState, string> = {
    Ocupada: "border-red-200 bg-red-50 text-red-700",
    Libre: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Limpieza: "border-amber-200 bg-amber-50 text-amber-700",
    Reservada: "border-sky-200 bg-sky-50 text-sky-700",
  };

  return <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold", className[state]].join(" ")}>{state}</span>;
}
