"use client";

import * as React from "react";
import type { LearnerDashboardClientProps } from "./types";
import { WelcomeBannerCard } from "./WelcomeBannerCard";
import { YourCoursesSection } from "./YourCoursesSection";
import { MyScheduleSection } from "./MyScheduleSection";
import { RightSidebarWidgets } from "./RightSidebarWidgets";

export type * from "./types";

export function LearnerDashboardClient({ data }: LearnerDashboardClientProps) {
  return (
    <div className="w-full space-y-6">
      {/* Main Grid: Left/Center 8 cols, Right Widgets 4 cols */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols) */}
        <div className="xl:col-span-8 space-y-6">
          {/* 1. Welcome Banner Card with 3D books */}
          <WelcomeBannerCard
            title={data.welcomeBanner.title}
            description={data.welcomeBanner.description}
            actionText={data.welcomeBanner.actionText}
            actionHref={data.welcomeBanner.actionHref}
          />

          {/* 2. Your Courses Section */}
          <YourCoursesSection courses={data.courses} />

          {/* 3. My Schedule Timetable Section */}
          <MyScheduleSection
            days={data.schedule.days}
            times={data.schedule.times}
            items={data.schedule.items}
          />
        </div>

        {/* Right Column (4 cols) */}
        <div className="xl:col-span-4 space-y-6">
          <RightSidebarWidgets
            calendar={data.calendar}
            homework={data.homework}
          />
        </div>
      </div>
    </div>
  );
}

export default LearnerDashboardClient;
