import { render,screen,fireEvent,waitFor } from "@testing-library/react";
import { QueryClient,QueryClientProvider } from "@tanstack/react-query";
import { beforeEach,expect,it,vi } from "vitest";
import { TutorOffersEditorForm } from "@/components/tutors/TutorOffersEditor";
import { getAvailability,getCourses,saveAvailability,saveCourse,removeOffer } from "@/lib/api/tutor-offers";
import { getTutorOnboarding } from "@/lib/api/tutor-onboarding";
import { getPublicCatalog } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/http";
vi.mock("@/lib/api/tutor-offers",()=>({getAvailability:vi.fn(),getCourses:vi.fn(),saveAvailability:vi.fn(),saveCourse:vi.fn(),removeOffer:vi.fn()}));
vi.mock("@/lib/api/tutor-onboarding",()=>({getTutorOnboarding:vi.fn()}));
vi.mock("@/lib/api/catalog",()=>({getPublicCatalog:vi.fn()}));
beforeEach(()=>{vi.resetAllMocks();vi.mocked(getAvailability).mockResolvedValue([]);vi.mocked(getCourses).mockResolvedValue([]);vi.mocked(getTutorOnboarding).mockResolvedValue({discovery:{subjects:[{subjectId:"math",levelCodes:["HIGH_SCHOOL"]}]}} as Awaited<ReturnType<typeof getTutorOnboarding>>);vi.mocked(getPublicCatalog).mockResolvedValue([{code:"math",name:"Toán",isActive:true}]);});
function view(){render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}><TutorOffersEditorForm accountId="owner"/></QueryClientProvider>);}
it("saves weekly availability without losing an unrelated course draft",async()=>{
 vi.mocked(saveAvailability).mockResolvedValue({id:"s",dayOfWeek:1,startTime:"18:00",endTime:"19:00",timeZone:"Asia/Ho_Chi_Minh"});view();
 fireEvent.change(await screen.findByLabelText("Tên khóa học"),{target:{value:"Đang soạn"}});fireEvent.click(screen.getByRole("button",{name:"Lưu lịch rảnh"}));
 await waitFor(()=>expect(saveAvailability).toHaveBeenCalledWith({dayOfWeek:1,startTime:"18:00",endTime:"19:00"},undefined));
 expect(screen.getByLabelText("Tên khóa học")).toHaveValue("Đang soạn");
});
it("shows overlap feedback and keeps edited times",async()=>{
 vi.mocked(saveAvailability).mockRejectedValue(new ApiError(409,"Overlap",undefined,null,"/tutor/availability"));view();
 fireEvent.change(await screen.findByLabelText("Giờ bắt đầu"),{target:{value:"18:30"}});fireEvent.click(screen.getByRole("button",{name:"Lưu lịch rảnh"}));
 expect(await screen.findByRole("alert")).toHaveTextContent("Khung giờ trùng");expect(screen.getByLabelText("Giờ bắt đầu")).toHaveValue("18:30");
});
it("edits and stops an existing course through the soft-delete API",async()=>{
 vi.mocked(getCourses).mockResolvedValue([{id:"course-1",subjectId:"math",name:"Toán 10",content:"Nội dung",sessionCount:8,pricePerSessionVnd:150000,status:"ACTIVE"}]);vi.mocked(removeOffer).mockResolvedValue();view();
 fireEvent.click(await screen.findByRole("button",{name:"Sửa Toán 10"}));expect(screen.getByLabelText("Số buổi")).toHaveValue(8);
 fireEvent.click(screen.getByRole("button",{name:"Ngừng khóa học đang sửa"}));await waitFor(()=>expect(removeOffer).toHaveBeenCalledWith("courses","course-1"));
});
it("reports load failure with a retry action",async()=>{vi.mocked(getAvailability).mockRejectedValue(new Error("Network"));view();expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được");expect(screen.getByRole("button",{name:"Thử lại"})).toBeInTheDocument();});

it("saves course edits with the existing subject and course identifier",async()=>{
 vi.mocked(getCourses).mockResolvedValue([{id:"course-1",subjectId:"math",name:"Toán 10",content:"Nội dung",sessionCount:8,pricePerSessionVnd:150000,status:"ACTIVE"}]);
 vi.mocked(saveCourse).mockResolvedValue({id:"course-1",subjectId:"math",name:"Toán nâng cao",content:"Nội dung",sessionCount:8,pricePerSessionVnd:150000,status:"ACTIVE"});view();
 fireEvent.click(await screen.findByRole("button",{name:"Sửa Toán 10"}));fireEvent.change(screen.getByLabelText("Tên khóa học"),{target:{value:"Toán nâng cao"}});
 fireEvent.click(screen.getByRole("button",{name:"Lưu khóa học"}));await waitFor(()=>expect(saveCourse).toHaveBeenCalledWith({subjectId:"math",name:"Toán nâng cao",content:"Nội dung",sessionCount:8,pricePerSessionVnd:150000,status:"ACTIVE"},"course-1"));
});
