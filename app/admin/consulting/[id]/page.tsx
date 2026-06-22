"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const koreanOptions = ["화작", "언매"];
const mathOptions = ["미적분", "기하", "확률과 통계"];
const tamguOptions = [
  "물리1", "화학1", "생명1", "지구1",
  "물리2", "화학2", "생명2", "지구2",
  "생윤", "사문", "윤사", "한지", "세지",
  "동아시아사", "세계사", "정법", "경제",
];

type ExamKey = "june" | "september" | "november";

type ExamState = {
  korean_type: string;
  korean_score: string;
  korean_percentile: string;
  korean_grade: string;
  math_type: string;
  math_score: string;
  math_percentile: string;
  math_grade: string;
  english_grade: string;
  tamgu1_type: string;
  tamgu1_score: string;
  tamgu1_percentile: string;
  tamgu1_grade: string;
  tamgu2_type: string;
  tamgu2_score: string;
  tamgu2_percentile: string;
  tamgu2_grade: string;
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

  june_korean_type?: string;
  june_korean_score?: string;
  june_korean_percentile?: string;
  june_korean_grade?: string;
  june_math_type?: string;
  june_math_score?: string;
  june_math_percentile?: string;
  june_math_grade?: string;
  june_english_grade?: string;
  june_tamgu1_type?: string;
  june_tamgu1_score?: string;
  june_tamgu1_percentile?: string;
  june_tamgu1_grade?: string;
  june_tamgu2_type?: string;
  june_tamgu2_score?: string;
  june_tamgu2_percentile?: string;
  june_tamgu2_grade?: string;

  september_korean_type?: string;
  september_korean_score?: string;
  september_korean_percentile?: string;
  september_korean_grade?: string;
  september_math_type?: string;
  september_math_score?: string;
  september_math_percentile?: string;
  september_math_grade?: string;
  september_english_grade?: string;
  september_tamgu1_type?: string;
  september_tamgu1_score?: string;
  september_tamgu1_percentile?: string;
  september_tamgu1_grade?: string;
  september_tamgu2_type?: string;
  september_tamgu2_score?: string;
  september_tamgu2_percentile?: string;
  september_tamgu2_grade?: string;

  csat_korean_type?: string;
  csat_korean_score?: string;
  csat_korean_percentile?: string;
  csat_korean_grade?: string;
  csat_math_type?: string;
  csat_math_score?: string;
  csat_math_percentile?: string;
  csat_math_grade?: string;
  csat_english_grade?: string;
  csat_tamgu1_type?: string;
  csat_tamgu1_score?: string;
  csat_tamgu1_percentile?: string;
  csat_tamgu1_grade?: string;
  csat_tamgu2_type?: string;
  csat_tamgu2_score?: string;
  csat_tamgu2_percentile?: string;
  csat_tamgu2_grade?: string;
};

