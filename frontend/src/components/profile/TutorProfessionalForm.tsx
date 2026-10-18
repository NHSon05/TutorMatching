"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTutorOnboarding, saveTutorOnboardingDraft, type TutorOnboardingResponse } from "@/lib/api/tutor-onboarding";
import { sessionKey } from "@/lib/query/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { TextField } from "@/components/ui/text-field";
import { TextArea } from "@/components/ui/text-area";
import { Badge } from "@/components/ui/badge";

export function TutorProfessionalForm({ accountId }: { accountId: string }) {
  const query = useQuery({
    queryKey: ["tutor-profile", accountId],
    queryFn: ({ signal }) => getTutorOnboarding(signal),
  });
  if (query.isPending) return <Card><p role="status">Đang tải hồ sơ giảng dạy...</p></Card>;
  if (query.isError) return <Card><p role="alert" className="mb-3 text-status-error">Không thể tải hồ sơ giảng dạy.</p><Button variant="secondary" onClick={() => void query.refetch()}>Thử lại hồ sơ giảng dạy</Button></Card>;
  return <ProfessionalEditor key={accountId} initial={query.data} accountId={accountId} />;
}

function ProfessionalEditor({ initial, accountId }: { initial: TutorOnboardingResponse; accountId: string }) {
  const client = useQueryClient();
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const mutation = useMutation({ mutationFn: saveTutorOnboardingDraft });
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const list = (value: string) => value.split(",").map(item => item.trim()).filter(Boolean);
  function change(next: TutorOnboardingResponse) {
    setDraft(next);
    setMessage("");
    setSuccess(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (mutation.isPending) return;
    const rates = [draft.pricing.hourlyRateVnd, draft.pricing.sessionRateVnd, draft.pricing.monthlyRateVnd];
    if (rates.some(rate => rate != null && (!Number.isSafeInteger(rate) || rate <= 0)) ||
        (draft.description.experienceYears != null && (!Number.isInteger(draft.description.experienceYears) || draft.description.experienceYears < 0))) {
      setSuccess(false);
      setMessage("Học phí phải là số nguyên dương; số năm kinh nghiệm phải là số nguyên không âm.");
      return;
    }
    const session = client.getQueryData(sessionKey);
    try {
      const result = await mutation.mutateAsync({
        about: { subjects: draft.about.subjects, languages: draft.about.languages, teachingLevels: draft.about.teachingLevels },
        education: draft.education,
        description: draft.description,
        pricing: draft.pricing,
      });
      if (!session || client.getQueryData(sessionKey) !== session) return;
      await client.cancelQueries({ queryKey: ["tutor-profile", accountId] });
      if (client.getQueryData(sessionKey) !== session) return;
      client.setQueryData(["tutor-profile", accountId], result);
      setDraft(result);
      setSaved(result);
      setSuccess(true);
      setMessage("Đã lưu hồ sơ giảng dạy.");
    } catch {
      setSuccess(false);
      setMessage("Chưa thể lưu hồ sơ giảng dạy. Vui lòng thử lại; nội dung nhập vẫn được giữ lại.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-bold text-content-primary">Hồ sơ giảng dạy</h2>
        <p className="text-sm text-content-secondary">Chuyên môn, giới thiệu và học phí từ hồ sơ gia sư của bạn.</p>
      </CardHeader>
      <form onSubmit={submit} className="space-y-6">
        <fieldset disabled={mutation.isPending} className="grid min-w-0 gap-5 sm:grid-cols-2">
          <TextField label="Môn học nhận dạy" defaultValue={draft.about.subjects?.join(", ") ?? ""} key={`subjects-${saved.about.subjects?.join(",")}`} onChange={e => change({ ...draft, about: { ...draft.about, subjects: list(e.target.value) } })} helperText="Phân cách các môn bằng dấu phẩy." />
          <TextField label="Cấp học" defaultValue={draft.about.teachingLevels?.join(", ") ?? ""} key={`levels-${saved.about.teachingLevels?.join(",")}`} onChange={e => change({ ...draft, about: { ...draft.about, teachingLevels: list(e.target.value) } })} helperText="Phân cách các cấp học bằng dấu phẩy." />
          <TextField label="Ngôn ngữ giảng dạy" defaultValue={draft.about.languages?.join(", ") ?? ""} key={`languages-${saved.about.languages?.join(",")}`} onChange={e => change({ ...draft, about: { ...draft.about, languages: list(e.target.value) } })} />
          <TextField label="Số năm kinh nghiệm" type="number" min={0} step={1} value={draft.description.experienceYears ?? ""} onChange={e => change({ ...draft, description: { ...draft.description, experienceYears: e.target.value === "" ? undefined : Number(e.target.value) } })} />
          <TextField label="Trường / cơ sở đào tạo" value={draft.education.schoolName ?? ""} onChange={e => change({ ...draft, education: { ...draft.education, schoolName: e.target.value } })} />
          <TextField label="Chuyên ngành" value={draft.education.specialization ?? ""} onChange={e => change({ ...draft, education: { ...draft.education, specialization: e.target.value } })} />
          <TextField label="Bằng cấp" value={draft.education.degree ?? ""} onChange={e => change({ ...draft, education: { ...draft.education, degree: e.target.value } })} />
          <TextField label="Học phí theo giờ (VNĐ)" type="number" min={1} step={1} value={draft.pricing.hourlyRateVnd ?? ""} onChange={e => change({ ...draft, pricing: { ...draft.pricing, hourlyRateVnd: e.target.value === "" ? undefined : Number(e.target.value) } })} />
          <TextArea className="sm:col-span-2" label="Giới thiệu bản thân" rows={4} value={draft.description.bio ?? ""} onChange={e => change({ ...draft, description: { ...draft.description, bio: e.target.value } })} />
          <TextArea label="Phương pháp giảng dạy" rows={3} value={draft.description.teachingMethodology ?? ""} onChange={e => change({ ...draft, description: { ...draft.description, teachingMethodology: e.target.value } })} />
          <TextArea label="Thành tích & kết quả" rows={3} value={draft.description.achievementsAndResults ?? ""} onChange={e => change({ ...draft, description: { ...draft.description, achievementsAndResults: e.target.value } })} />
        </fieldset>
        <section className="rounded-xl bg-surface-base p-4" aria-label="Chứng chỉ hiện có">
          <h3 className="mb-2 text-sm font-semibold">Chứng chỉ trong hồ sơ</h3>
          {draft.certifications.length ? <div className="flex flex-wrap gap-2">{draft.certifications.map((certificate, index) => <Badge key={`${certificate.name}-${index}`} variant="tutor">{certificate.name} · {certificate.issuer}</Badge>)}</div> : <p className="text-sm text-content-secondary">Chưa có chứng chỉ được cập nhật.</p>}
        </section>
        {message && <p role={success ? "status" : "alert"} className={`text-sm ${success ? "text-status-success" : "text-status-error"}`}>{message}</p>}
        <div className="flex justify-end border-t border-border-default pt-5">
          <Button type="submit" variant="tutor" disabled={!dirty} isLoading={mutation.isPending}>{mutation.isPending ? "Đang lưu hồ sơ..." : "Lưu hồ sơ giảng dạy"}</Button>
        </div>
      </form>
    </Card>
  );
}
