"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { MatchedTutorsDialog } from "@/components/tutors/MatchedTutorsDialog";
import {
  submitPublicTutorDemand,
  type SubmitTutorDemandResponse,
} from "@/lib/api/tutor-demands";
import { ApiError } from "@/lib/api/http";

const QUICK_PROMPTS = [
  {
    label: "Toán lớp 9 ôn thi vào 10 tại Cầu Giấy",
    prompt:
      "Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 tại Quận Cầu Giấy, học phí 400k/buổi tuần 2 buổi",
  },
  {
    label: "Tiếng Anh lớp 7 giao tiếp tại Đống Đa",
    prompt:
      "Tìm gia sư Tiếng Anh lớp 7 giao tiếp và ngữ pháp tại Đống Đa Hà Nội, học phí 500k/buổi",
  },
  {
    label: "Vật Lý lớp 12 luyện thi ĐH Online",
    prompt:
      "Cần gia sư dạy Vật Lý lớp 12 luyện thi đại học hình thức Online, học phí 400k/buổi",
  },
];

export function LandingDemandChat() {
  const [inputText, setInputText] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitTutorDemandResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function submitPrompt(rawQuery: string) {
    const trimmed = rawQuery.trim();
    if (trimmed.length < 10) {
      setErrorMessage(
        "Vui lòng mô tả nhu cầu tìm gia sư ít nhất 10 ký tự (ví dụ: môn học, lớp, khu vực, học phí)."
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLastQuery(trimmed);

    try {
      const response = await submitPublicTutorDemand(trimmed);
      setResult(response);
      setIsDialogOpen(true);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.title);
      } else {
        setErrorMessage("Không thể xử lý yêu cầu lúc này. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;
    await submitPrompt(inputText);
  }

  return (
    <section
      id="ai-concierge"
      aria-labelledby="landing-demand-chat-heading"
      className="w-full max-w-3xl mx-auto"
    >
      <h2 id="landing-demand-chat-heading" className="sr-only">
        Nhập yêu cầu tìm gia sư của bạn
      </h2>

      {/* Workday AI Concierge Hero Pill Bar */}
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div className="relative flex items-center gap-3 rounded-full bg-surface-card/95 backdrop-blur-xl border border-white/60 shadow-2xl pl-4 pr-2 py-2 sm:pl-5 sm:pr-2.5 sm:py-2.5 transition-all focus-within:ring-4 focus-within:ring-white/30">
          <label htmlFor="landing-demand-chat-input" className="sr-only">
            Nhập yêu cầu tìm gia sư của bạn
          </label>
          <input
            id="landing-demand-chat-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder="Ví dụ: Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 tại Quận Cầu Giấy, học phí 400k/buổi tuần 2 buổi..."
            className="flex-1 min-w-0 bg-transparent border-0 text-sm sm:text-base font-medium text-brand-950 placeholder:text-gray-400 focus:outline-none py-1.5 truncate"
          />

          <button
            type="submit"
            disabled={isLoading}
            aria-label="Gửi yêu cầu"
            className="sm:w-12 sm:h-12 rounded-full bg-brand hover:bg-brand text-white flex items-center justify-center shrink-0 transition-all shadow-md cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <svg
                className="w-5 h-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            )}
          </button>
        </div>

        {/* Workday Frosted Glass Suggestion Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
          {QUICK_PROMPTS.map((item) => (
            <button
              key={item.prompt}
              type="button"
              onClick={() => setInputText(item.prompt)}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-xl border border-white/25 px-4 py-2 text-xs sm:text-sm font-medium text-white transition-all cursor-pointer shadow-xs"
            >
              <span className="truncate max-w-xs sm:max-w-md">
                {item.label}
              </span>
            </button>
          ))}

          {result && (
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={() => setIsDialogOpen(true)}
              className="bg-white/15 hover:bg-white/25 backdrop-blur-xl border border-white/25 px-4 py-2 text-xs sm:text-sm font-medium text-white transition-all cursor-pointer shadow-xs"
              shape="pill"
            >
              {`Xem lại kết quả (${result.matchedTutors.length})`}
            </Button>
          )}
        </div>
      </form>

      {errorMessage && (
        <div
          role="alert"
          className="mt-3 rounded-2xl border border-red-200 bg-red-50/95 backdrop-blur-md px-4 py-3 text-xs sm:text-sm font-medium text-red-700 text-left shadow-sm"
        >
          {errorMessage}
        </div>
      )}

      {/* Dialog listing full details of matched tutors */}
      <MatchedTutorsDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        queryText={lastQuery}
        result={result}
      />
    </section>
  );
}

export default LandingDemandChat;