const emptyExam: ExamState = {
  korean_type: "",
  korean_score: "",
  korean_percentile: "",
  korean_grade: "",
  math_type: "",
  math_score: "",
  math_percentile: "",
  math_grade: "",
  english_grade: "",
  tamgu1_type: "",
  tamgu1_score: "",
  tamgu1_percentile: "",
  tamgu1_grade: "",
  tamgu2_type: "",
  tamgu2_score: "",
  tamgu2_percentile: "",
  tamgu2_grade: "",
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

  const [june, setJune] = useState<ExamState>({ ...emptyExam });
  const [september, setSeptember] = useState<ExamState>({ ...emptyExam });
  const [november, setNovember] = useState<ExamState>({ ...emptyExam });

  const [universityOptions, setUniversityOptions] = useState<string[]>([]);
  const [admissionOptions, setAdmissionOptions] = useState<string[]>([]);
  const [trackOptions, setTrackOptions] = useState<string[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [universities, setUniversities] = useState<UniversityItem[]>(emptyUniversities);

  useEffect(() => {
    fetchApplication();
    loadUniversityOptions();
  }, []);

  function formatNumber(value: any) {
    if (value === null || value === undefined || value === "") return "";
    const num = Number(value);
    if (!Number.isFinite(num)) return String(value);
    return num.toFixed(2);
  }

  function makeExamFromApplication(data: Application, prefix: "june" | "september" | "csat"): ExamState {
    return {
      korean_type: data[`${prefix}_korean_type` as keyof Application] as string || "",
      korean_score: data[`${prefix}_korean_score` as keyof Application] as string || "",
      korean_percentile: data[`${prefix}_korean_percentile` as keyof Application] as string || "",
      korean_grade: data[`${prefix}_korean_grade` as keyof Application] as string || "",
      math_type: data[`${prefix}_math_type` as keyof Application] as string || "",
      math_score: data[`${prefix}_math_score` as keyof Application] as string || "",
      math_percentile: data[`${prefix}_math_percentile` as keyof Application] as string || "",
      math_grade: data[`${prefix}_math_grade` as keyof Application] as string || "",
      english_grade: data[`${prefix}_english_grade` as keyof Application] as string || "",
      tamgu1_type: data[`${prefix}_tamgu1_type` as keyof Application] as string || "",
      tamgu1_score: data[`${prefix}_tamgu1_score` as keyof Application] as string || "",
      tamgu1_percentile: data[`${prefix}_tamgu1_percentile` as keyof Application] as string || "",
      tamgu1_grade: data[`${prefix}_tamgu1_grade` as keyof Application] as string || "",
      tamgu2_type: data[`${prefix}_tamgu2_type` as keyof Application] as string || "",
      tamgu2_score: data[`${prefix}_tamgu2_score` as keyof Application] as string || "",
      tamgu2_percentile: data[`${prefix}_tamgu2_percentile` as keyof Application] as string || "",
      tamgu2_grade: data[`${prefix}_tamgu2_grade` as keyof Application] as string || "",
    };
  }

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

    setJune(makeExamFromApplication(data, "june"));
    setSeptember(makeExamFromApplication(data, "september"));
    setNovember(makeExamFromApplication(data, "csat"));

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

  function updateUniversity(index: number, field: keyof UniversityItem, value: string) {
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
      competition_rate: formatNumber(data.competition_rate),
      cut_score: formatNumber(data.cut_score),
      point: data.point || "",
    };

    setUniversities(next);
  }

  function updateExam(examKey: ExamKey, field: keyof ExamState, value: string) {
    if (examKey === "june") setJune((prev) => ({ ...prev, [field]: value }));
    if (examKey === "september") setSeptember((prev) => ({ ...prev, [field]: value }));
    if (examKey === "november") setNovember((prev) => ({ ...prev, [field]: value }));
  }

  function examPayload(exam: ExamState) {
    return {
      korean_type: exam.korean_type,
      korean_score: exam.korean_score,
      korean_percentile: exam.korean_percentile,
      korean_grade: exam.korean_grade,
      math_type: exam.math_type,
      math_score: exam.math_score,
      math_percentile: exam.math_percentile,
      math_grade: exam.math_grade,
      english_grade: exam.english_grade,
      tamgu1_type: exam.tamgu1_type,
      tamgu1_score: exam.tamgu1_score,
      tamgu1_percentile: exam.tamgu1_percentile,
      tamgu1_grade: exam.tamgu1_grade,
      tamgu2_type: exam.tamgu2_type,
      tamgu2_score: exam.tamgu2_score,
      tamgu2_percentile: exam.tamgu2_percentile,
      tamgu2_grade: exam.tamgu2_grade,
    };
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

        june_korean_type: june.korean_type,
        june_korean_score: june.korean_score,
        june_korean_percentile: june.korean_percentile,
        june_korean_grade: june.korean_grade,
        june_math_type: june.math_type,
        june_math_score: june.math_score,
        june_math_percentile: june.math_percentile,
        june_math_grade: june.math_grade,
        june_english_grade: june.english_grade,
        june_tamgu1_type: june.tamgu1_type,
        june_tamgu1_score: june.tamgu1_score,
        june_tamgu1_percentile: june.tamgu1_percentile,
        june_tamgu1_grade: june.tamgu1_grade,
        june_tamgu2_type: june.tamgu2_type,
        june_tamgu2_score: june.tamgu2_score,
        june_tamgu2_percentile: june.tamgu2_percentile,
        june_tamgu2_grade: june.tamgu2_grade,

        september_korean_type: september.korean_type,
        september_korean_score: september.korean_score,
        september_korean_percentile: september.korean_percentile,
        september_korean_grade: september.korean_grade,
        september_math_type: september.math_type,
        september_math_score: september.math_score,
        september_math_percentile: september.math_percentile,
        september_math_grade: september.math_grade,
        september_english_grade: september.english_grade,
        september_tamgu1_type: september.tamgu1_type,
        september_tamgu1_score: september.tamgu1_score,
        september_tamgu1_percentile: september.tamgu1_percentile,
        september_tamgu1_grade: september.tamgu1_grade,
        september_tamgu2_type: september.tamgu2_type,
        september_tamgu2_score: september.tamgu2_score,
        september_tamgu2_percentile: september.tamgu2_percentile,
        september_tamgu2_grade: september.tamgu2_grade,

        csat_korean_type: november.korean_type,
        csat_korean_score: november.korean_score,
        csat_korean_percentile: november.korean_percentile,
        csat_korean_grade: november.korean_grade,
        csat_math_type: november.math_type,
        csat_math_score: november.math_score,
        csat_math_percentile: november.math_percentile,
        csat_math_grade: november.math_grade,
        csat_english_grade: november.english_grade,
        csat_tamgu1_type: november.tamgu1_type,
        csat_tamgu1_score: november.tamgu1_score,
        csat_tamgu1_percentile: november.tamgu1_percentile,
        csat_tamgu1_grade: november.tamgu1_grade,
        csat_tamgu2_type: november.tamgu2_type,
        csat_tamgu2_score: november.tamgu2_score,
        csat_tamgu2_percentile: november.tamgu2_percentile,
        csat_tamgu2_grade: november.tamgu2_grade,
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

    const payload = {
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
      june_scores: examPayload(june),
      september_scores: examPayload(september),
      november_scores: examPayload(november),
      universities,
    };

    const { data: existing } = await supabase
      .from("consultation_records")
      .select("id")
      .eq("application_id", application.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase
        .from("consultation_records")
        .update(payload)
        .eq("id", existing.id);

      if (error) {
        console.error(error);
        alert("상담결과 수정 실패");
        return;
      }

      alert("상담결과 수정 완료");
      return;
    }

    const { error } = await supabase.from("consultation_records").insert([payload]);

    if (error) {
      console.error(error);
      alert("상담결과 저장 실패");
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

          <div className="flex gap-2">
            <Link href="/admin" className="bg-gray-200 px-4 py-2 rounded">
              관리자 목록
            </Link>
            <Link href={`/admin/results/${id}`} className="bg-indigo-700 text-white px-4 py-2 rounded">
              PDF 출력하기
            </Link>
          </div>
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
              <Select label="주력전형" value={admissionType} onChange={setAdmissionType} options={["교과전형", "학생부종합전형", "논술전형", "지역인재전형", "지역의사제", "농어촌전형", "기회균형전형"]} />
              <Select label="생기부 비교과 관리" value={extracurricularNeeded} onChange={setExtracurricularNeeded} options={["관리한다", "관리안한다"]} />
              <Select label="수능대비" value={csatPlan} onChange={setCsatPlan} options={["전과목대비(논술/정시)", "수능최저만 관리", "수능대비 안한다"]} />
              <Select label="3-1 기말 후 최우선 순위" value={priorityAfterFinal} onChange={setPriorityAfterFinal} options={["생기부관리", "수능대비", "논술대비", "면접대비"]} />
              <Select label="수시/정시 전략" value={strategyType} onChange={setStrategyType} options={["수시에 끝낸다", "정시까지 고려한다"]} />
              <Input label="2차 전화상담 희망일" value={preferredCallDate} onChange={setPreferredCallDate} />
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

          <ExamSection title="6월 모의고사" examKey="june" exam={june} updateExam={updateExam} />
          <ExamSection title="9월 모의고사 목표점수" examKey="september" exam={september} updateExam={updateExam} />
          <ExamSection title="11월 수능 목표점수" examKey="november" exam={november} updateExam={updateExam} />

          <section className="rounded-2xl bg-white border p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">지원대학 1~9 수정</h2>

            <div className="space-y-6">
              {universities.map((item, index) => (
                <div key={index} className="border rounded-xl p-4">
                  <h3 className="font-bold mb-3">{index + 1}번 지원대학</h3>

                  <div className="grid grid-cols-4 gap-2">
                    <select className="border p-2 rounded bg-white" value={item.university} onChange={(e) => updateUniversity(index, "university", e.target.value)}>
                      <option value="">대학 선택</option>
                      {universityOptions.map((university) => (
                        <option key={university} value={university}>{university}</option>
                      ))}
                    </select>

                    <select className="border p-2 rounded bg-white" value={item.admission} onFocus={() => item.university && loadAdmissionOptions(item.university)} onChange={(e) => updateUniversity(index, "admission", e.target.value)} disabled={!item.university}>
                      <option value="">전형 선택</option>
                      {item.admission && <option value={item.admission}>{item.admission}</option>}
                      {admissionOptions.map((admission) => (
                        <option key={admission} value={admission}>{admission}</option>
                      ))}
                    </select>

                    <select className="border p-2 rounded bg-white" value={item.track} onFocus={() => item.university && item.admission && loadTrackOptions(item.university, item.admission)} onChange={(e) => updateUniversity(index, "track", e.target.value)} disabled={!item.admission}>
                      <option value="">계열 선택</option>
                      {item.track && <option value={item.track}>{item.track}</option>}
                      {trackOptions.map((trackOption) => (
                        <option key={trackOption} value={trackOption}>{trackOption}</option>
                      ))}
                    </select>

                    <select className="border p-2 rounded bg-white" value={item.department} onFocus={() => item.university && item.admission && item.track && loadDepartmentOptions(item.university, item.admission, item.track)} onChange={(e) => selectDepartment(index, e.target.value)} disabled={!item.track}>
                      <option value="">모집단위 선택</option>
                      {item.department && <option value={item.department}>{item.department}</option>}
                      {departmentOptions.map((department) => (
                        <option key={department} value={department}>{department}</option>
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

            <div className="flex gap-3">
              <button
                onClick={saveConsulting}
                className="mt-4 bg-black text-white px-6 py-3 rounded font-bold"
              >
                상담결과 저장하기
              </button>

              <Link
                href={`/admin/results/${id}`}
                className="mt-4 inline-block bg-indigo-700 text-white px-6 py-3 rounded font-bold"
              >
                PDF 출력하기
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function ExamSection({
  title,
  examKey,
  exam,
  updateExam,
}: {
  title: string;
  examKey: ExamKey;
  exam: ExamState;
  updateExam: (examKey: ExamKey, field: keyof ExamState, value: string) => void;
}) {
  return (
    <section className="rounded-2xl bg-white border p-6 shadow-sm">
      <h2 className="text-xl font-bold mb-4">{title}</h2>

      <div className="space-y-4">
        <SubjectBlock title="국어" selector={<Select label="국어 선택" value={exam.korean_type} onChange={(v) => updateExam(examKey, "korean_type", v)} options={koreanOptions} />} score={exam.korean_score} percentile={exam.korean_percentile} grade={exam.korean_grade} onScore={(v) => updateExam(examKey, "korean_score", v)} onPercentile={(v) => updateExam(examKey, "korean_percentile", v)} onGrade={(v) => updateExam(examKey, "korean_grade", v)} />

        <SubjectBlock title="수학" selector={<Select label="수학 선택" value={exam.math_type} onChange={(v) => updateExam(examKey, "math_type", v)} options={mathOptions} />} score={exam.math_score} percentile={exam.math_percentile} grade={exam.math_grade} onScore={(v) => updateExam(examKey, "math_score", v)} onPercentile={(v) => updateExam(examKey, "math_percentile", v)} onGrade={(v) => updateExam(examKey, "math_grade", v)} />

        <div className="border rounded-xl p-4">
          <h3 className="font-bold mb-3">영어</h3>
          <Input label="영어 등급" value={exam.english_grade} onChange={(v) => updateExam(examKey, "english_grade", v)} />
        </div>

        <SubjectBlock title="탐구1" selector={<Select label="탐구1 선택" value={exam.tamgu1_type} onChange={(v) => updateExam(examKey, "tamgu1_type", v)} options={tamguOptions} />} score={exam.tamgu1_score} percentile={exam.tamgu1_percentile} grade={exam.tamgu1_grade} onScore={(v) => updateExam(examKey, "tamgu1_score", v)} onPercentile={(v) => updateExam(examKey, "tamgu1_percentile", v)} onGrade={(v) => updateExam(examKey, "tamgu1_grade", v)} />

        <SubjectBlock title="탐구2" selector={<Select label="탐구2 선택" value={exam.tamgu2_type} onChange={(v) => updateExam(examKey, "tamgu2_type", v)} options={tamguOptions} />} score={exam.tamgu2_score} percentile={exam.tamgu2_percentile} grade={exam.tamgu2_grade} onScore={(v) => updateExam(examKey, "tamgu2_score", v)} onPercentile={(v) => updateExam(examKey, "tamgu2_percentile", v)} onGrade={(v) => updateExam(examKey, "tamgu2_grade", v)} />
      </div>
    </section>
  );
}

function SubjectBlock({
  title,
  selector,
  score,
  percentile,
  grade,
  onScore,
  onPercentile,
  onGrade,
}: {
  title: string;
  selector: React.ReactNode;
  score: string;
  percentile: string;
  grade: string;
  onScore: (value: string) => void;
  onPercentile: (value: string) => void;
  onGrade: (value: string) => void;
}) {
  return (
    <div className="border rounded-xl p-4">
      <h3 className="font-bold mb-3">{title}</h3>
      <div className="grid grid-cols-4 gap-3">
        {selector}
        <Input label="원점수" value={score} onChange={onScore} />
        <Input label="백분위" value={percentile} onChange={onPercentile} />
        <Input label="등급" value={grade} onChange={onGrade} />
      </div>
    </div>
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