import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  return <AnalyticsDashboard user={session!.user} />;
}
