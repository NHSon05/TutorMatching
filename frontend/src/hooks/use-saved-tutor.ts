"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSavedTutors,
  saveTutor,
  unsaveTutor,
  type SavedTutorItem,
} from "@/lib/api/saved-tutors";

export const savedTutorsKey = (userId: string | undefined) => [
  "saved-tutors",
  userId,
];

/** Whether the signed-in learner saved this tutor, with an optimistic toggle. */
export function useSavedTutor(
  tutorProfileId: string,
  userId: string | undefined,
  enabled: boolean
) {
  const queryClient = useQueryClient();
  const key = savedTutorsKey(userId);
  const list = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => getSavedTutors(signal),
    enabled,
  });
  const isSaved = Boolean(
    list.data?.some((item) => item.tutorProfileId === tutorProfileId)
  );
  const toggle = useMutation({
    mutationFn: (save: boolean) =>
      save ? saveTutor(tutorProfileId) : unsaveTutor(tutorProfileId),
    onMutate: async (save) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<SavedTutorItem[]>(key);
      queryClient.setQueryData<SavedTutorItem[]>(key, (items = []) =>
        save
          ? [
              { tutorProfileId, savedAt: new Date().toISOString() },
              ...items.filter((i) => i.tutorProfileId !== tutorProfileId),
            ]
          : items.filter((i) => i.tutorProfileId !== tutorProfileId)
      );
      return { previous };
    },
    onError: (_error, _save, context) =>
      queryClient.setQueryData(key, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
  return { isSaved, isLoading: enabled && list.isPending, toggle };
}
