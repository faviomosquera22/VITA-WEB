"use client";

import { useMemo } from "react";

import { ModulePage, Panel, StatCard } from "../_components/clinical-ui";
import {
  PatientContextSummary,
  PatientFinder,
  usePatientSelection,
} from "../_components/patient-workspace";
import { mockPatients } from "../_data/clinical-mock-data";

export default function FluidBalancePage() {
  const { search, setSearch, selectedPatientId, setSelectedPatientId, filteredPatients, selectedPatient } =
    usePatientSelection(mockPatients);

  const rows = useMemo(
    () =>
      filteredPatients.flatMap((patient) =>
        patient.fluidBalances.map((balance) => ({
          patient,
          balance,
          intakeTotal: sumObjectValues(balance.intake),
          outputTotal: sumObjectValues(balance.output),
        }))
      ),
    [filteredPatients]
  );

  const altered = rows.filter((row) => Math.abs(row.intakeTotal - row.outputTotal) > 300);

  return (
    <ModulePage
      title="Balance hidrico"
      subtitle="Registro por paciente de ingresos/egresos con resultado automatico por turno y 24 horas."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Balances registrados" value={rows.length} hint="Turno y 24 horas" />
        <StatCard label="Balance alterado" value={altered.length} hint="Neto > +/-300 ml" />
        <StatCard
          label="Pendientes"
          value={mockPatients.filter((patient) => patient.fluidBalances.length === 0).length}
          hint="Sin cierre de balance"
        />
      </div>

      <PatientFinder
        patients={filteredPatients.length ? filteredPatients : mockPatients}
        searchValue={search}
        onSearchChange={setSearch}
        selectedPatientId={selectedPatientId}
        onSelectPatient={setSelectedPatientId}
        title="Busqueda de paciente para balance hidrico"
        subtitle="Selecciona paciente para registrar ingresos, egresos y alertas de balance neto."
      />

      {selectedPatient ? <PatientContextSummary patient={selectedPatient} compact /> : null}

      <Panel title="Vista global de balances" subtitle="Resumen por paciente, turno y estado neto">
        <div className="space-y-2">
          {rows.map(({ patient, balance, intakeTotal, outputTotal }) => {
            const net = intakeTotal - outputTotal;
            return (
              <article key={balance.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{patient.fullName}</p>
                    <p className="text-xs text-slate-600">{balance.date} · {balance.shift}</p>
                    <p className="text-[11px] text-slate-500">
                      Ingresos: {intakeTotal} ml · Egresos: {outputTotal} ml
                    </p>
                  </div>
                  <span
                    className={[
                      "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      Math.abs(net) > 300
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700",
                    ].join(" ")}
                  >
                    Neto: {net} ml
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </Panel>

      {selectedPatient ? (
        <Panel
          title="Vista por paciente: registro de balance"
          subtitle="Ingresos, egresos y observaciones clinicas con alertas por variacion"
        >
          {selectedPatient.fluidBalances.length === 0 ? (
            <p className="text-xs text-slate-500">Sin registros previos para este paciente.</p>
          ) : (
            <div className="space-y-2">
              {selectedPatient.fluidBalances.map((balance) => {
                const intakeTotal = sumObjectValues(balance.intake);
                const outputTotal = sumObjectValues(balance.output);
                const net = intakeTotal - outputTotal;
                return (
                  <article key={balance.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                    <p className="text-sm font-semibold text-slate-900">{balance.date} · {balance.shift}</p>
                    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                      <Field label="VO" value={`${balance.intake.oral} ml`} />
                      <Field label="Intravenoso" value={`${balance.intake.intravenous} ml`} />
                      <Field label="Medicacion diluida" value={`${balance.intake.dilutedMedication} ml`} />
                      <Field label="Enteral/parenteral" value={`${balance.intake.enteralParenteral} ml`} />
                      <Field label="Otros ingresos" value={`${balance.intake.other} ml`} />
                      <Field label="Diuresis" value={`${balance.output.diuresis} ml`} />
                      <Field label="Vomitos" value={`${balance.output.vomiting} ml`} />
                      <Field label="Drenajes" value={`${balance.output.drains} ml`} />
                      <Field label="Heces liquidas" value={`${balance.output.liquidStools} ml`} />
                      <Field label="Aspirados" value={`${balance.output.aspiration} ml`} />
                      <Field label="Otros egresos" value={`${balance.output.other} ml`} />
                      <Field label="Perdidas insensibles" value={`${balance.output.insensibleLoss} ml`} />
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">
                      Total ingresos: {intakeTotal} ml · Total egresos: {outputTotal} ml · Balance neto: {net} ml
                    </p>
                    <p className="text-[11px] text-slate-500">{balance.observations}</p>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100">
              Registrar balance por turno
            </button>
            <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100">
              Cerrar balance 24 horas
            </button>
          </div>
        </Panel>
      ) : null}
    </ModulePage>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-xs text-slate-700">{value}</p>
    </div>
  );
}

function sumObjectValues(values: Record<string, number>) {
  return Object.values(values).reduce((total, current) => total + current, 0);
}
