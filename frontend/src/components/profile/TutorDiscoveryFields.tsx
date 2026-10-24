"use client";
import { useQuery } from "@tanstack/react-query";
import { getPublicCatalog, type CatalogKind } from "@/lib/api/catalog";
import type { TutorDiscoveryData } from "@/lib/api/tutor-onboarding";
import { Checkbox } from "@/components/ui/checkbox";
import { Dropdown } from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
export function TutorDiscoveryFields({ value, onChange }: { value: TutorDiscoveryData; onChange: (next: TutorDiscoveryData) => void }) {
  const query = useQuery({ queryKey: ["discovery-catalogs"], meta: { public: true }, queryFn: async ({signal}) => {
    const kinds: CatalogKind[]=["subjects","teaching-levels","provinces","districts"];
    const rows=await Promise.all(kinds.map(kind=>getPublicCatalog(kind,signal)));
    return {subjects:rows[0],levels:rows[1],provinces:rows[2],districts:rows[3]};
  }});
  if(query.isPending)return <p role="status">Đang tải môn và khu vực…</p>;
  if(query.isError)return <div role="alert">Không tải được danh mục. <Button type="button" onClick={()=>query.refetch()}>Tải lại danh mục</Button></div>;
  const selected=value.subjects??[];
  const setSubjects=(subjects: NonNullable<TutorDiscoveryData["subjects"]>)=>onChange({...value,subjects});
  const missing=selected.filter(s=>!query.data.subjects.some(row=>row.code===s.subjectId));
  return <div className="space-y-4 sm:col-span-2">
    <fieldset className="space-y-3"><legend>Môn học và lớp nhận dạy</legend>
      {missing.length>0&&<div className="space-y-2"><p className="text-status-warning">Có môn đã ngừng sử dụng. Chọn lại môn trước khi gửi duyệt.</p>{missing.map((subject,index)=><Button key={subject.subjectId} type="button" variant="secondary" onClick={()=>setSubjects(selected.filter(s=>s.subjectId!==subject.subjectId))}>Bỏ môn không còn sử dụng {index+1}</Button>)}</div>}
      {query.data.subjects.length===0&&<p>Chưa có môn học trong danh mục.</p>}
      {query.data.subjects.map(subject=>{const chosen=selected.find(s=>s.subjectId===subject.code);return <div key={subject.code} className="space-y-2 rounded-lg border border-border-default p-3">
        <Checkbox label={subject.name} checked={!!chosen} onChange={checked=>setSubjects(checked?[...selected,{subjectId:subject.code,levelCodes:[]}]:selected.filter(s=>s.subjectId!==subject.code))}/>
        {chosen&&<div className="flex flex-wrap gap-3">{chosen.levelCodes.filter(code=>!query.data.levels.some(l=>l.code===code)).map(code=><Button key={code} type="button" variant="secondary" onClick={()=>setSubjects(selected.map(s=>s.subjectId===subject.code?{...s,levelCodes:s.levelCodes.filter(c=>c!==code)}:s))}>Bỏ lớp không còn sử dụng</Button>)}{query.data.levels.map(level=><Checkbox key={level.code} label={`${subject.name} — ${level.name}`} checked={chosen.levelCodes.includes(level.code)} onChange={checked=>setSubjects(selected.map(s=>s.subjectId===subject.code?{...s,levelCodes:checked?[...s.levelCodes,level.code]:s.levelCodes.filter(c=>c!==level.code)}:s))}/>)}</div>}
      </div>;})}
    </fieldset>
    <fieldset className="flex flex-wrap gap-3"><legend>Hình thức dạy</legend>{[["ONLINE","Trực tuyến"],["OFFLINE","Trực tiếp"],["HYBRID","Kết hợp"]].map(([code,label])=><Checkbox key={code} label={label} checked={value.teachingModes?.includes(code)??false} onChange={checked=>onChange({...value,teachingModes:checked?[...(value.teachingModes??[]),code]:(value.teachingModes??[]).filter(m=>m!==code)})}/>)}</fieldset>
    <Dropdown label="Tỉnh/thành phục vụ" options={[{value:"",label:"Không chọn"},...query.data.provinces.map(p=>({value:p.code,label:p.name}))]} value={value.provinceCode??""} onChange={code=>onChange({...value,provinceCode:code,districtCode:null})}/>
    <Dropdown label="Quận/huyện phục vụ" options={[{value:"",label:"Không chọn"},...query.data.districts.filter(d=>d.provinceCode===value.provinceCode).map(d=>({value:d.code,label:d.name}))]} value={value.districtCode??""} onChange={code=>onChange({...value,districtCode:code})}/>
  </div>;
}
