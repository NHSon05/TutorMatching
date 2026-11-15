import { http } from "./http";

export interface SavedTutorItem {
  tutorProfileId: string;
  savedAt: string;
}

export async function getSavedTutors(signal?: AbortSignal) {
  return (
    await http.get<{ items: SavedTutorItem[] }>("/saved-tutors", { signal })
  ).data.items;
}

/** Idempotent: saving twice keeps the first save time. */
export async function saveTutor(tutorProfileId: string) {
  await http.put(`/saved-tutors/${encodeURIComponent(tutorProfileId)}`);
}

/** Idempotent: removing a tutor that is not saved succeeds. */
export async function unsaveTutor(tutorProfileId: string) {
  await http.delete(`/saved-tutors/${encodeURIComponent(tutorProfileId)}`);
}
