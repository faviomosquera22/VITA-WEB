import { notFound } from "next/navigation";

import PatientClinicalRecord from "../../_components/patient-clinical-record";
import { getPatientById } from "../../_data/clinical-mock-data";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = getPatientById(id);

  if (!patient) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-7xl px-4 py-5">
      <PatientClinicalRecord patient={patient} />
      </section>
    </main>
  );
}
