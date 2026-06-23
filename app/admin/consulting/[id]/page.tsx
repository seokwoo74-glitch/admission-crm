"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ScoreKey = "korean" | "math" | "english" | "inquiry1" | "inquiry2";
type ExamKey = "june_scores" | "september_scores" | "november_scores";

type ScoreSet = Record<
  ScoreKey,
  {
    subject: string;
    choice: string;
    score: string;
    percentile: string;
    grade: string;
  }
>;

type UnivRow = {
  university: string;
  admission: string;
  admission_type?: string;
  track: string;
  department: string;
  quota?: string | number;
  method?: string;
  minimum_score?: string;
  exam_date?: string;
  competition_rate?: string | number;
  cut_score?: string | number;
  point?: string;
};

const scoreKeys: ScoreKey[] = ["korean", "math", "english", "inquiry1", "inquiry2"];

const scoreLabels: Record<ScoreKey, string> = {
  korean: "국어",
  math: "수학",
  english: "영어",
  inquiry1: "탐구1",
  inquiry2: "탐구2",
};

const emptyScores: ScoreSet = {
  korean: { subject: "국어", choice: "", score: "", percentile: "", grade: "" },
  math: { subject: "수학", choice: "", score: "", percentile: "", grade: "" },
  english: { subject: "영어", choice: "", score: "", percentile: "", grade: "" },
  inquiry1: { subject: "탐구1", choice: "", score: "", percentile: "", grade: "" },
  inquiry2: { subject: "탐구2", choice: "", score: "", percentile: "", grade: "" },
};

