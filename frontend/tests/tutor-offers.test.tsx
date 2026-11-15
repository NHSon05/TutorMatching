import { render,screen,fireEvent,waitFor } from "@testing-library/react";
import { QueryClient,QueryClientProvider } from "@tanstack/react-query";
import { beforeEach,expect,it,vi } from "vitest";
import { TutorOffersEditorForm } from "@/components/tutors/TutorOffersEditor";
import { getCourses,saveCourse,removeOffer } from "@/lib/api/tutor-offers";
import { getTutorOnboarding } from "@/lib/api/tutor-onboarding";
import { getPublicCatalog } from "@/lib/api/catalog";
vi.mock("@/lib/api/tutor-offers",()=>({getAvailability:vi.fn(),getCourses:vi.fn(),saveAvailability:vi.fn(),saveCourse:vi.fn(),removeOffer:vi.fn()}));
vi.mock("@/lib/api/tutor-onboarding",()=>({getTutorOnboarding:vi.fn()}));
vi.mock("@/lib/api/catalog",()=>({getPublicCatalog:vi.fn()}));
beforeEach(()=>{vi.resetAllMocks();vi.mocked(getCourses).mockResolvedValue([]);vi.mocked(getTutorOnboarding).mockResolvedValue({discovery:{subjects:[{subjectId:"math",levelCodes:["HIGH_SCHOOL"]}]}} as Awaited<ReturnType<typeof getTutorOnboarding>>);vi.mocked(getPublicCatalog).mockResolvedValue([{code:"math",name:"Toán",isActive:true}]);});
function view(){render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}><TutorOffersEditorForm accountId="owner"/></QueryClientProvider>);}
it("edits and stops an existing course through the soft-delete API",async()=>{
 vi.mocked(getCourses).mockResolvedValue([{id:"course-1",subjectId:"math",name:"Toán 10",content:"Nội dung",sessionCount:8,pricePerSessionVnd:150000,status:"ACTIVE"}]);vi.mocked(removeOffer).mockResolvedValue();view();
 fireEvent.click(await screen.findByRole("button",{name:"Sửa Toán 10"}));expect(screen.getByLabelText("Số buổi")).toHaveValue(8);
 fireEvent.click(screen.getByRole("button",{name:"Ngừng khóa học đang sửa"}));await waitFor(()=>expect(removeOffer).toHaveBeenCalledWith("courses","course-1"));
});
it("reports load failure with a retry action",async()=>{vi.mocked(getCourses).mockRejectedValue(new Error("Network"));view();expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được");expect(screen.getByRole("button",{name:"Thử lại"})).toBeInTheDocument();});

it("saves course edits with the existing subject and course identifier",async()=>{
 vi.mocked(getCourses).mockResolvedValue([{id:"course-1",subjectId:"math",name:"Toán 10",content:"Nội dung",sessionCount:8,pricePerSessionVnd:150000,status:"ACTIVE"}]);
 vi.mocked(saveCourse).mockResolvedValue({id:"course-1",subjectId:"math",name:"Toán nâng cao",content:"Nội dung",sessionCount:8,pricePerSessionVnd:150000,status:"ACTIVE"});view();
 fireEvent.click(await screen.findByRole("button",{name:"Sửa Toán 10"}));fireEvent.change(screen.getByLabelText("Tên khóa học"),{target:{value:"Toán nâng cao"}});
 fireEvent.click(screen.getByRole("button",{name:"Lưu khóa học"}));await waitFor(()=>expect(saveCourse).toHaveBeenCalledWith({subjectId:"math",name:"Toán nâng cao",content:"Nội dung",sessionCount:8,pricePerSessionVnd:150000,status:"ACTIVE"},"course-1"));
});
