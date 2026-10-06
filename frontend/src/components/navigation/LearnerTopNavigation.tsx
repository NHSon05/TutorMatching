"use client";

import * as React from "react";
import Link from "next/link";
import { TopNavigation } from "@/components/ui/top-navigation";
import { Button } from "@/components/ui/button";

export interface LearnerTopNavigationProps {
  className?: string;
}

export function LearnerTopNavigation({ className = "" }: LearnerTopNavigationProps) {
  return (
    <TopNavigation
      transparent={true}
      behavior="sticky"
      showDivider={false}
      hideLeftSection={true}
      className={className}
      rightContent={
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="brand"
            size="medium"
            shape="pill"
            className="shadow-sm font-semibold"
          >
            <Link href="/tutors">+ Tìm gia sư</Link>
          </Button>
        </div>
      }
    />
  );
}

export default LearnerTopNavigation;
