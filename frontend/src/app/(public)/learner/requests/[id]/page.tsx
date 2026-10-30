"use client";
import { use } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { HireRequestPage } from "@/components/hiring/HireRequestPage";
export default function LearnerRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AuthGuard role="LEARNER">
      <HireRequestPage id={id} backHref="/learner/requests" />
    </AuthGuard>
  );
}
