"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Application = {
  id: string;
  student_name: string;
  school: string;
  grade: string;
  question?: string;
  graduation_year?: string;
  track?: string;
  school_type?: string;
  overall_gpa?: string;
  major_gpa?: string;
  hope_major?: string;
  class_rank?: string;
  admission_type?: string;
  extracurricular_needed?: string;
  csat_plan?: string;
  priority_after_final?: string;
  strategy_type?: string;
  preferred_call_date?: string;
  desired_universities?: UniversityItem[];
};

type UniversityItem = {
  university: string;
  admission: string;
  track: string;
  department: string;
  quota?: string;
  method?: string;
  minimum_score?: string;
  exam_date?: string;
  competition_rate?: string;
  cut_score?: string;
  point?: string;
};

const emptyUniversities: UniversityItem[] = Array.from({ length: 9 }, () => ({
  university: "",
  admission: "",
  track: "",
  department: "",
  quota: "",
  method: "",
  minimum_score: "",
  exam_date: "",
  competition_rate: "",
  cut_score: "",
  point: "",
}));

export default function ConsultingPage() {
  const params = useParams();
  const id = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);

  const [studentName, setStudentName] = useState("");
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [track, setTrack] = useState("");
  const [schoolType, setSchoolType] = useState("");
  const [overallGpa, setOverallGpa] = useState("");
  const [majorGpa, setMajorGpa] = useState("");
  const [hopeMajor, setHopeMajor] = useState("");
  const [question, setQuestion] = useState("");

  const [classRank, setClassRank] = useState("");
  const [admissionType, setAdmissionType] = useState("");
  const [extracurricularNeeded, setExtracurricularNeeded] = useState("");
  const [csatPlan, setCsatPlan] = useState("");
  const [priorityAfterFinal, setPriorityAfterFinal] = useState("");
  const [strategyType, setStrategyType] = useState("");
  const [preferredCallDate, setPreferredCallDate] = useState("");
  const [memo, setMemo] = useState("");

  const [universityOptions, setUniversityOptions] = useState<string[]>([]);
  const [admissionOptions, setAdmissionOptions] = useState<string[]>([]);
  const [trackOptions, setTrackOptions] = useState<string[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);

  const [universities, setUniversities] =
    useState<UniversityItem[]>(emptyUniversities);

  useEffect(() => {
    fetchApplication();
    loadUniversityOptions();
  }, []);

  async function fetchApplication() {
    const { data, error } = await supabase
      .from("consultation_applications")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      alert("학생 정보를 불러오지 못했습니다.");
      return;
    }

    setApplication(data);

    setStudentName(data.student_name || "");
    setSchool(data.school || "");
    setGrade(data.grade || "");
    setGraduationYear(data.graduation_year || "");
    setTrack(data.track || "");
    setSchoolType(data.school_type || "");
    setOverallGpa(data.overall_gpa || "");
    setMajorGpa(data.major_gpa || "");
    setHopeMajor(data.hope_major || "");
    setQuestion(data.question || "");

    setClassRank(data.class_rank || "");
    setAdmissionType(data.admission_type || "");
    setExtracurricularNeeded(data.extracurricular_needed || "");
    setCsatPlan(data.csat_plan || "");
    setPriorityAfterFinal(data.priority_after_final || "");
    setStrategyType(data.strategy_type || "");
    setPreferredCallDate(data.preferred_call_date || "");

    if (Array.isArray(data.desired_universities)) {
      const merged = emptyUniversities.map((base, index) => ({
        ...base,
        ...(data.desired_universities?.[index] || {}),
      }));
      setUniversities(merged);
    }
  }

  async function loadUniversityOptions() {
    const { data, error } = await supabase.rpc("get_unique_universities");

    if (error) {
      console.error("DB ERROR:", error);
      alert(JSON.stringify(error));
      return;
    }

    setUniversityOptions((data || []).map((row: any) => row.university));
  }

  async function loadAdmissionOptions(university: string) {
    const { data, error } = await supabase
      .from("admission_db")
      .select("admission_type")
      .eq("university", university);

    if (error) {
      console.error("DB ERROR:", error);
      alert(JSON.stringify(error));
      return;
    }

    const list = [
      ...new Set((data || []).map((row) => row.admission_type).filter(Boolean)),
    ].sort();

    setAdmissionOptions(list);
  }

  async function loadTrackOptions(university: string, admission: string) {
    const { data, error } = await supabase
      .from("admission_db")
      .select("track")
      .eq("university", university)
      .eq("admission_type", admission);

    if (error) {
      console.error("DB ERROR:", error);
      alert(JSON.stringify(error));
      return;
    }

    const list = [
      ...new Set((data || []).map((row) => row.track).filter(Boolean)),
    ].sort();

    setTrackOptions(list);
  }

  async function loadDepartmentOptions(
    university: string,
    admission: string,
    trackValue: string
  ) {
    const { data, error } = await supabase
      .from("admission_db")
      .select("department")
      .eq("university", university)
      .eq("admission_type", admission)
      .eq("track", trackValue);

    if (error) {
      console.error("DB ERROR:", error);
      alert(JSON.stringify(error));
      return;
    }

    const list = [
      ...new Set((data || []).map((row) => row.department).filter(Boolean)),
    ].sort();

    setDepartmentOptions(list);
  }

  function updateUniversity(
    index: number,
    field: keyof UniversityItem,
    value: string
  ) {
    const next = [...universities];

    next[index] = {
      ...next[index],
      [field]: value,
    };

    if (field === "university") {
      next[index].admission = "";
      next[index].track = "";
      next[index].department = "";
      clearDetail(next, index);
      setAdmissionOptions([]);
      setTrackOptions([]);
      setDepartmentOptions([]);
      if (value) loadAdmissionOptions(value);
    }

    if (field === "admission") {
      next[index].track = "";
      next[index].department = "";
      clearDetail(next, index);
      setTrackOptions([]);
      setDepartmentOptions([]);
      if (value) loadTrackOptions(next[index].university, value);
    }

    if (field === "track") {
      next[index].department = "";
      clearDetail(next, index);
      setDepartmentOptions([]);
      if (value) {
        loadDepartmentOptions(next[index].university, next[index].admission, value);
      }
    }

    setUniversities(next);
  }

  function clearDetail(next: UniversityItem[], index: number) {
    next[index].quota = "";
    next[index].method = "";
    next[index].minimum_score = "";
    next[index].exam_date = "";
    next[index].competition_rate = "";
    next[index].cut_score = "";
    next[index].point = "";
  }

  async function selectDepartment(index: number, department: string) {
    const selected = universities[index];

    const { data, error } = await supabase
      .from("admission_db")
      .select("*")
      .eq("university", selected.university)
      .eq("admission_type", selected.admission)
      .eq("track", selected.track)
      .eq("department", department)
      .limit(1)
      .single();

    if (error) {
      console.error("DB ERROR:", error);
      alert(JSON.stringify(error));
      return;
    }

    const next = [...universities];

    next[index] = {
      ...next[index],
      department,
      quota: data.quota || "",
      method: data.method || "",
      minimum_score: data.minimum_score || "",
      exam_date: data.eaxm_date || data.exam_date || "",
      competition_rate: data.competition_rate || "",
      cut_score: data.cut_score || "",
      point: data.point || "",
    };

    setUniversities(next);
  }

  async function updateApplication() {
    const { error } = await supabase
      .from("consultation_applications")
      .update({
        student_name: studentName,
        school,
        grade,
        graduation_year: graduationYear,
        track,
        school_type: schoolType,
        overall_gpa: overallGpa,
        major_gpa: majorGpa,
        hope_major: hopeMajor,
        class_rank: classRank,
        admission_type: admissionType,
        extracurricular_needed: extracurricularNeeded,
        csat_plan: csatPlan,
        priority_after_final: priorityAfterFinal,
        strategy_type: strategyType,
        preferred_call_date: preferredCallDate,
        question,
        desired_universities: universities.map((u) => ({
          university: u.university,
          admission: u.admission,
          track: u.track,
          department: u.department,
        })),
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("신청서 수정 실패");
      return;
    }

    alert("신청서 수정 완료");
    fetchApplication();
  }

  async function saveConsulting() {
    if (!application) return;

    const { error } = await supabase.from("consultation_records").insert([
      {
        application_id: application.id,
        student_name: studentName,
        school,
        grade,
        track,
        overall_gpa: overallGpa,
        major_gpa: majorGpa,
        class_rank: classRank,
        admission_type: admissionType,
        extracurricular_needed: extracurricularNeeded,
        csat_plan: csatPlan,
        priority_after_final: priorityAfterFinal,
        strategy_type: strategyType,
        question,
        memo,
        universities,
      },
    ]);

    if (error) {
      console.error(error);
      alert("저장 실패");
      return;
    }

    alert("상담결과 저장 완료");
  }

  if (!application) {
    return <main className="p-8">불러오는 중...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">강성재교육연구소</p>
            <h1 className="text-3xl font-bold">상담결과 작성</h1>
          </div>

          <Link href="/admin" className="bg-gray-200 px-4 py-2 rounded">
            관리자 목록
          </Link>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl bg-white border p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">신청서 정보 수정</h2>

            <div className="grid grid-cols-2 gap-3">
              <Input label="학생 이름" value={studentName} onChange={setStudentName} />
              <Input label="학교" value={school} onChange={setSchool} />
              <Input label="학년" value={grade} onChange={setGrade} />
              <Input label="졸업년도" value={graduationYear} onChange={setGraduationYear} />
              <Select label="계열" value={track} onChange={setTrack} options={["인문", "자연", "예체능"]} />
              <Select label="학교유형" value={schoolType} onChange={setSchoolType} options={["일반고", "자사고", "특목고", "외고", "국제고", "기타"]} />
              <Input label="전교과 내신" value={overallGpa} onChange={setOverallGpa} />
              <Input label="주요교과 내신" value={majorGpa} onChange={setMajorGpa} />
              <Input label="희망학과" value={hopeMajor} onChange={setHopeMajor} />
              <Input label="전교 등수" value={classRank} onChange={setClassRank} />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <Select
                label="주력전형"
                value={admissionType}
                onChange={setAdmissionType}
                options={[
                  "교과전형",
                  "학생부종합전형",
                  "논술전형",
                  "지역인재전형",
                  "지역의사제",
                  "농어촌전형",
                  "기회균형전형",
                ]}
              />
              <Select
                label="생기부 비교과 관리"
                value={extracurricularNeeded}
                onChange={setExtracurricularNeeded}
                options={["관리한다", "관리안한다"]}
              />
              <Select
                label="수능대비"
                value={csatPlan}
                onChange={setCsatPlan}
                options={[
                  "전과목대비(논술/정시)",
                  "수능최저만 관리",
                  "수능대비 안한다",
                ]}
              />
              <Select
                label="3-1 기말 후 최우선 순위"
                value={priorityAfterFinal}
                onChange={setPriorityAfterFinal}
                options={["생기부관리", "수능대비", "논술대비", "면접대비"]}
              />
              <Select
                label="수시/정시 전략"
                value={strategyType}
                onChange={setStrategyType}
                options={["수시에 끝낸다", "정시까지 고려한다"]}
              />
              <Input
                label="2차 전화상담 희망일"
                value={preferredCallDate}
                onChange={setPreferredCallDate}
              />
            </div>

            <textarea
              className="w-full border p-3 rounded mt-3 h-28"
              placeholder="상담 전 질문사항"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />

            <button
              onClick={updateApplication}
              className="mt-4 bg-blue-600 text-white px-5 py-3 rounded font-bold"
            >
              신청서 수정 저장
            </button>
          </section>

          <section className="rounded-2xl bg-white border p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">지원대학 1~9 수정</h2>

            <div className="space-y-6">
              {universities.map((item, index) => (
                <div key={index} className="border rounded-xl p-4">
                  <h3 className="font-bold mb-3">{index + 1}번 지원대학</h3>

                  <div className="grid grid-cols-4 gap-2">
                    <select
                      className="border p-2 rounded bg-white"
                      value={item.university}
                      onChange={(e) =>
                        updateUniversity(index, "university", e.target.value)
                      }
                    >
                      <option value="">대학 선택</option>
                      {universityOptions.map((university) => (
                        <option key={university} value={university}>
                          {university}
                        </option>
                      ))}
                    </select>

                    <select
                      className="border p-2 rounded bg-white"
                      value={item.admission}
                      onFocus={() => {
                        if (item.university) loadAdmissionOptions(item.university);
                      }}
                      onChange={(e) =>
                        updateUniversity(index, "admission", e.target.value)
                      }
                      disabled={!item.university}
                    >
                      <option value="">전형 선택</option>
                      {item.admission && (
                        <option value={item.admission}>{item.admission}</option>
                      )}
                      {admissionOptions.map((admission) => (
                        <option key={admission} value={admission}>
                          {admission}
                        </option>
                      ))}
                    </select>

                    <select
                      className="border p-2 rounded bg-white"
                      value={item.track}
                      onFocus={() => {
                        if (item.university && item.admission) {
                          loadTrackOptions(item.university, item.admission);
                        }
                      }}
                      onChange={(e) =>
                        updateUniversity(index, "track", e.target.value)
                      }
                      disabled={!item.admission}
                    >
                      <option value="">계열 선택</option>
                      {item.track && <option value={item.track}>{item.track}</option>}
                      {trackOptions.map((trackOption) => (
                        <option key={trackOption} value={trackOption}>
                          {trackOption}
                        </option>
                      ))}
                    </select>

                    <select
                      className="border p-2 rounded bg-white"
                      value={item.department}
                      onFocus={() => {
                        if (item.university && item.admission && item.track) {
                          loadDepartmentOptions(
                            item.university,
                            item.admission,
                            item.track
                          );
                        }
                      }}
                      onChange={(e) => selectDepartment(index, e.target.value)}
                      disabled={!item.track}
                    >
                      <option value="">모집단위 선택</option>
                      {item.department && (
                        <option value={item.department}>{item.department}</option>
                      )}
                      {departmentOptions.map((department) => (
                        <option key={department} value={department}>
                          {department}
                        </option>
                      ))}
                    </select>
                  </div>

                  {item.department && (
                    <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                      <Info label="모집인원" value={item.quota} />
                      <Info label="전형방법" value={item.method} />
                      <Info label="수능최저" value={item.minimum_score} />
                      <Info label="고사일" value={item.exam_date} />
                      <Info label="경쟁률" value={item.competition_rate} />
                      <Info label="70%컷" value={item.cut_score} />
                      <Info label="1 Point" value={item.point} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white border p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">상담 메모</h2>

            <textarea
              className="w-full border p-3 rounded h-40"
              placeholder="상담 메모"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />

            <button
              onClick={saveConsulting}
              className="mt-4 bg-black text-white px-6 py-3 rounded font-bold"
            >
              상담결과 저장하기
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <div className="text-sm font-semibold mb-1">{label}</div>
      <input
        className="w-full border p-3 rounded"
        value={value}
        placeholder={label}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <div className="text-sm font-semibold mb-1">{label}</div>
      <select
        className="w-full border p-3 rounded bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{label} 선택</option>
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border rounded p-2">
      <div className="text-gray-500 text-xs mb-1">{label}</div>
      <div className="font-semibold whitespace-pre-wrap">{value || "-"}</div>
    </div>
  );
}