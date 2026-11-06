"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PromptField } from "@/components/ui/prompt-field";
import { MatchedTutorsDialog } from "@/components/tutors/MatchedTutorsDialog";
import {
  submitPublicTutorDemand,
  type SubmitTutorDemandResponse,
} from "@/lib/api/tutor-demands";
import { ApiError } from "@/lib/api/http";

const QUICK_PROMPTS = [
  "Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 tại Quận Cầu Giấy, học phí 250k/buổi tuần 2 buổi",
  "Tìm gia sư Tiếng Anh lớp 7 giao tiếp và ngữ pháp tại Đống Đa Hà Nội, học phí 200k/buổi",
  "Cần gia sư dạy Vật Lý lớp 12 luyện thi đại học hình thức Online, học phí 250k/buổi",
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
      aria-labelledby="landing-demand-chat-heading"
      className="w-full max-w-4xl mx-auto"
    >
      <Card
        padding="medium"
        className="rounded-3xl border-blue-100/90 shadow-lg shadow-blue-500/5 bg-white/95 backdrop-blur-sm space-y-4"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 text-left">
            <Badge variant="success" dot size="small">
              Trợ lý AI Tìm Gia Sư
            </Badge>
            <h2
              id="landing-demand-chat-heading"
              className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight"
            >
              Nhập yêu cầu tìm gia sư của bạn
            </h2>
            <p className="text-base text-neutral-700">
              Mô tả môn học, lớp, khu vực, học phí bằng câu tự nhiên
            </p>
          </div>
        </div>

        {/* Prompt Input Form */}
        <form onSubmit={handleFormSubmit} className="space-y-3">
          <label htmlFor="landing-demand-chat-input" className="sr-only">
            Nhập yêu cầu tìm gia sư của bạn
          </label>
          <PromptField
            value={inputText}
            onChange={setInputText}
            onSubmit={(val) => void submitPrompt(val)}
            isLoading={isLoading}
            placeholder="Ví dụ: Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 tại Quận Cầu Giấy, học phí 250k/buổi tuần 2 buổi..."
          />

          {/* Quick Prompt Suggestions & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-base font-medium text-neutrla-900">
                Gợi ý:
              </span>
              {QUICK_PROMPTS.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setInputText(sample)}
                  className="text-left text-base font-medium px-2 py-1 rounded-sm bg-blue-50/70 border border-blue-200/80 text-brand hover:bg-blue-100/80 transition cursor-pointer truncate max-w-xs sm:max-w-sm"
                >
                  {sample}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {result && (
                <Button
                  type="button"
                  variant="secondary"
                  size="large"
                  onClick={() => setIsDialogOpen(true)}
                >
                  {`Xem lại kết quả (${result.matchedTutors.length})`}
                </Button>
              )}
            </div>
          </div>
        </form>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 text-left"
          >
            {errorMessage}
          </div>
        )}
      </Card>

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
