"use client";

import * as React from "react";
import type { LearnerDashboardClientProps } from "./types";
import { getMockTutors } from "@/data/mockTutors";
import TutorsListClient from "../tutors/TutorsListClient";

export type * from "./types";

export function LearnerDashboardClient({ data }: LearnerDashboardClientProps) {
  
  const initialTutors = getMockTutors();
  return <TutorsListClient initialTutors={initialTutors} />;
}

export default LearnerDashboardClient;
