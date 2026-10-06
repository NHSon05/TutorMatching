export interface CourseItem {
  id: number;
  tutorName: string;
  avatar: string;
  price: string;
  themeColor: "purple" | "amber" | "rose";
  lessonsCount: number;
  hoursCount: number;
  studentsCount: number;
  completedPercent: number;
  completedLessons: number;
  totalLessons: number;
}

export interface ScheduleItem {
  id: string;
  title: string;
  day: "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
  time: "08:00" | "07:00" | "10:00" | "12:00";
  color: "yellow" | "blue" | "green" | "pink";
}

export interface CalendarDay {
  day: string;
  date: number;
  active?: boolean;
}

export interface HomeworkItem {
  id: number;
  title: string;
  description: string;
  percent: number;
  segments: [boolean, boolean, boolean];
}

export interface LearnerDashboardData {
  user: {
    name: string;
    avatar: string;
    role: string;
    unreadNotifications: number;
  };
  welcomeBanner: {
    title: string;
    description: string;
    actionText: string;
    actionHref: string;
    goalPercent: number;
  };
  courses: CourseItem[];
  schedule: {
    days: Array<"Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat">;
    times: Array<"08:00" | "07:00" | "10:00" | "12:00">;
    items: ScheduleItem[];
  };
  calendar: {
    month: string;
    days: CalendarDay[];
    communityGrowth: {
      percentage: number;
      growthText: string;
    };
  };
  homework: HomeworkItem[];
}

export const mockLearnerDashboardData: LearnerDashboardData = {
  user: {
    name: "Esther",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
    role: "Học viên",
    unreadNotifications: 3,
  },
  welcomeBanner: {
    title: "Welcome back, Esther!",
    description: "You've learned 80% of your goal this week Keep it up and improve your progress!",
    actionText: "GO BACK TO THE LESSONS",
    actionHref: "/learner/schedule",
    goalPercent: 80,
  },
  courses: [
    {
      id: 1,
      tutorName: "Freida Varnes",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256",
      price: "25$",
      themeColor: "purple",
      lessonsCount: 24,
      hoursCount: 17,
      studentsCount: 40,
      completedPercent: 45,
      completedLessons: 4,
      totalLessons: 13,
    },
    {
      id: 2,
      tutorName: "Tyra Dhillon",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256",
      price: "75$",
      themeColor: "amber",
      lessonsCount: 34,
      hoursCount: 24,
      studentsCount: 40,
      completedPercent: 35,
      completedLessons: 4,
      totalLessons: 13,
    },
    {
      id: 3,
      tutorName: "Brittni Lando",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=256",
      price: "75$",
      themeColor: "rose",
      lessonsCount: 21,
      hoursCount: 27,
      studentsCount: 25,
      completedPercent: 75,
      completedLessons: 4,
      totalLessons: 13,
    },
  ],
  schedule: {
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    times: ["08:00", "07:00", "10:00", "12:00"],
    items: [
      {
        id: "sch-1",
        title: "Clearly display the name",
        day: "Sun",
        time: "08:00",
        color: "yellow",
      },
      {
        id: "sch-2",
        title: "Clearly display the name",
        day: "Wed",
        time: "07:00",
        color: "blue",
      },
      {
        id: "sch-3",
        title: "Clearly display the name",
        day: "Tue",
        time: "10:00",
        color: "green",
      },
      {
        id: "sch-4",
        title: "Clearly display the name",
        day: "Thu",
        time: "12:00",
        color: "pink",
      },
    ],
  },
  calendar: {
    month: "May 2023",
    days: [
      { day: "Sat", date: 7, active: false },
      { day: "Sun", date: 8, active: false },
      { day: "Mon", date: 9, active: true },
      { day: "Tue", date: 10, active: false },
      { day: "Wed", date: 11, active: false },
    ],
    communityGrowth: {
      percentage: 62,
      growthText: "increase to 19.6%",
    },
  },
  homework: [
    {
      id: 1,
      title: "Optimizing work",
      description: "In today's fast-paced world, an efficient work schedule.",
      percent: 33,
      segments: [true, false, false],
    },
    {
      id: 2,
      title: "Optimizing work",
      description: "In today's fast-paced world, an efficient work schedule.",
      percent: 99,
      segments: [true, true, true],
    },
    {
      id: 3,
      title: "Optimizing work",
      description: "In today's fast-paced world, an efficient work schedule.",
      percent: 66,
      segments: [true, true, false],
    },
  ],
};

/**
 * Mock API fetcher simulating async data retrieval on the server
 */
export async function getLearnerDashboardData(): Promise<LearnerDashboardData> {
  // In a real application, this would query Prisma/EF Core REST API
  return Promise.resolve(mockLearnerDashboardData);
}
