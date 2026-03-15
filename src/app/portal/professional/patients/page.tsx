import { redirect } from "next/navigation";

import { mockPatients } from "../_data/clinical-mock-data";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requestedPatientId = Array.isArray(params.patientId) ? params.patientId[0] : params.patientId;
  const requestedTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;

  const fallbackPatientId = mockPatients[0]?.id;
  const patientId =
    mockPatients.find((patient) => patient.id === requestedPatientId)?.id ?? fallbackPatientId;

  if (!patientId) {
    redirect("/portal/professional");
  }

  const nextParams = new URLSearchParams();

  if (requestedTab) {
    nextParams.set("tab", requestedTab);
  }

  const query = nextParams.toString();
  redirect(`/portal/professional/patients/${patientId}${query ? `?${query}` : ""}`);
}
