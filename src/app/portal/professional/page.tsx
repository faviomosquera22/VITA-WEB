import { getServerSession } from "@/lib/auth";
import ClinicalDashboard from "./_components/clinical-dashboard";
export const dynamic = "force-dynamic";
export default async function ProfessionalHomePage() {
  const user = await getServerSession();
  if (!user) return null;
  return <ClinicalDashboard name={user.name} centerName={user.centerName} />;
}