export default function ConsultingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [recordId, setRecordId] = useState("");
  const [admissionRows, setAdmissionRows] = useState<UnivRow[]>([]);

  const [form, setForm] = useState<any>({
    student_name: "",
    school: "",
    grade: "",
    track: "",
    overall_gpa: "",
    major_gpa: "",
    class_rank: "",
    admission_type: "",
    extracurricular_needed: "",
    csat_plan: "",
    priority_after_final: "",
    strategy_type: "",
    question: "",
    memo: "",
    june_scores: emptyScores,
    september_scores: emptyScores,
    november_scores: emptyScores,
    universities: [],
  });

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);

    const { data: appData, error: appError } = await supabase
      .from("consultation_applications")
      .select("*")
      .eq("id", id)
      .single();

    if (appError) {
      alert("신청서를 불러오지 못했습니다.");
      console.error(appError);
      setLoading(false);
      return;
    }

    const { data: recordData } = await supabase
      .from("consultation_records")
      .select("*")
      .eq("application_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: dbRows, error: dbError } = await supabase
      .from("admission_db")
      .select(
        "university, admission_type, track, department, quota, method, minimum_score, exam_date, competition_rate, cut_score, point"
      )
      .order("university", { ascending: true });

    if (dbError) console.error(dbError);
    setAdmissionRows((dbRows || []) as any);

    const base = recordData || appData;
    setRecordId(recordData?.id || "");

    setForm({
      student_name: base?.student_name || "",
      school: base?.school || "",
      grade: base?.grade || "",
      track: base?.track || "",
      overall_gpa: base?.overall_gpa || "",
      major_gpa: base?.major_gpa || "",
      class_rank: base?.class_rank || "",
      admission_type: base?.admission_type || "",
      extracurricular_needed: base?.extracurricular_needed || "",
      csat_plan: base?.csat_plan || "",
      priority_after_final: base?.priority_after_final || "",
      strategy_type: base?.strategy_type || "",
      question: base?.question || "",
      memo: recordData?.memo || "",

      june_scores:
        normalizeScores(recordData?.june_scores) ||
        normalizeScores(appData?.june_scores) ||
        normalizeScores(appData?.exam_scores?.june) ||
        normalizeScores(appData?.mock_scores?.june) ||
        normalizeScores(appData) ||
        emptyScores,

      september_scores:
        normalizeScores(recordData?.september_scores) ||
        normalizeScores(appData?.september_scores) ||
        normalizeScores(appData?.exam_scores?.september) ||
        emptyScores,

      november_scores:
        normalizeScores(recordData?.november_scores) ||
        normalizeScores(appData?.november_scores) ||
        normalizeScores(appData?.exam_scores?.november) ||
        emptyScores,

      universities:
        safeArr(recordData?.universities).length > 0
          ? safeArr(recordData?.universities)
          : safeArr(appData?.desired_universities),
    });

    setLoading(false);
  }

  function updateField(key: string, value: any) {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  }

  function updateScore(exam: ExamKey, key: ScoreKey, field: string, value: string) {
    setForm((prev: any) => ({
      ...prev,
      [exam]: {
        ...prev[exam],
        [key]: {
          ...prev[exam][key],
          [field]: value,
        },
      },
    }));
  }

  function updateUniversity(index: number, field: keyof UnivRow, value: string) {
    setForm((prev: any) => {
      const next = [...prev.universities];
      next[index] = {
        ...next[index],
        [field]: value,
      };

      const updated = autofillUniversity(next[index]);

      next[index] = updated;

      return { ...prev, universities: next };
    });
  }

  function addUniversity() {
    setForm((prev: any) => ({
      ...prev,
      universities: [
        ...prev.universities,
        {
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
        },
      ],
    }));
  }

  function removeUniversity(index: number) {
    setForm((prev: any) => ({
      ...prev,
      universities: prev.universities.filter((_: any, i: number) => i !== index),
    }));
  }

  function autofillUniversity(row: UnivRow): UnivRow {
    if (!row.university || !row.department) return row;

    const found = admissionRows.find((r: any) => {
      const sameUniversity = r.university === row.university;
      const sameDepartment = r.department === row.department;
      const sameTrack = row.track ? r.track === row.track : true;
      const sameAdmission = row.admission
        ? r.admission_type === row.admission || r.admission_type === row.admission_type
        : true;

      return sameUniversity && sameDepartment && sameTrack && sameAdmission;
    });

    if (!found) return row;

    return {
      ...row,
      university: found.university || row.university,
      admission: found.admission_type || row.admission || "",
      admission_type: found.admission_type || row.admission_type || "",
      track: found.track || row.track || "",
      department: found.department || row.department,
      quota: found.quota ?? "",
      method: found.method ?? "",
      minimum_score: found.minimum_score ?? "",
      exam_date: found.exam_date ?? "",
      competition_rate: found.competition_rate ?? "",
      cut_score: found.cut_score ?? "",
      point: found.point ?? "",
    };
  }

  async function saveResult() {
    setSaving(true);

    const payload = {
      application_id: id,
      student_name: form.student_name,
      school: form.school,
      grade: form.grade,
      student_grade: form.grade,
      track: form.track,
      overall_gpa: form.overall_gpa,
      major_gpa: form.major_gpa,
      class_rank: form.class_rank,
      admission_type: form.admission_type,
      extracurricular_needed: form.extracurricular_needed,
      csat_plan: form.csat_plan,
      priority_after_final: form.priority_after_final,
      strategy_type: form.strategy_type,
      question: form.question,
      memo: form.memo,
      june_scores: form.june_scores,
      september_scores: form.september_scores,
      november_scores: form.november_scores,
      universities: form.universities,
    };

    const { data, error } = recordId
      ? await supabase
          .from("consultation_records")
          .update(payload)
          .eq("id", recordId)
          .select("id")
          .single()
      : await supabase
          .from("consultation_records")
          .insert(payload)
          .select("id")
          .single();

    setSaving(false);

    if (error) {
      alert("상담결과 저장 실패");
      console.error(error);
      return;
    }

    setRecordId(data.id);
    alert("상담결과 저장 완료");
    router.push(`/admin/results/${data.id}`);
  }

  const universityOptions = useMemo(
    () => unique(admissionRows.map((r) => r.university)),
    [admissionRows]
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f8]">
        <p className="font-bold text-slate-500">불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7f8]">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-black text-[#03c75a]">
              강성재교육연구소 AI 입시 CRM
            </p>
            <h1 className="mt-1 text-2xl font-black text-slate-900">
              상담결과 작성
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700"
            >
              목록
            </button>

            {recordId && (
              <button
                type="button"
                onClick={() => router.push(`/admin/results/${recordId}`)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white"
              >
                결과보기
              </button>
            )}

            <button
              type="button"
              onClick={saveResult}
              disabled={saving}
              className="rounded-xl bg-[#03c75a] px-5 py-2 text-sm font-black text-white shadow-sm disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="rounded-2xl bg-[#03c75a] p-5 text-white">
            <p className="text-sm font-bold opacity-90">상담 학생</p>
            <h2 className="mt-2 text-3xl font-black">
              {form.student_name || "-"}
            </h2>
            <p className="mt-2 text-sm font-bold opacity-90">
              {form.school || "-"} · {form.grade || "-"}
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <SideInfo label="계열" value={form.track} />
            <SideInfo label="전교과" value={form.overall_gpa} />
            <SideInfo label="주요교과" value={form.major_gpa} />
            <SideInfo label="희망대학" value={`${form.universities.length}개`} />
          </div>
        </aside>

        <div className="space-y-6">
          <Card title="신청서 정보 수정" desc="상담 전 기본 정보를 확인하고 수정합니다.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input label="학생 이름" value={form.student_name} onChange={(v: string) => updateField("student_name", v)} />
              <Input label="학교" value={form.school} onChange={(v: string) => updateField("school", v)} />
              <Input label="학년" value={form.grade} onChange={(v: string) => updateField("grade", v)} />
              <Input label="계열" value={form.track} onChange={(v: string) => updateField("track", v)} />
              <Input label="전교과 내신" value={form.overall_gpa} onChange={(v: string) => updateField("overall_gpa", v)} />
              <Input label="주요교과 내신" value={form.major_gpa} onChange={(v: string) => updateField("major_gpa", v)} />
              <Input label="전교 등수" value={form.class_rank} onChange={(v: string) => updateField("class_rank", v)} />
              <Input label="주력전형" value={form.admission_type} onChange={(v: string) => updateField("admission_type", v)} />
              <Input label="생기부 비교과 관리" value={form.extracurricular_needed} onChange={(v: string) => updateField("extracurricular_needed", v)} />
              <Input label="수능대비" value={form.csat_plan} onChange={(v: string) => updateField("csat_plan", v)} />
              <Input label="3-1 기말 후 최우선 순위" value={form.priority_after_final} onChange={(v: string) => updateField("priority_after_final", v)} />
              <Input label="수시/정시 전략" value={form.strategy_type} onChange={(v: string) => updateField("strategy_type", v)} />
            </div>
          </Card>

          <Card
            title="희망 대학 수정"
            desc="대학/전형/계열/모집단위를 수정하면 admission_db 기준 경쟁률·컷·전형정보가 자동으로 다시 채워집니다."
          >
            <div className="space-y-5">
              {form.universities.map((u: UnivRow, i: number) => (
                <UniversityEditor
                  key={i}
                  index={i}
                  row={u}
                  admissionRows={admissionRows}
                  universityOptions={universityOptions}
                  updateUniversity={updateUniversity}
                  removeUniversity={removeUniversity}
                />
              ))}

              <button
                type="button"
                onClick={addUniversity}
                className="w-full rounded-2xl border border-dashed border-[#03c75a] bg-[#f0fff7] px-4 py-4 text-sm font-black text-[#03a34b]"
              >
                + 희망 대학 추가
              </button>
            </div>
          </Card>

          <ScoreSection title="6월 모의고사 성적" exam="june_scores" scores={form.june_scores} updateScore={updateScore} />
          <ScoreSection title="9월 모의고사 목표" exam="september_scores" scores={form.september_scores} updateScore={updateScore} />
          <ScoreSection title="11월 수능 목표" exam="november_scores" scores={form.november_scores} updateScore={updateScore} />

          <Card title="상담 질문 / 상담 메모" desc="학생 질문과 최종 상담 내용을 기록합니다.">
            <div className="grid grid-cols-1 gap-4">
              <TextArea label="상담 질문" value={form.question} onChange={(v: string) => updateField("question", v)} />
              <TextArea label="상담 메모" value={form.memo} onChange={(v: string) => updateField("memo", v)} tall />
            </div>
          </Card>

          <div className="flex justify-end gap-2 pb-10">
            {recordId && (
              <button
                type="button"
                onClick={() => router.push(`/admin/results/${recordId}`)}
                className="rounded-2xl bg-slate-900 px-6 py-4 font-black text-white"
              >
                상담결과보기
              </button>
            )}

            <button
              type="button"
              onClick={saveResult}
              disabled={saving}
              className="rounded-2xl bg-[#03c75a] px-8 py-4 font-black text-white shadow-sm disabled:opacity-50"
            >
              {saving ? "저장 중..." : "상담결과 저장"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function UniversityEditor({
  index,
  row,
  admissionRows,
  universityOptions,
  updateUniversity,
  removeUniversity,
}: {
  index: number;
  row: UnivRow;
  admissionRows: UnivRow[];
  universityOptions: string[];
  updateUniversity: (index: number, field: keyof UnivRow, value: string) => void;
  removeUniversity: (index: number) => void;
}) {
  const admissionOptions = unique(
    admissionRows
      .filter((r) => r.university === row.university)
      .map((r: any) => r.admission_type)
  );

  const trackOptions = unique(
    admissionRows
      .filter(
        (r: any) =>
          r.university === row.university &&
          (!row.admission || r.admission_type === row.admission)
      )
      .map((r) => r.track)
  );

  const departmentOptions = unique(
    admissionRows
      .filter(
        (r: any) =>
          r.university === row.university &&
          (!row.admission || r.admission_type === row.admission) &&
          (!row.track || r.track === row.track)
      )
      .map((r) => r.department)
  );

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-900">
          희망 대학 {index + 1}
        </h3>

        <button
          type="button"
          onClick={() => removeUniversity(index)}
          className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600"
        >
          삭제
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Select
          label="대학"
          value={row.university}
          options={universityOptions}
          onChange={(v: string) => updateUniversity(index, "university", v)}
        />

        <Select
          label="전형"
          value={row.admission || row.admission_type || ""}
          options={admissionOptions}
          onChange={(v: string) => updateUniversity(index, "admission", v)}
        />

        <Select
          label="계열"
          value={row.track}
          options={trackOptions}
          onChange={(v: string) => updateUniversity(index, "track", v)}
        />

        <Select
          label="모집단위"
          value={row.department}
          options={departmentOptions}
          onChange={(v: string) => updateUniversity(index, "department", v)}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <ReadonlyInfo label="모집인원" value={row.quota} />
        <ReadonlyInfo label="경쟁률" value={row.competition_rate} />
        <ReadonlyInfo label="내신컷" value={row.cut_score} />
        <ReadonlyInfo label="수능최저" value={row.minimum_score} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <ReadonlyInfo label="전형방법" value={row.method} />
        <ReadonlyInfo label="면접/고사일" value={row.exam_date} />
      </div>

      <div className="mt-3">
        <ReadonlyInfo label="특이사항" value={row.point} />
      </div>
    </div>
  );
}

function ScoreSection({
  title,
  exam,
  scores,
  updateScore,
}: {
  title: string;
  exam: ExamKey;
  scores: ScoreSet;
  updateScore: (exam: ExamKey, key: ScoreKey, field: string, value: string) => void;
}) {
  return (
    <Card title={title} desc="선택과목, 원점수, 백분위, 등급을 입력합니다.">
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-[#f0fff7] text-slate-700">
            <tr>
              <th className="border border-slate-200 p-3">과목</th>
              <th className="border border-slate-200 p-3">선택과목</th>
              <th className="border border-slate-200 p-3">원점수</th>
              <th className="border border-slate-200 p-3">백분위</th>
              <th className="border border-slate-200 p-3">등급</th>
            </tr>
          </thead>
          <tbody>
            {scoreKeys.map((key) => (
              <tr key={key}>
                <td className="border border-slate-200 bg-white p-3 text-center font-black">
                  {scoreLabels[key]}
                </td>
                {["choice", "score", "percentile", "grade"].map((field) => (
                  <td key={field} className="border border-slate-200 p-2">
                    <input
                      value={(scores as any)?.[key]?.[field] || ""}
                      onChange={(e) =>
                        updateScore(exam, key, field, e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center outline-none focus:border-[#03c75a] focus:bg-white"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">{desc}</p>
      </div>
      {children}
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-black text-slate-700">{label}</span>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-[#03c75a] focus:bg-white"
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: any;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-black text-slate-700">{label}</span>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-[#03c75a] focus:bg-white"
      >
        <option value="">선택</option>
        {options.filter(Boolean).map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  tall,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  tall?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-black text-slate-700">{label}</span>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 outline-none focus:border-[#03c75a] focus:bg-white ${
          tall ? "min-h-[180px]" : "min-h-[100px]"
        }`}
      />
    </label>
  );
}

function SideInfo({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-900">{value || "-"}</p>
    </div>
  );
}

function ReadonlyInfo({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black text-slate-400">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm font-bold text-slate-800">
        {value !== undefined && value !== null && value !== "" ? value : "-"}
      </p>
    </div>
  );
}

function unique(arr: any[]) {
  return Array.from(new Set(arr.filter(Boolean))).sort();
}

function safeArr(value: any) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeObj(value: any) {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeScores(raw: any): ScoreSet | null {
  const data = safeObj(raw);
  if (!data) return null;

  if (
    data.korean ||
    data.math ||
    data.english ||
    data.inquiry1 ||
    data.inquiry2
  ) {
    return {
      korean: { ...emptyScores.korean, ...(data.korean || {}) },
      math: { ...emptyScores.math, ...(data.math || {}) },
      english: { ...emptyScores.english, ...(data.english || {}) },
      inquiry1: { ...emptyScores.inquiry1, ...(data.inquiry1 || {}) },
      inquiry2: { ...emptyScores.inquiry2, ...(data.inquiry2 || {}) },
    };
  }

  if (
    data.korean_score !== undefined ||
    data.math_score !== undefined ||
    data.english_grade !== undefined ||
    data.tamgu1_score !== undefined ||
    data.tamgu2_score !== undefined
  ) {
    return {
      korean: {
        subject: "국어",
        choice: data.korean_type || "",
        score: data.korean_score || "",
        percentile: data.korean_percentile || "",
        grade: data.korean_grade || "",
      },
      math: {
        subject: "수학",
        choice: data.math_type || "",
        score: data.math_score || "",
        percentile: data.math_percentile || "",
        grade: data.math_grade || "",
      },
      english: {
        subject: "영어",
        choice: "",
        score: data.english_score || "",
        percentile: data.english_percentile || "",
        grade: data.english_grade || "",
      },
      inquiry1: {
        subject: "탐구1",
        choice: data.tamgu1_type || data.inquiry1_type || "",
        score: data.tamgu1_score || data.inquiry1_score || "",
        percentile: data.tamgu1_percentile || data.inquiry1_percentile || "",
        grade: data.tamgu1_grade || data.inquiry1_grade || "",
      },
      inquiry2: {
        subject: "탐구2",
        choice: data.tamgu2_type || data.inquiry2_type || "",
        score: data.tamgu2_score || data.inquiry2_score || "",
        percentile: data.tamgu2_percentile || data.inquiry2_percentile || "",
        grade: data.tamgu2_grade || data.inquiry2_grade || "",
      },
    };
  }

  return null;
}