/**
 * Thông tin thẻ khóa học của học viên
 */
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

/**
 * Mục lịch học trên thời khóa biểu tuần
 */
export interface ScheduleItem {
  id: string;
  title: string;
  day: "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
  time: "08:00" | "07:00" | "10:00" | "12:00";
  color: "yellow" | "blue" | "green" | "pink";
}

/**
 * Ngày trong mini-calendar widget
 */
export interface CalendarDay {
  day: string;
  date: number;
  active?: boolean;
}

/**
 * Mục bài tập về nhà trong widget tiến độ
 */
export interface HomeworkItem {
  id: number;
  title: string;
  description: string;
  percent: number;
  segments: [boolean, boolean, boolean];
}

/**
 * Dữ liệu tổng thể cho Bảng điều khiển Học viên
 */
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

/**
 * Props cho component chính LearnerDashboardClient
 */
export interface LearnerDashboardClientProps {
  data: LearnerDashboardData;
}

/**
 * Props cho WelcomeBannerCard
 */
export interface WelcomeBannerCardProps {
  title: string;
  description: string;
  actionText: string;
  actionHref: string;
  className?: string;
}

/**
 * Props cho YourCoursesSection
 */
export interface YourCoursesSectionProps {
  courses: CourseItem[];
  className?: string;
}

/**
 * Props cho MyScheduleSection
 */
export interface MyScheduleSectionProps {
  days: Array<"Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat">;
  times: Array<"08:00" | "07:00" | "10:00" | "12:00">;
  items: ScheduleItem[];
  className?: string;
}

/**
 * Props cho RightSidebarWidgets
 */
export interface RightSidebarWidgetsProps {
  calendar: LearnerDashboardData["calendar"];
  homework: HomeworkItem[];
  className?: string;
}

/**
 * Thông tin người dùng hiển thị trên Dashboard
 */
export interface DashboardUser {
  name: string;
  avatar: string;
  role: string;
  unreadNotifications: number;
}

/**
 * Props cho DashboardTopBar
 */
export interface DashboardTopBarProps {
  user?: DashboardUser;
  onSearch?: (query: string) => void;
  className?: string;
}
