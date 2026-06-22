"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type AppData = any;

const subjects = ["국어", "수학", "영어", "탐구1", "탐구2"];

const emptyScores = {
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

  const [app, setApp] = useState<AppData | null>(null);
  const [recordId, setRecordId] = useState<string>("");

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

    setApp(appData);

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
    return <div className="p-10">불러오는 중...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black">상담결과 작성</h1>
            <p className="mt-1 text-sm text-slate-500">
              신청서 수정 + 상담결과 저장
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="rounded-xl bg-slate-700 px-4 py-2 text-white"
            >
              목록
            </button>

            {recordId && (
              <button
                type="button"
                onClick={() => router.push(`/admin/results/${recordId}`)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-white"
              >
                상담결과보기
              </button>
            )}

            <button
              type="button"
              onClick={saveResult}
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">신청서 정보 수정</h2>

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

          <div className="mt-4">
            <label className="mb-1 block text-sm font-bold">상담 질문</label>
            <textarea
              value={form.question}
              onChange={(e) => updateField("question", e.target.value)}
              className="min-h-[90px] w-full rounded-xl border p-3"
            />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-bold">상담 메모</label>
            <textarea
              value={form.memo}
              onChange={(e) => updateField("memo", e.target.value)}
              className="min-h-[140px] w-full rounded-xl border p-3"
            />
          </div>
        </section>

        <ScoreSection
          title="6월 모의고사"
          exam="june_scores"
          scores={form.june_scores}
          updateScore={updateScore}
        />

        <ScoreSection
          title="9월 모의고사 목표"
          exam="september_scores"
          scores={form.september_scores}
          updateScore={updateScore}
        />

        <ScoreSection
          title="11월 수능 목표"
          exam="november_scores"
          scores={form.november_scores}
          updateScore={updateScore}
        />

        <section className="mt-6 rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">희망 대학</h2>

          {form.universities?.length ? (
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border p-2">대학</th>
                    <th className="border p-2">전형</th>
                    <th className="border p-2">계열</th>
                    <th className="border p-2">모집단위</th>
                  </tr>
                </thead>
                <tbody>
                  {form.universities.map((u: any, i: number) => (
                    <tr key={i}>
                      <td className="border p-2">{u.university || "-"}</td>
                      <td className="border p-2">{u.admission || u.admission_type || "-"}</td>
                      <td className="border p-2">{u.track || "-"}</td>
                      <td className="border p-2">{u.department || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">등록된 희망 대학이 없습니다.</p>
          )}
        </section>

        <div className="mt-8 flex justify-end gap-2">
          {recordId && (
            <button
              type="button"
              onClick={() => router.push(`/admin/results/${recordId}`)}
              className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"
            >
              상담결과보기
            </button>
          )}

          <button
            type="button"
            onClick={saveResult}
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            {saving ? "저장 중..." : "상담결과 저장"}
          </button>
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
  value: any;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-700">
        {label}
      </span>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-3 py-2"
      />
    </label>
  );
}

function ScoreSection({
  title,
  exam,
  scores,
  updateScore,
}: {
  title: string;
  exam: "june_scores" | "september_scores" | "november_scores";
  scores: any;
  updateScore: (
    exam: "june_scores" | "september_scores" | "november_scores",
    key: string,
    field: string,
    value: string
  ) => void;
}) {
  const keys = ["korean", "math", "english", "inquiry1", "inquiry2"];

  return (
    <section className="mt-6 rounded-2xl bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="border p-2">과목</th>
              <th className="border p-2">선택과목</th>
              <th className="border p-2">원점수</th>
              <th className="border p-2">백분위</th>
              <th className="border p-2">등급</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key, idx) => (
              <tr key={key}>
                <td className="border p-2 font-bold">{subjects[idx]}</td>
                <td className="border p-2">
                  <input
                    value={scores?.[key]?.choice || ""}
                    onChange={(e) =>
                      updateScore(exam, key, "choice", e.target.value)
                    }
                    className="w-full rounded-lg border px-2 py-1"
                  />
                </td>
                <td className="border p-2">
                  <input
                    value={scores?.[key]?.score || ""}
                    onChange={(e) =>
                      updateScore(exam, key, "score", e.target.value)
                    }
                    className="w-full rounded-lg border px-2 py-1"
                  />
                </td>
                <td className="border p-2">
                  <input
                    value={scores?.[key]?.percentile || ""}
                    onChange={(e) =>
                      updateScore(exam, key, "percentile", e.target.value)
                    }
                    className="w-full rounded-lg border px-2 py-1"
                  />
                </td>
                <td className="border p-2">
                  <input
                    value={scores?.[key]?.grade || ""}
                    onChange={(e) =>
                      updateScore(exam, key, "grade", e.target.value)
                    }
                    className="w-full rounded-lg border px-2 py-1"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
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
  if (!value) return null;
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}