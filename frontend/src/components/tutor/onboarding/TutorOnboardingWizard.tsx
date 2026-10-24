"use client";

import { useState, useEffect, useRef } from "react";
import { TutorReviewHistory } from "@/components/profile/TutorReviewHistory";
import { TutorDiscoveryFields } from "@/components/profile/TutorDiscoveryFields";
import type { TutorDiscoveryData } from "@/lib/api/tutor-onboarding";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api/http";
import {
  getTutorOnboarding,
  saveTutorOnboardingDraft,
  submitTutorOnboarding,
  type SaveOnboardingDraftRequest,
} from "@/lib/api/tutor-onboarding";
import { useAuthStore } from "@/stores/use-auth-store";
import { INITIAL_FORM_STATE, STEPS, type OnboardingFormState } from "./types";
import { Step1About } from "./Step1About";
import { Step2Photo } from "./Step2Photo";
import { Step3Certifications } from "./Step3Certifications";
import { Step4Education } from "./Step4Education";
import { Step5Description } from "./Step5Description";
import { Step6Pricing } from "./Step6Pricing";

export function TutorOnboardingWizard() {
  const ownerId = useAuthStore(state => state.user?.id);
  const [profileStatus, setProfileStatus] = useState("DRAFT");
  const version = useRef<string | undefined>(undefined);
  const [discovery,setDiscovery]=useState<TutorDiscoveryData>({subjects:[],teachingModes:[]});
  const [formState, setFormState] = useState<OnboardingFormState>(INITIAL_FORM_STATE);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isAvatarUploading,setIsAvatarUploading]=useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);

  // 1. Tải dữ liệu hồ sơ Onboarding hiện tại
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await getTutorOnboarding();
        if (!isMounted) return;
        version.current=res.version;
        setProfileStatus(res.status);
        setDiscovery(res.discovery??{subjects:[],teachingModes:[]});

        // Nếu hồ sơ đã nộp và đang chờ duyệt hoặc đã duyệt
        if (res.status === "PENDING_REVIEW" || res.status === "APPROVED") {
          setIsSubmittedSuccess(true);
        }

        setFormState({
          currentStep: res.currentStep || 1,
          about: {
            fullName: res.about?.fullName || "",
            dateOfBirth: res.about?.dateOfBirth || "",
            phoneNumber: res.about?.phoneNumber || "",
            subjects: res.about?.subjects || [],
            languages: res.about?.languages?.length ? res.about.languages : ["Tiếng Việt"],
            teachingLevels: res.about?.teachingLevels || [],
          },
          avatarUrl: res.avatarUrl || "",
          hasCertifications: res.hasCertifications || false,
          certifications: res.certifications || [],
          education: {
            educationType: (res.education?.educationType as "GRADUATED" | "STUDYING" | "NO_DEGREE") || "STUDYING",
            schoolName: res.education?.schoolName || "",
            degree: res.education?.degree || "",
            specialization: res.education?.specialization || "",
            yearOfStudy: res.education?.yearOfStudy,
          },
          description: {
            bio: res.description?.bio || "",
            experienceYears: res.description?.experienceYears ?? 1,
            teachingMethodology: res.description?.teachingMethodology || "",
            achievementsAndResults: res.description?.achievementsAndResults || "",
          },
          pricing: {
            hourlyRateVnd: res.pricing?.hourlyRateVnd ?? 150000,
            sessionRateVnd: res.pricing?.sessionRateVnd,
            monthlyRateVnd: res.pricing?.monthlyRateVnd,
            isNegotiable: res.pricing?.isNegotiable ?? true,
          },
        });
        setCurrentStep(res.currentStep || 1);
      } catch {
        // Fallback to default
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper build draft request
  const buildDraftPayload = (step: number): SaveOnboardingDraftRequest => ({
    currentStep: step,
    expectedVersion: version.current,
    discovery,
    about: {
      fullName: formState.about.fullName,
      dateOfBirth: formState.about.dateOfBirth || undefined,
      phoneNumber: formState.about.phoneNumber || undefined,

      languages: formState.about.languages,

    },
    avatarUrl: formState.avatarUrl || undefined,
    hasCertifications: formState.hasCertifications,
    certifications: formState.certifications,
    education: {
      educationType: formState.education.educationType,
      schoolName: formState.education.schoolName || undefined,
      degree: formState.education.degree || undefined,
      specialization: formState.education.specialization || undefined,
      yearOfStudy: formState.education.yearOfStudy,
    },
    description: {
      bio: formState.description.bio || undefined,
      experienceYears: formState.description.experienceYears,
      teachingMethodology: formState.description.teachingMethodology || undefined,
      achievementsAndResults: formState.description.achievementsAndResults || undefined,
    },
    pricing: {
      hourlyRateVnd: formState.pricing.hourlyRateVnd,
      sessionRateVnd: formState.pricing.sessionRateVnd,
      monthlyRateVnd: formState.pricing.monthlyRateVnd,
      isNegotiable: formState.pricing.isNegotiable,
    },
  });

  // 2. Validate theo từng bước
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formState.about.fullName.trim() || formState.about.fullName.trim().length < 2) {
        newErrors.fullName = "Vui lòng nhập họ và tên (tối thiểu 2 ký tự).";
      }
      if (!formState.about.dateOfBirth) {
        newErrors.dateOfBirth = "Vui lòng chọn ngày sinh.";
      }
      if (!formState.about.phoneNumber.trim()) {
        newErrors.phoneNumber = "Vui lòng nhập số điện thoại liên hệ.";
      }
      if ((discovery.subjects?.length??0) === 0) {
        newErrors.subjects = "Vui lòng chọn ít nhất 1 môn học nhận dạy.";
      }
      if (formState.about.languages.length === 0) {
        newErrors.languages = "Vui lòng chọn ít nhất 1 ngôn ngữ giảng dạy.";
      }
      if (discovery.subjects?.some(s=>s.levelCodes.length===0)) {
        newErrors.teachingLevels = "Vui lòng chọn ít nhất 1 cấp học nhận dạy.";
      }
    } else if (step === 2) {
      if (!formState.avatarUrl) {
        newErrors.avatarUrl = "Vui lòng tải lên ảnh đại diện của bạn.";
      }
    } else if (step === 3) {
      if (formState.hasCertifications && formState.certifications.length === 0) {
        newErrors.certifications = "Vui lòng thêm thông tin chứng chỉ hoặc chọn 'Chưa có chứng chỉ'.";
      }
    } else if (step === 4) {
      if(!formState.education.degree.trim())newErrors.qualification="Vui lòng nhập trình độ chuyên môn.";
      if (formState.education.educationType !== "NO_DEGREE" && !formState.education.schoolName.trim()) {
        newErrors.schoolName = "Vui lòng nhập tên trường đại học / cao đẳng.";
      }
    } else if (step === 5) {
      if (!formState.description.bio.trim() || formState.description.bio.trim().length < 20) {
        newErrors.bio = "Vui lòng nhập phần giới thiệu bản thân (tối thiểu 20 ký tự).";
      }
      if (formState.description.experienceYears === undefined || formState.description.experienceYears < 0) {
        newErrors.experienceYears = "Vui lòng nhập số năm kinh nghiệm hợp lệ (≥ 0).";
      }
    } else if (step === 6) {
      const hasRate = Number.isInteger(formState.pricing.sessionRateVnd) && (formState.pricing.sessionRateVnd??0)>0;
      if (!hasRate) {
        newErrors.pricing = "Vui lòng nhập giá theo buổi là số nguyên dương.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper để map lỗi từ backend xuống form error state
  const handleBackendError = (err: unknown) => {
    if (err instanceof ApiError && err.errors) {
      const fieldErrors: Record<string, string> = {};
      for (const [key, messages] of Object.entries(err.errors)) {
        if (messages && messages.length > 0) {
          fieldErrors[key] = messages[0];
        }
      }
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      if (fieldErrors.phoneNumber || fieldErrors.fullName || fieldErrors.dateOfBirth || fieldErrors.subjects || fieldErrors.teachingModes || fieldErrors.districtCode) {
        setCurrentStep(1);
      }
    }
  };

  // 3. Xử lý lưu nháp
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setSaveMessage(null);
    try {
      const saved=await saveTutorOnboardingDraft(buildDraftPayload(currentStep)); version.current=saved.version;
      setSaveMessage("✓ Đã lưu nháp tiến độ thành công!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      handleBackendError(err);
      if (err instanceof ApiError && err.status === 409) {
        setSaveMessage("Số điện thoại đã tồn tại trên hệ thống.");
      } else {
        setSaveMessage("Không thể lưu nháp. Vui lòng kiểm tra lại thông tin.");
      }
    } finally {
      setIsSavingDraft(false);
    }
  };

  // 4. Tiếp tục sang bước tiếp theo
  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    // Tự động lưu nháp sang backend trước khi chuyển bước
    try {
      const saved=await saveTutorOnboardingDraft(buildDraftPayload(currentStep + 1)); version.current=saved.version;
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      handleBackendError(err);
      if (err instanceof ApiError && err.status === 409) {
        alert("Số điện thoại bạn nhập đã được sử dụng bởi một tài khoản khác. Vui lòng kiểm tra lại.");
      }
    }
  };

  // 5. Quay lại bước trước
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // 6. Nộp hồ sơ xét duyệt chính thức
  const handleSubmit = async () => {
    // Validate toàn bộ 6 bước
    for (let s = 1; s <= 6; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Lưu lại dữ liệu bước 6 trước
      const saved=await saveTutorOnboardingDraft(buildDraftPayload(6)); version.current=saved.version;
      // Nộp hồ sơ
      const res = await submitTutorOnboarding(version.current);
      setProfileStatus(res.status);
      if (res.status === "PENDING_REVIEW") {
        setIsSubmittedSuccess(true);
        // Cập nhật trạng thái người dùng trong Zustand Store
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.getState().setAuth({
            user: { ...currentUser, tutorProfileStatus: "PENDING_REVIEW" },
          });
        }
      }
    } catch (err) {
      handleBackendError(err);
      alert("Nộp hồ sơ thất bại. Vui lòng kiểm tra lại các trường thông tin hoặc thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 py-12">
        <Spinner size="large" />
        <span className="text-sm text-gray-500 mt-3 font-medium">Đang tải hồ sơ gia sư...</span>
      </div>
    );
  }

  // Màn hình thông báo khi đã nộp hồ sơ chờ duyệt thành công
  if (isSubmittedSuccess) {
    return (
      <div className="max-w-2xl mx-auto my-8 bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl font-bold">
          ⏳
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
          {profileStatus === "APPROVED" ? "Hồ sơ của bạn đã được duyệt" : "Hồ sơ của bạn đang chờ phê duyệt"}
        </h1>
        <p className="text-gray-600 text-sm sm:text-base max-w-lg mx-auto mb-6 leading-relaxed">
          Bạn có thể xem kết quả và lý do trong lịch sử duyệt hồ sơ bên dưới.
        </p>

        {ownerId && <div className="mb-5 text-left"><TutorReviewHistory accountId={ownerId} /></div>}
        <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200/80 text-left text-xs text-amber-900 mb-8 space-y-1.5">
          <p className="font-semibold">💡 Trong thời gian chờ duyệt:</p>
          <p>• Bạn có thể xem lại thông tin. Hồ sơ chờ duyệt chưa thể chỉnh sửa.</p>
          <p>• Khi được phê duyệt, bạn sẽ nhận được thông báo và hồ sơ sẽ được hiển thị công khai tới hàng ngàn học viên.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            type="button"
            variant="tutor"
            size="medium"
            onClick={() => {
              setIsSubmittedSuccess(false);
              setCurrentStep(1);
            }}
          >
            Xem lại thông tin đã nộp
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <p>Trạng thái hồ sơ: {profileStatus}</p>
      {ownerId && <TutorReviewHistory accountId={ownerId} />}
      {/* ========================================================================= */}
      {/* HEADER VÀ STEPPER TIẾN ĐỘ 6 BƯỚC                                          */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Hoàn thiện hồ sơ Gia sư
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Bước {currentStep}/6: {STEPS[currentStep - 1].title} — {STEPS[currentStep - 1].description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="small"
              disabled={isSavingDraft || isSubmitting || isAvatarUploading}
              onClick={handleSaveDraft}
            >
              {isSavingDraft ? "Đang lưu..." : "💾 Lưu nháp"}
            </Button>
            {saveMessage && (
              <span className="text-xs text-green-700 font-semibold animate-fade-in">
                {saveMessage}
              </span>
            )}
          </div>
        </div>

        {/* Thanh Stepper ngang */}
        <div className="grid grid-cols-6 gap-2">
          {STEPS.map((s) => {
            const isPassed = s.id < currentStep;
            const isCurrent = s.id === currentStep;

            return (
              <div
                key={s.id}
                onClick={() => {
                  // Cho phép nhấp quay lại các bước đã hoàn thành
                  if (isPassed) setCurrentStep(s.id);
                }}
                className={`flex flex-col items-center cursor-pointer select-none group`}
              >
                {/* Thanh line & số bước */}
                <div
                  className={`w-full h-2 rounded-full mb-2 transition-all ${
                    isPassed
                      ? "bg-amber-600"
                      : isCurrent
                      ? "bg-amber-500 ring-2 ring-amber-300 ring-offset-1"
                      : "bg-gray-200"
                  }`}
                />
                <span
                  className={`text-[11px] font-semibold text-center truncate max-w-full hidden sm:block ${
                    isCurrent
                      ? "text-amber-700"
                      : isPassed
                      ? "text-gray-900"
                      : "text-gray-400"
                  }`}
                >
                  {s.id}. {s.shortTitle}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NỘI DUNG TỪNG BƯỚC                                                        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm">
        {currentStep === 1 && (
          <>
          <TutorDiscoveryFields value={discovery} onChange={setDiscovery}/>
          {Object.values(errors).length>0&&<p role="alert">{Object.values(errors).join(" ")}</p>}
          <Step1About
            data={formState.about}
            onChange={(updated) =>
              setFormState((prev) => ({ ...prev, about: { ...prev.about, ...updated } }))
            }
            errors={errors}
          />
          </>
        )}

        {currentStep === 2 && (
          <Step2Photo
            avatarUrl={formState.avatarUrl}
            onUploadingChange={setIsAvatarUploading}
            onUploaded={async(url) => { const latest=await getTutorOnboarding();version.current=latest.version;setFormState((prev) => ({ ...prev, avatarUrl: url })); }}
            error={errors.avatarUrl}
          />
        )}

        {currentStep === 3 && (
          <Step3Certifications
            hasCertifications={formState.hasCertifications}
            certifications={formState.certifications}
            onToggleHasCerts={(has) =>
              setFormState((prev) => ({ ...prev, hasCertifications: has }))
            }
            onUpdateCertifications={(certs) =>
              setFormState((prev) => ({ ...prev, certifications: certs }))
            }
            error={errors.certifications}
          />
        )}

        {currentStep === 4 && (
          <Step4Education
            data={formState.education}
            onChange={(updated) =>
              setFormState((prev) => ({ ...prev, education: { ...prev.education, ...updated } }))
            }
            errors={errors}
          />
        )}

        {currentStep === 5 && (
          <Step5Description
            data={formState.description}
            onChange={(updated) =>
              setFormState((prev) => ({
                ...prev,
                description: { ...prev.description, ...updated },
              }))
            }
            errors={errors}
          />
        )}

        {currentStep === 6 && (
          <Step6Pricing
            data={formState.pricing}
            onChange={(updated) =>
              setFormState((prev) => ({ ...prev, pricing: { ...prev.pricing, ...updated } }))
            }
            errors={errors}
            fullState={formState}
          />
        )}

        {/* ========================================================================= */}
        {/* NÚT ĐIỀU HƯỚNG DƯỚI CÙNG (BOTTOM NAVIGATION)                              */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-100">
          <Button
            type="button"
            variant="secondary"
            size="medium"
            disabled={currentStep === 1 || isSubmitting || isSavingDraft || isAvatarUploading}
            onClick={handleBack}
          >
            ← Quay lại
          </Button>

          <div className="flex items-center gap-3">
            {currentStep < 6 ? (
              <Button
                type="button"
                variant="tutor"
                size="medium"
                disabled={isSavingDraft || isSubmitting || isAvatarUploading}
                onClick={handleNext}
              >
                Tiếp tục bước tiếp theo →
              </Button>
            ) : (
              <Button
                type="button"
                variant="tutor"
                size="medium"
                disabled={isSubmitting || isSavingDraft || isAvatarUploading}
                onClick={handleSubmit}
                className="font-bold shadow-md"
              >
                {isSubmitting ? "Đang gửi hồ sơ..." : "✓ Hoàn tất & Nộp hồ sơ xét duyệt"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
