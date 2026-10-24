"use client";
import { useState } from "react";
import { useQuery,useMutation,useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { TextArea } from "@/components/ui/text-area";
import { Dropdown } from "@/components/ui/dropdown";
import { getTutorOnboarding } from "@/lib/api/tutor-onboarding";
import { getPublicCatalog } from "@/lib/api/catalog";
import { getAvailability,getCourses,saveAvailability,saveCourse,removeOffer,type AvailabilityInput,type CourseInput } from "@/lib/api/tutor-offers";
import { useAuthenticatedAccount } from "@/hooks/use-authenticated-account";
import { ApiError } from "@/lib/api/http";
const emptySlot:AvailabilityInput={dayOfWeek:1,startTime:"18:00",endTime:"19:00"};
const emptyCourse:CourseInput={subjectId:"",name:"",content:"",sessionCount:1,pricePerSessionVnd:100000,status:"ACTIVE"};
export default function TutorOffersEditor(){const account=useAuthenticatedAccount();return <TutorOffersEditorForm key={account.id} accountId={account.id}/>;}
export function TutorOffersEditorForm({accountId}:{accountId:string}){
 const cache=useQueryClient();const [slot,setSlot]=useState(emptySlot);const [slotId,setSlotId]=useState<string>();const [course,setCourse]=useState(emptyCourse);const [courseId,setCourseId]=useState<string>();
 const slots=useQuery({queryKey:["tutor-offer-slots",accountId],queryFn:({signal})=>getAvailability(signal)});
 const courses=useQuery({queryKey:["tutor-offer-courses",accountId],queryFn:({signal})=>getCourses(signal)});
 const subjects=useQuery({queryKey:["tutor-offer-subjects",accountId],queryFn:async({signal})=>{const [profile,all]=await Promise.all([getTutorOnboarding(signal),getPublicCatalog("subjects",signal)]);return all.filter(s=>profile.discovery?.subjects?.some(selected=>selected.subjectId===s.code));}});
 const mutation=useMutation({mutationFn:async(action:{kind:"slot"|"course"|"availability"|"courses"})=>{
   if(action.kind==="slot")return saveAvailability(slot,slotId);if(action.kind==="course")return saveCourse(course,courseId);
   const id=action.kind==="availability"?slotId:courseId;if(id)await removeOffer(action.kind,id);
 },onSuccess:async(_,action)=>{if(action.kind==="slot"||action.kind==="availability"){setSlot(emptySlot);setSlotId(undefined);}else{setCourse(emptyCourse);setCourseId(undefined);}await Promise.all([cache.invalidateQueries({queryKey:["tutor-offer-slots",accountId]}),cache.invalidateQueries({queryKey:["tutor-offer-courses",accountId]})]);}});
 function resetSlot(){setSlot(emptySlot);setSlotId(undefined);mutation.reset();}
 function resetCourse(){setCourse(emptyCourse);setCourseId(undefined);mutation.reset();}
 if(slots.isPending||courses.isPending||subjects.isPending)return <p role="status">Đang tải lịch và khóa học…</p>;
 if(slots.isError||courses.isError||subjects.isError)return <div role="alert">Không tải được dữ liệu. <Button onClick={()=>{slots.refetch();courses.refetch();subjects.refetch();}}>Thử lại</Button></div>;
 return <div className="space-y-8 text-content-primary"><h1 className="text-2xl font-bold">Lịch rảnh và khóa học</h1><p>Lịch tuần theo giờ Việt Nam. Hai khung giờ sát nhau được phép; lịch này chưa giữ chỗ cho yêu cầu thuê.</p>
 {mutation.isPending&&<p role="status">Đang lưu thay đổi…</p>}
 {mutation.isError&&<p role="alert" className="text-status-error">{mutation.error instanceof ApiError?mutation.error.status===409?"Khung giờ trùng lịch đã có. Hãy chọn giờ khác.":Object.values(mutation.error.errors??{}).flat().join(" ")||mutation.error.title:"Không lưu được. Nội dung nhập được giữ lại; hãy thử lại."}</p>}
 <fieldset disabled={mutation.isPending} className="space-y-4 rounded-lg border border-border-default bg-surface-card p-4"><legend className="font-semibold">Lịch rảnh</legend>
 {slots.data.length===0&&<p>Chưa có lịch rảnh.</p>}
 <ul className="space-y-2">{slots.data.map(s=><li key={s.id} className="flex flex-wrap items-center justify-between gap-2"><span>{s.dayOfWeek===7?"Chủ nhật":`Thứ ${s.dayOfWeek+1}`} · {s.startTime}–{s.endTime}</span><Button type="button" variant="secondary" onClick={()=>{mutation.reset();setSlotId(s.id);setSlot({dayOfWeek:s.dayOfWeek,startTime:s.startTime.slice(0,5),endTime:s.endTime.slice(0,5)});}}>Sửa khung giờ {s.startTime}</Button></li>)}</ul>
 <form className="grid gap-3 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();mutation.mutate({kind:"slot"});}}>
 <Dropdown label="Ngày trong tuần" value={String(slot.dayOfWeek)} options={Array.from({length:7},(_,i)=>({value:String(i+1),label:i===6?"Chủ nhật":`Thứ ${i+2}`}))} onChange={value=>setSlot({...slot,dayOfWeek:Number(value)})}/>
 <TextField label="Giờ bắt đầu" type="time" required value={slot.startTime} onChange={e=>setSlot({...slot,startTime:e.target.value})}/><TextField label="Giờ kết thúc" type="time" required value={slot.endTime} onChange={e=>setSlot({...slot,endTime:e.target.value})}/>
 <Button type="submit">Lưu lịch rảnh</Button>{slotId&&<Button type="button" variant="danger" onClick={()=>mutation.mutate({kind:"availability"})}>Xóa khung giờ đang sửa</Button>}<Button type="button" variant="tertiary" onClick={resetSlot}>Hủy chỉnh sửa lịch</Button>
 </form></fieldset>
 <fieldset disabled={mutation.isPending} className="space-y-4 rounded-lg border border-border-default bg-surface-card p-4"><legend className="font-semibold">Khóa học</legend>
 {courses.data.length===0&&<p>Chưa có khóa học.</p>}{subjects.data.length===0&&<p>Chọn môn nhận dạy trong hồ sơ trước khi tạo khóa học.</p>}
 <ul className="space-y-2">{courses.data.map(c=><li key={c.id} className="flex flex-wrap items-center justify-between gap-2"><span>{c.name} · {c.status==="ACTIVE"?"Đang mở":"Đã ẩn"}</span><Button type="button" variant="secondary" onClick={()=>{mutation.reset();setCourseId(c.id);setCourse({subjectId:c.subjectId,name:c.name,content:c.content,status:c.status,sessionCount:c.sessionCount??0,pricePerSessionVnd:c.pricePerSessionVnd??0});}}>Sửa {c.name}</Button></li>)}</ul>
 <form className="space-y-3" onSubmit={e=>{e.preventDefault();mutation.mutate({kind:"course"});}}><TextField label="Tên khóa học" required maxLength={200} value={course.name} onChange={e=>setCourse({...course,name:e.target.value})}/>
 <Dropdown label="Môn học" value={course.subjectId} options={subjects.data.map(s=>({value:s.code,label:s.name}))} onChange={subjectId=>setCourse({...course,subjectId})}/><TextArea label="Nội dung khóa học" required maxLength={4000} value={course.content} onChange={e=>setCourse({...course,content:e.target.value})}/>
 <TextField label="Số buổi" type="number" min={1} max={2147483647} step={1} required value={course.sessionCount||""} onChange={e=>setCourse({...course,sessionCount:Number(e.target.value)})}/><TextField label="Giá mỗi buổi (VND)" type="number" min={1} max={2147483647} step={1} required value={course.pricePerSessionVnd||""} onChange={e=>setCourse({...course,pricePerSessionVnd:Number(e.target.value)})}/>
 <Dropdown label="Trạng thái khóa học" value={course.status} options={[{value:"ACTIVE",label:"Đang mở"},{value:"HIDDEN",label:"Ẩn"}]} onChange={status=>setCourse({...course,status:status as CourseInput["status"]})}/>
 <div className="flex flex-wrap gap-2"><Button type="submit" disabled={!course.subjectId}>Lưu khóa học</Button>{courseId&&<Button type="button" variant="danger" onClick={()=>mutation.mutate({kind:"courses"})}>Ngừng khóa học đang sửa</Button>}<Button type="button" variant="tertiary" onClick={resetCourse}>Hủy chỉnh sửa khóa học</Button></div>
 </form></fieldset></div>;
}
