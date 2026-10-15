import { TutorOnboardingWizard } from "@/components/tutor/onboarding/TutorOnboardingWizard";

export const metadata = {
  title: "Hoàn thiện hồ sơ gia sư | TutorMatch",
  description: "Thiết lập hồ sơ gia sư chuyên nghiệp để nhận đề xuất lớp học phù hợp.",
};

export default function TutorOnboardingPage() {
  return <TutorOnboardingWizard />;
}
