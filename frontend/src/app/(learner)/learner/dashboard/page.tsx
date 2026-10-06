import { getLearnerDashboardData } from "@/data/mockLearnerDashboard";
import { LearnerDashboardClient } from "@/components/learner/LearnerDashboardClient";

export default async function LearnerDashboardPage() {
  const data = await getLearnerDashboardData();

  return <LearnerDashboardClient data={data} />;
}
