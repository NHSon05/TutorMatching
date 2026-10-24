import { render,screen,fireEvent,waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { beforeEach,expect,it,vi } from "vitest";
import { Step2Photo } from "@/components/tutor/onboarding/Step2Photo";
import { TutorProfessionalForm } from "@/components/profile/TutorProfessionalForm";
import { getTutorOnboarding,saveTutorOnboardingDraft,submitTutorOnboarding,uploadTutorAvatar,type TutorOnboardingResponse } from "@/lib/api/tutor-onboarding";
import { getPublicCatalog } from "@/lib/api/catalog";
import { createQueryClient,sessionKey } from "@/lib/query/client";
vi.mock("@/lib/api/tutor-onboarding",()=>({getTutorOnboarding:vi.fn(),saveTutorOnboardingDraft:vi.fn(),submitTutorOnboarding:vi.fn(),uploadTutorAvatar:vi.fn()}));
vi.mock("@/lib/api/catalog",()=>({getPublicCatalog:vi.fn()}));
vi.mock("@/lib/api/tutor-reviews",()=>({getReviewHistory:vi.fn(async()=>[])}));
const data:TutorOnboardingResponse={version:"10000000-0000-0000-0000-000000000001",status:"DRAFT",currentStep:6,about:{subjects:[],languages:["Tiếng Việt"]},hasCertifications:false,certifications:[],education:{degree:"Cử nhân"},description:{bio:"Giới thiệu",experienceYears:2},pricing:{sessionRateVnd:100000,isNegotiable:false},discovery:{subjects:[],teachingModes:[]}};
beforeEach(()=>{vi.resetAllMocks();vi.mocked(getTutorOnboarding).mockResolvedValue(data);vi.mocked(saveTutorOnboardingDraft).mockResolvedValue(data);vi.mocked(getPublicCatalog).mockImplementation(async kind=>kind==="subjects"?[{code:"math",name:"Toán",isActive:true}]:kind==="teaching-levels"?[{code:"HIGH_SCHOOL",name:"THPT",isActive:true}]:[]);});
function view(){const client=createQueryClient();client.setQueryData(sessionKey,{id:"owner",role:"TUTOR"});render(<QueryClientProvider client={client}><TutorProfessionalForm accountId="owner"/></QueryClientProvider>);}
it("saves normalized subject levels, teaching mode and current version",async()=>{
 view();fireEvent.click(await screen.findByRole("checkbox",{name:"Toán"}));fireEvent.click(screen.getByRole("checkbox",{name:"Toán — THPT"}));fireEvent.click(screen.getByRole("checkbox",{name:"Trực tuyến"}));fireEvent.click(screen.getByRole("button",{name:"Lưu hồ sơ giảng dạy"}));
 await waitFor(()=>expect(saveTutorOnboardingDraft).toHaveBeenCalledWith(expect.objectContaining({expectedVersion:data.version,discovery:expect.objectContaining({subjects:[{subjectId:"math",levelCodes:["HIGH_SCHOOL"]}],teachingModes:["ONLINE"]})}),expect.anything()));
});
it("pending review locks the professional form",async()=>{
 vi.mocked(getTutorOnboarding).mockResolvedValue({...data,status:"PENDING_REVIEW"});view();
 expect(await screen.findByLabelText("Giới thiệu bản thân")).toBeDisabled();
 expect(screen.getByRole("button",{name:"Lưu hồ sơ giảng dạy"})).toBeDisabled();
 expect(screen.queryByRole("button",{name:"Gửi duyệt hồ sơ"})).not.toBeInTheDocument();
});
it("submits the saved version and displays pending state",async()=>{
 vi.mocked(getTutorOnboarding).mockResolvedValueOnce(data).mockResolvedValue({...data,status:"PENDING_REVIEW"});vi.mocked(submitTutorOnboarding).mockResolvedValue({status:"PENDING_REVIEW",submittedAt:"2026-10-21T00:00:00Z",message:"Submitted"});view();
 fireEvent.click(await screen.findByRole("button",{name:"Gửi duyệt hồ sơ"}));
 await waitFor(()=>expect(submitTutorOnboarding).toHaveBeenCalledWith(data.version));
 expect(await screen.findByText("Đã gửi hồ sơ chờ duyệt.")).toBeInTheDocument();
});

it("keeps upload busy until the owner version refresh completes",async()=>{
 let finish!:()=>void;const versionRefresh=new Promise<void>(resolve=>{finish=resolve;});
 const busy=vi.fn();const uploaded=vi.fn(()=>versionRefresh);
 vi.mocked(uploadTutorAvatar).mockResolvedValue({fileUrl:"/uploads/avatars/test.png",fileName:"test.png"});
 const {container}=render(<Step2Photo avatarUrl="" onUploaded={uploaded} onUploadingChange={busy}/>);
 const input=container.querySelector<HTMLInputElement>('input[type="file"]')!;
 fireEvent.change(input,{target:{files:[new File(["test"],"test.png",{type:"image/png"})]}});
 await waitFor(()=>expect(uploaded).toHaveBeenCalledWith("/uploads/avatars/test.png"));
 expect(busy).toHaveBeenLastCalledWith(true);
 finish();await waitFor(()=>expect(busy).toHaveBeenLastCalledWith(false));
});
