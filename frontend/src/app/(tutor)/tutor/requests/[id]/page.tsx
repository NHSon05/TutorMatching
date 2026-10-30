"use client";
import { use } from "react";
import { HireRequestPage } from "@/components/hiring/HireRequestPage";
export default function TutorRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <HireRequestPage id={id} backHref="/tutor/requests" />;
}
