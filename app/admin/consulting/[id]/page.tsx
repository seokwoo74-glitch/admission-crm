"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Application = {
  id: string;
  student_name: string;
  school: string;
  grade: string;
  question: string;
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

export default function ConsultingPage() {
  const params = useParams();
  const id = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);

  const [classRank, setClassRank] = useState("");
  const [admissionType, setAdmissionType] = useState("");
  const [extracurricularNeeded, setExtracurricularNeeded] = useState("");
  const [csatPlan, setCsatPlan] = useState("");
  const [priorityAfterFinal, setPriorityAfterFinal] = useState("");
  const [strategyType, setStrategyType] = useState("");
  const [memo, setMemo] = useState("");

  const [universityOptions, setUniversityOptions] = useState<string[]>([]);
  const [admissionOptions, setAdmissionOptions] = useState<string[]>([]);
  const [trackOptions, setTrackOptions] = useState<string[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);

  const [universities, setUniversities] = useState<UniversityItem[]>(
    Array.from({ length: 9 }, () => ({
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
    }))
  );

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
    track: string
  ) {
    const { data, error } = await supabase
      .from("admission_db")
      .select("department")
      .eq("university", university)
      .eq("admission_type", admission)
      .eq("track", track);

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

  async function saveConsulting() {
    if (!application) return;

    const { error } = await supabase.from("consultation_records").insert([
      {
        application_id: application.id,
        student_name: application.student_name,
        school: application.school,
        grade: application.grade,
        class_rank: classRank,
        admission_type: admissionType,
        extracurricular_needed: extracurricularNeeded,
        csat_plan: csatPlan,
        priority_after_final: priorityAfterFinal,
        strategy_type: strategyType,
        question: application.question,
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
    <main className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">상담결과 작성</h1>

      <div className="border rounded-lg p-5 mb-6 bg-gray-50">
        <h2 className="text-xl font-bold mb-3">학생 기본정보</h2>
        <p>이름: {application.student_name}</p>
        <p>학교: {application.school}</p>
        <p>학년: {application.grade}</p>
        <p>질문사항: {application.question}</p>
      </div>

      <div className="space-y-4">
        <input
          className="w-full border p-3 rounded"
          placeholder="나는 전교 몇 등?"
          value={classRank}
          onChange={(e) => setClassRank(e.target.value)}
        />

        <select
          className="w-full border p-3 rounded"
          value={admissionType}
          onChange={(e) => setAdmissionType(e.target.value)}
        >
          <option value="">나의 주력전형 선택</option>
          <option>교과전형</option>
          <option>학생부종합전형</option>
          <option>논술전형</option>
          <option>지역인재전형</option>
          <option>지역의사제</option>
          <option>농어촌전형</option>
          <option>기회균형전형</option>
        </select>

        <select
          className="w-full border p-3 rounded"
          value={extracurricularNeeded}
          onChange={(e) => setExtracurricularNeeded(e.target.value)}
        >
          <option value="">생기부 비교과 관리 여부</option>
          <option>관리한다</option>
          <option>관리안한다</option>
        </select>

        <select
          className="w-full border p-3 rounded"
          value={csatPlan}
          onChange={(e) => setCsatPlan(e.target.value)}
        >
          <option value="">수능대비 선택</option>
          <option>전과목대비(논술/정시)</option>
          <option>수능최저만 관리</option>
          <option>수능대비 안한다</option>
        </select>

        <select
          className="w-full border p-3 rounded"
          value={priorityAfterFinal}
          onChange={(e) => setPriorityAfterFinal(e.target.value)}
        >
          <option value="">3-1 기말 후 최우선 순위</option>
          <option>생기부관리</option>
          <option>수능대비</option>
          <option>논술대비</option>
          <option>면접대비</option>
        </select>

        <select
          className="w-full border p-3 rounded"
          value={strategyType}
          onChange={(e) => setStrategyType(e.target.value)}
        >
          <option value="">수시/정시 전략 선택</option>
          <option>수시에 끝낸다</option>
          <option>정시까지 고려한다</option>
        </select>

        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">지원대학 1~9</h2>

          <div className="space-y-6">
            {universities.map((item, index) => (
              <div key={index} className="border rounded p-4">
                <h3 className="font-bold mb-3">{index + 1}번 지원대학</h3>

                <div className="grid grid-cols-4 gap-2">
                  <select
                    className="border p-2 rounded"
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
                    className="border p-2 rounded"
                    value={item.admission}
                    onChange={(e) =>
                      updateUniversity(index, "admission", e.target.value)
                    }
                    disabled={!item.university}
                  >
                    <option value="">전형 선택</option>
                    {admissionOptions.map((admission) => (
                      <option key={admission} value={admission}>
                        {admission}
                      </option>
                    ))}
                  </select>

                  <select
                    className="border p-2 rounded"
                    value={item.track}
                    onChange={(e) =>
                      updateUniversity(index, "track", e.target.value)
                    }
                    disabled={!item.admission}
                  >
                    <option value="">계열 선택</option>
                    {trackOptions.map((track) => (
                      <option key={track} value={track}>
                        {track}
                      </option>
                    ))}
                  </select>

                  <select
                    className="border p-2 rounded"
                    value={item.department}
                    onChange={(e) => selectDepartment(index, e.target.value)}
                    disabled={!item.track}
                  >
                    <option value="">모집단위 선택</option>
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
        </div>

        <textarea
          className="w-full border p-3 rounded h-40"
          placeholder="상담 메모"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />

        <button
          onClick={saveConsulting}
          className="bg-black text-white px-6 py-3 rounded"
        >
          상담결과 저장하기
        </button>
      </div>
    </main>
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