"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { CatalogItem } from "@/lib/api/catalog";
import { findSubjectByName, usePublicSubjects } from "@/hooks/use-public-subjects";
import {
  ArrowRightIcon,
  AwardIcon,
  BookOpenIcon,
  ChevronDownIcon,
  FileCheckIcon,
  GraduationCapIcon,
  TrendingUpIcon,
  UsersIcon,
} from "@/components/icons";

type MenuItem = { label: string; href: string; icon: ReactNode };
type MenuColumn = { title: string; items: MenuItem[] };

const ICON = "w-5 h-5 shrink-0";

function SigmaIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 7V4H6l6 8-6 8h12v-3" />
    </svg>
  );
}

function AtomIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="1" />
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
    </svg>
  );
}

function FlaskIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3" />
      <path d="M7 15h10" />
    </svg>
  );
}

function LanguageIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m2 19 5-14 5 14M4 14h6" />
      <path d="M21 19v-6a3 3 0 0 0-5.5-1.6M21 16.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
    </svg>
  );
}

function CodeIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
    </svg>
  );
}

function DotsIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  );
}

function TargetIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

/**
 * Menu subjects. `page` links to a dedicated subject page; otherwise the item is matched to a
 * catalog entry by name prefix to build a `subjectId` filter on /tutors.
 */
const SUBJECTS: { label: string; match: string; icon: ReactNode; page?: string }[] = [
  { label: "Toán học", match: "toán học", page: "/mon-hoc/toan-hoc", icon: <SigmaIcon className={`${ICON} text-brand`} /> },
  { label: "Vật lý", match: "vật lý", icon: <AtomIcon className={`${ICON} text-role-admin`} /> },
  { label: "Hóa học", match: "hóa học", icon: <FlaskIcon className={`${ICON} text-role-shared`} /> },
  { label: "Tiếng Anh", match: "tiếng anh", icon: <LanguageIcon className={`${ICON} text-brand`} /> },
  { label: "Tin học", match: "tin học", icon: <CodeIcon className={`${ICON} text-status-info`} /> },
];

function subjectHref(subjects: CatalogItem[] | undefined, match: string) {
  const subject = findSubjectByName(subjects, match);
  return subject ? `/tutors?subjectId=${encodeURIComponent(subject.code)}` : "/tutors";
}

function buildColumns(subjects: CatalogItem[] | undefined): MenuColumn[] {
  return [
    {
      title: "Theo môn học",
      items: [
        ...SUBJECTS.map(({ label, match, icon, page }) => ({ label, icon, href: page ?? subjectHref(subjects, match) })),
        { label: "Xem thêm", href: "/tutors", icon: <DotsIcon className={`${ICON} text-content-secondary`} /> },
      ],
    },
    {
      title: "Theo cấp học",
      items: [
        { label: "Tiểu học", href: "/tutors?levelCode=PRIMARY", icon: <GraduationCapIcon className={`${ICON} text-status-success`} /> },
        { label: "THCS", href: "/tutors?levelCode=SECONDARY", icon: <GraduationCapIcon className={`${ICON} text-brand`} /> },
        { label: "THPT", href: "/tutors?levelCode=HIGH_SCHOOL", icon: <GraduationCapIcon className={`${ICON} text-status-error`} /> },
        { label: "Đại học", href: "/tutors?levelCode=UNIVERSITY", icon: <GraduationCapIcon className={`${ICON} text-status-warning`} /> },
        { label: "Luyện thi (THPT, ĐGNL,...)", href: "/tutors?levelCode=HIGH_SCHOOL", icon: <BookOpenIcon className={`${ICON} text-content-secondary`} /> },
      ],
    },
    {
      title: "Theo nhu cầu",
      items: [
        { label: "Củng cố kiến thức", href: "/tutors", icon: <TargetIcon className={`${ICON} text-status-error`} /> },
        { label: "Nâng cao, bồi dưỡng", href: "/tutors", icon: <TrendingUpIcon className={`${ICON} text-brand`} /> },
        { label: "Ôn thi & luyện đề", href: "/tutors", icon: <FileCheckIcon className={`${ICON} text-content-secondary`} /> },
        { label: "Học chuyên sâu", href: "/tutors", icon: <AwardIcon className={`${ICON} text-status-warning`} /> },
        { label: "Học nhóm", href: "/tutors", icon: <UsersIcon className={`${ICON} text-status-info`} /> },
      ],
    },
  ];
}

function useCourseMenuColumns() {
  const { data } = usePublicSubjects();
  return buildColumns(data);
}

/** Desktop "Khóa học" trigger with a full-width fat menu. Opens on hover, click, or keyboard. */
export function CourseMegaMenu() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const columns = useCourseMenuColumns();

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const openNow = () => {
    cancelClose();
    setOpen(true);
  };
  const closeSoon = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        rootRef.current?.querySelector<HTMLButtonElement>("button[aria-controls]")?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  useEffect(() => cancelClose, []);

  return (
    <div
      ref={rootRef}
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? setOpen(false) : openNow())}
        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full transition-colors ${
          open ? "bg-brand-50 text-brand" : "hover:bg-gray-900/5"
        }`}
      >
        Khóa học
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute left-0 right-0 top-full pt-3"
      >
        <div className="rounded-[28px] border border-border-default bg-surface-card shadow-xl p-6 lg:p-8 grid grid-cols-[1fr_1fr_1fr_minmax(0,300px)] gap-6">
          {columns.map((column, index) => (
            <div key={column.title} className={index > 0 ? "border-l border-border-default pl-6" : ""}>
              <p className="text-base font-bold text-content-primary mb-4">{column.title}</p>
              <ul className="space-y-1">
                {column.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium text-content-primary hover:bg-brand-50 hover:text-brand transition-colors"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <FeaturedCourseCard onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </div>
  );
}

function FeaturedCourseCard({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex flex-col justify-between rounded-3xl bg-linear-to-br from-brand-50 to-surface-base p-6">
      <div className="flex justify-center py-2" aria-hidden="true">
        <div className="relative">
          <BookOpenIcon className="w-16 h-16 text-status-warning" />
          <GraduationCapIcon className="absolute -top-6 left-4 w-12 h-12 text-brand" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm font-semibold text-brand">Khóa học nổi bật</p>
        <p className="mt-1 text-2xl font-bold text-content-primary">Luyện thi THPT</p>
        <p className="mt-2 text-sm text-content-secondary">Tăng tốc về đích cùng gia sư kinh nghiệm</p>
        <Link
          href="/tutors?levelCode=HIGH_SCHOOL"
          onClick={onNavigate}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          Xem ngay
          <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

/** Compact list for the mobile menu: one section per column. */
export function CourseMenuMobile({ onNavigate }: { onNavigate: () => void }) {
  const columns = useCourseMenuColumns();
  return (
    <details className="group rounded-xl">
      <summary className="flex cursor-pointer list-none items-center justify-between py-2 px-3 text-sm font-medium text-content-secondary hover:text-brand-950">
        Khóa học
        <ChevronDownIcon className="w-4 h-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-1 space-y-3 pl-3">
        {columns.map((column) => (
          <div key={column.title}>
            <p className="px-3 text-xs font-bold uppercase tracking-wide text-content-secondary">{column.title}</p>
            <ul className="mt-1">
              {column.items.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className="flex items-center gap-3 rounded-xl py-2 px-3 text-sm text-content-primary hover:bg-brand-50"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
