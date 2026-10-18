import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { TutorProfessionalForm } from "@/components/profile/TutorProfessionalForm";
import { getTutorOnboarding, saveTutorOnboardingDraft, type TutorOnboardingResponse } from "@/lib/api/tutor-onboarding";
import { createQueryClient, sessionKey } from "@/lib/query/client";

vi.mock("@/lib/api/tutor-onboarding", () => ({ getTutorOnboarding: vi.fn(), saveTutorOnboardingDraft: vi.fn() }));
const data: TutorOnboardingResponse = {
  status: "APPROVED", currentStep: 6,
  about: { fullName: "Private Name", phoneNumber: "0901234567", subjects: ["Toán"], languages: ["Tiếng Việt"], teachingLevels: ["THPT"] },
  hasCertifications: true, certifications: [{ name: "Chứng chỉ A", issuer: "Trường A", fileUrl: "/certificate.pdf" }],
  education: { schoolName: "Trường A", degree: "Cử nhân", educationType: "GRADUATED", specialization: "Toán" },
  description: { bio: "Giới thiệu từ backend", experienceYears: 3 },
  pricing: { hourlyRateVnd: 200000, sessionRateVnd: 350000, monthlyRateVnd: 2000000, isNegotiable: true },
};
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getTutorOnboarding).mockResolvedValue(data); });
function setup() {
  const client = createQueryClient();
  client.setQueryData(sessionKey, { id: "tutor-1", role: "TUTOR" });
  render(<QueryClientProvider client={client}><TutorProfessionalForm accountId="tutor-1" /></QueryClientProvider>);
  return client;
}
it("loads professional data and saves independently without personal fields or losing hidden fields", async () => {
  vi.mocked(saveTutorOnboardingDraft).mockResolvedValue({ ...data, description: { ...data.description, bio: "Nội dung mới" } });
  setup();
  expect(await screen.findByLabelText("Giới thiệu bản thân")).toHaveValue(data.description.bio);
  expect(screen.getByLabelText("Môn học nhận dạy")).toHaveValue("Toán");
  expect(screen.getByText("Chứng chỉ A · Trường A")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Giới thiệu bản thân"), { target: { value: "Nội dung mới" } });
  fireEvent.click(screen.getByRole("button", { name: "Lưu hồ sơ giảng dạy" }));
  expect(await screen.findByText("Đã lưu hồ sơ giảng dạy.")).toBeInTheDocument();
  const request = vi.mocked(saveTutorOnboardingDraft).mock.calls[0][0];
  expect(request.about).toEqual({ subjects: ["Toán"], languages: ["Tiếng Việt"], teachingLevels: ["THPT"] });
  expect(request.education).toEqual(data.education);
  expect(request.pricing).toEqual(data.pricing);
  expect(request).not.toHaveProperty("certifications");
  expect(request).not.toHaveProperty("avatarUrl");
});
it("shows real errors rather than mock teaching data and retries", async () => {
  vi.mocked(getTutorOnboarding).mockRejectedValueOnce(new Error("offline")); setup();
  expect(await screen.findByRole("alert")).toHaveTextContent("Không thể tải hồ sơ giảng dạy");
  expect(screen.queryByLabelText("Môn học nhận dạy")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Thử lại hồ sơ giảng dạy" }));
  await screen.findByLabelText("Môn học nhận dạy");
});
it("keeps input after a failed save", async () => {
  vi.mocked(saveTutorOnboardingDraft).mockRejectedValue(new Error("offline")); setup();
  fireEvent.change(await screen.findByLabelText("Môn học nhận dạy"), { target: { value: "Toán, Tiếng Anh" } });
  fireEvent.click(screen.getByRole("button", { name: "Lưu hồ sơ giảng dạy" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Chưa thể lưu"));
  expect(screen.getByLabelText("Môn học nhận dạy")).toHaveValue("Toán, Tiếng Anh");
});
