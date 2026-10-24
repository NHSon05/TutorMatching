import { http } from "@/lib/api/http";
export interface Availability { id:string; dayOfWeek:number; startTime:string; endTime:string; timeZone:string }
export type AvailabilityInput=Pick<Availability,"dayOfWeek"|"startTime"|"endTime">;
export interface Course { id:string; subjectId:string; name:string; content:string; sessionCount:number|null; pricePerSessionVnd:number|null; status:"ACTIVE"|"HIDDEN" }
export type CourseInput=Omit<Course,"id"|"sessionCount"|"pricePerSessionVnd">&{sessionCount:number;pricePerSessionVnd:number};
export async function getAvailability(signal?:AbortSignal){return (await http.get<Availability[]>("/tutor/availability",{signal})).data;}
export async function getCourses(signal?:AbortSignal){return (await http.get<Course[]>("/tutor/courses",{signal})).data;}
export async function saveAvailability(input:AvailabilityInput,id?:string){return (await(id?http.put<Availability>(`/tutor/availability/${id}`,input):http.post<Availability>("/tutor/availability",input))).data;}
export async function saveCourse(input:CourseInput,id?:string){return (await(id?http.put<Course>(`/tutor/courses/${id}`,input):http.post<Course>("/tutor/courses",input))).data;}
export async function removeOffer(kind:"availability"|"courses",id:string){await http.delete(`/tutor/${kind}/${id}`);}
