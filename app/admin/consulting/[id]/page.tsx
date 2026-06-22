"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const emptyScores = {
  korean: { subject: "국어", choice: "", score: "", percentile: "", grade: "" },
  math: { subject: "수학", choice: "", score: "", percentile: "", grade: "" },
  english: { subject: "영어", choice: "", score: "", percentile: "", grade: "" },
  inquiry1: { subject: "탐구1", choice: "", score: "", percentile: "", grade: "" },
  inquiry2: { subject: "탐구2", choice: "", score: "", percentile: "", grade: "" },
};

const scoreKeys = ["korean", "math", "english", "inquiry1", "inquiry2"];
const scoreLabels: any = {
  korean: "국어",
  math: "수학",
  english: "영어",
  inquiry1: "탐구1",
  inquiry2: "탐구2",
};

export default function ConsultingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [recordId, setRecordId] = useState("");

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
      june_scores: safeObj(recordData?.june_scores) || emptyScores,
      september_scores: safeObj(recordData?.september_scores) || emptyScores,
      november_scores: safeObj(recordData?.november_scores) || emptyScores,
      universities:
        safeArr(recordData?.universities) ||
        safeArr(appData?.desired_universities) ||
        [],
    });

    setLoading(false);
  }

  function updateField(key: string, value: any) {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  }

  function updateScore(
    exam: "june_scores" | "september_scores" | "november_scores",
    key: string,
    field: string,
    value: string
  ) {
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
            <h2 className="mt-2 text-3xl font-black">{form.student_name || "-"}</h2>
            <p className="mt-2 text-sm font-bold opacity-90">
              {form.school || "-"} · {form.grade || "-"}
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <SideInfo label="계열" value={form.track} />
            <SideInfo label="전교과" value={form.overall_gpa} />
            <SideInfo label="주요교과" value={form.major_gpa} />
            <SideInfo label="주력전형" value={form.admission_type} />
          </div>
        </aside>

        <div className="space-y-6">
          <Card title="신청서 정보 수정" desc="상담 전 기본 정보를 확인하고 수정합니다.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input label="학생 이름" value={form.student_name} onChange={(v) => updateField("student_name", v)} />
              <Input label="학교" value={form.school} onChange={(v) => updateField("school", v)} />
              <Input label="학년" value={form.grade} onChange={(v) => updateField("grade", v)} />
              <Input label="계열" value={form.track} onChange={(v) => updateField("track", v)} />
              <Input label="전교과 내신" value={form.overall_gpa} onChange={(v) => updateField("overall_gpa", v)} />
              <Input label="주요교과 내신" value={form.major_gpa} onChange={(v) => updateField("major_gpa", v)} />
              <Input label="전교 등수" value={form.class_rank} onChange={(v) => updateField("class_rank", v)} />
              <Input label="주력전형" value={form.admission_type} onChange={(v) => updateField("admission_type", v)} />
              <Input label="생기부 비교과 관리" value={form.extracurricular_needed} onChange={(v) => updateField("extracurricular_needed", v)} />
              <Input label="수능대비" value={form.csat_plan} onChange={(v) => updateField("csat_plan", v)} />
              <Input label="3-1 기말 후 최우선 순위" value={form.priority_after_final} onChange={(v) => updateField("priority_after_final", v)} />
              <Input label="수시/정시 전략" value={form.strategy_type} onChange={(v) => updateField("strategy_type", v)} />
            </div>
          </Card>

          <Card title="희망 대학" desc="신청서에서 선택한 대학/전형/모집단위입니다.">
            {form.universities?.length ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-[#f0fff7] text-slate-700">
                    <tr>
                      <th className="border border-slate-200 p-3">번호</th>
                      <th className="border border-slate-200 p-3">대학</th>
                      <th className="border border-slate-200 p-3">전형</th>
                      <th className="border border-slate-200 p-3">계열</th>
                      <th className="border border-slate-200 p-3">모집단위</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.universities.map((u: any, i: number) => (
                      <tr key={i} className="text-center">
                        <td className="border border-slate-200 p-3 text-slate-500">{i + 1}</td>
                        <td className="border border-slate-200 p-3 font-black">{u.university || "-"}</td>
                        <td className="border border-slate-200 p-3">{u.admission || u.admission_type || "-"}</td>
                        <td className="border border-slate-200 p-3">{u.track || "-"}</td>
                        <td className="border border-slate-200 p-3">{u.department || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">등록된 희망 대학이 없습니다.</p>
            )}
          </Card>

          <ScoreSection title="6월 모의고사" exam="june_scores" scores={form.june_scores} updateScore={updateScore} />
          <ScoreSection title="9월 모의고사 목표" exam="september_scores" scores={form.september_scores} updateScore={updateScore} />
          <ScoreSection title="11월 수능 목표" exam="november_scores" scores={form.november_scores} updateScore={updateScore} />

          <Card title="상담 질문 / 상담 메모" desc="학생 질문과 최종 상담 내용을 기록합니다.">
            <div className="grid grid-cols-1 gap-4">
              <TextArea label="상담 질문" value={form.question} onChange={(v) => updateField("question", v)} />
              <TextArea label="상담 메모" value={form.memo} onChange={(v) => updateField("memo", v)} tall />
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

function Card({ title, desc, children }: any) {
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
      <span className="mb-1 block text-sm font-black text-slate-700">
        {label}
      </span>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-[#03c75a] focus:bg-white"
      />
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
      <span className="mb-1 block text-sm font-black text-slate-700">
        {label}
      </span>
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

function ScoreSection({ title, exam, scores, updateScore }: any) {
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
                      value={scores?.[key]?.[field] || ""}
                      onChange={(e) => updateScore(exam, key, field, e.target.value)}
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

function SideInfo({ label, value }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-900">{value || "-"}</p>
    </div>
  );
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