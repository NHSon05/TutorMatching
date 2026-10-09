"use client";

import * as React from "react";
import Link from "next/link";

import type { WelcomeBannerCardProps } from "./types";


export function WelcomeBannerCard({
  title,
  description,
  actionText,
  actionHref,
}: WelcomeBannerCardProps) {
  const [activeSlide, setActiveSlide] = React.useState(0);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-cyan-400 via-cyan-500 to-blue-600 text-white p-7 sm:p-9 shadow-sm">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none"
      />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left Content */}
        <div className="max-w-md space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-xs">
            {title}
          </h2>
          <p className="text-sm sm:text-base text-indigo-100 font-normal leading-relaxed opacity-95">
            {description}
          </p>

          <div className="pt-2">
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold tracking-wider text-white hover:text-indigo-200 transition-colors uppercase select-none group"
            >
              <span>{actionText}</span>
              <span className="transition-transform group-hover:translate-x-1 font-bold">
                →
              </span>
            </Link>
          </div>
        </div>

        {/* Right 3D Books Illustration */}
        <div className="shrink-0 self-center md:self-auto relative pr-2">
          <div className="relative w-48 h-36 flex items-center justify-center">
            {/* SVG 3D Stacked Books Illustration */}
            <svg
              viewBox="0 0 200 150"
              className="w-full h-full drop-shadow-xl"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="3D books illustration"
            >
              {/* Bottom Blue Book Shadow */}
              <ellipse
                cx="100"
                cy="135"
                rx="65"
                ry="12"
                fill="#2c2794"
                fillOpacity="0.35"
              />

              {/* Bottom Book (Deep Blue) */}
              <g transform="translate(15, 20)">
                {/* Book spine & bottom cover */}
                <path
                  d="M10 65 C10 65 30 80 80 80 C130 80 150 65 150 65 L150 82 C150 82 130 97 80 97 C30 97 10 82 10 82 Z"
                  fill="#2b3b8f"
                />
                {/* Book pages (White edges) */}
                <path
                  d="M14 62 C14 62 32 76 80 76 C128 76 146 62 146 62 L146 76 C146 76 128 90 80 90 C32 90 14 76 14 76 Z"
                  fill="#f8fafc"
                />
                {/* Book top cover */}
                <path
                  d="M10 58 C10 58 30 72 80 72 C130 72 150 58 150 58 L146 54 C146 54 128 68 80 68 C32 68 14 54 14 54 Z"
                  fill="#3b4fa8"
                />
                {/* Blue bookmark ribbon */}
                <path
                  d="M75 75 L75 96 L80 91 L85 96 L85 75 Z"
                  fill="#1d2766"
                />
              </g>

              {/* Top Book (Vibrant Red) */}
              <g transform="translate(10, 5)">
                {/* Book bottom cover */}
                <path
                  d="M15 48 C15 48 35 63 85 63 C135 63 155 48 155 48 L155 64 C155 64 135 79 85 79 C35 79 15 64 15 64 Z"
                  fill="#b91c1c"
                />
                {/* Book pages (Crisp White) */}
                <path
                  d="M18 45 C18 45 37 59 85 59 C133 59 152 45 152 45 L152 58 C152 58 133 72 85 72 C37 72 18 58 18 58 Z"
                  fill="#ffffff"
                />
                {/* Book top cover / curved face */}
                <path
                  d="M15 40 C15 40 35 55 85 55 C135 55 155 40 155 40 L150 36 C150 36 132 50 85 50 C38 50 20 36 20 36 Z"
                  fill="#dc2626"
                />
                {/* Book top cover 3D sheen */}
                <ellipse
                  cx="85"
                  cy="46"
                  rx="58"
                  ry="10"
                  fill="#ef4444"
                />
                {/* White / Gold bookmark ribbon hanging down */}
                <path
                  d="M80 58 L80 82 L85 77 L90 82 L90 58 Z"
                  fill="#fef08a"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Carousel dots pagination */}
      <div className="flex items-center justify-center gap-1.5 pt-4">
        {[0, 1, 2].map((idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveSlide(idx)}
            aria-label={`Chuyển tới slide ${idx + 1}`}
            className={`transition-all duration-300 rounded-full h-1.5 ${
              activeSlide === idx
                ? "w-6 bg-white shadow-xs"
                : "w-1.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default WelcomeBannerCard;
