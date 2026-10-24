"use client";
import type { FC } from "react";
import type { LearnerDashboardClientProps } from "./types";
import TutorsListClient from "../tutors/TutorsListClient";
export type * from "./types";
export const LearnerDashboardClient: FC<LearnerDashboardClientProps> = () => (
  <TutorsListClient />
);
export default LearnerDashboardClient;
