import type {
  TutorListItemResponse,
  PublicSubject,
  TutorQueryParameters,
  PagedTutorsResponse,
} from "@/lib/api/tutors";

export type {
  TutorListItemResponse,
  PublicSubject,
  TutorQueryParameters,
  PagedTutorsResponse,
};

export type { TutorCardProps } from "./TutorCard.types";
export type { HireTutorDialogProps } from "./HireTutorDialog";

/**
 * Interface cho đối tượng gia sư phục vụ các dialog thao tác (ví dụ HireTutorDialog)
 */
export interface Tutor {
  id: number | string;
  name: string;
  avatar?: string;
  title?: string;
  priceFormatted?: string;
  mode?: string;
  [key: string]: unknown;
}

/**
 * Props tùy chọn cho component client danh sách gia sư
 */
export interface TutorsListClientProps {
  initialTutors?: TutorListItemResponse[];
}
