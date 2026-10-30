import { AuthGuard } from "@/components/AuthGuard";
import { HireRequestList } from "@/components/hiring/HireRequestList";
export default function LearnerRequestsPage() {
  return (
    <AuthGuard role="LEARNER">
      <HireRequestList audience="learner" />
    </AuthGuard>
  );
}
