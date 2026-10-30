"use client";

import { useQuery } from "@tanstack/react-query";
import { getTutorById } from "@/lib/api/tutors";

export function usePublicTutorDetail(id: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ["public-tutor-detail", id],
    queryFn: ({ signal }) => getTutorById(id!, signal),
    enabled: enabled && !!id,
  });
}
