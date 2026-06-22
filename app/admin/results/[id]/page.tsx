"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ScoreItem = {
  subject?: string;
  choice?: string | number;
  score?: string | number;
  percentile?: string | number;
  grade?: string | number;
};

type RecordData = {
  id: string;
  created_at: string;
  student_name: string;
  school: string;
  grade: string;
  student_grade?: string;
  track?: string;
  overall_gpa?: string | number;
  major_gpa?: string | number;
  class_rank?: string | number;
  admission_type?: string;
  extracurricular_needed?: string;
  csat_plan?: string;
  priority_after_final?: string;
  strategy_type?: string;
  question?: string;
  memo?: string;
  june_scores?: any;
  september_scores?: any;
  november_scores?: any;
  universities?: any;
  ai_comment?: string;
  ai_recommendation?: string;
  ai_university_analysis?: string;
};

function safeParse(value: any) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function showValue(value: any) {
  return value !== undefined && value !== null && value !== "" ? value : "-";
}

function normalizeScores(raw: any): ScoreItem[] {
  const data = safeParse(raw);
  if (!data) return [];

  if (Array.isArray(data)) return data;

  if (
    data.math_score !== undefined ||
    data.korean_score !== undefined ||
    data.english_grade !== undefined ||
    data.tamgu1_score !== undefined ||
    data.tamgu2_score !== undefined
  ) {
    return [
      {
        subject: "국어",
        choice: data.korean_type || "",
        score: data.korean_score || "",
        percentile: data.korean_percentile || "",
        grade: data.korean_grade || "",
      },
      {
        subject: "수학",
        choice: data.math_type || "",
        score: data.math_score || "",
        percentile: data.math_percentile || "",
        grade: data.math_grade || "",
      },
      {
        subject: "영어",
        choice: "-",
        score: data.english_score || "",
        percentile: data.english_percentile || "",
        grade: data.english_grade || "",
      },
      {
        subject: "탐구1",
        choice: data.tamgu1_type || "",
        score: data.tamgu1_score || "",
        percentile: data.tamgu1_percentile || "",
        grade: data.tamgu1_grade || "",
      },
      {
        subject: "탐구2",
        choice: data.tamgu2_type || "",
        score: data.tamgu2_score || "",
        percentile: data.tamgu2_percentile || "",
        grade: data.tamgu2_grade || "",
      },
    ];
  }

  const labels: Record<string, string> = {
    korean: "국어",
    math: "수학",
    english: "영어",
    inquiry1: "탐구1",
    inquiry2: "탐구2",
  };

  return Object.entries(data).map(([key, value]: any) => ({
    subject: labels[key] || value?.subject || key,
    choice: value?.choice || value?.type || "",
    score: value?.score || "",
    percentile: value?.percentile || "",
    grade: value?.grade || "",
  }));
}

function ScoreTable({
  title,
  scores,
}: {
  title: string;
  scores: ScoreItem[];
}) {
  if (!scores.length) return null;

  return (
    <section className="mt-8 break-inside-avoid">
      <h2 className="mb-3 text-xl font-bold text-slate-900">{title}</h2>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="border border-slate-200 px-3 py-2">과목</th>
              <th className="border border-slate-200 px-3 py-2">선택과목</th>
              <th className="border border-slate-200 px-3 py-2">원점수</th>
              <th className="border border-slate-200 px-3 py-2">백분위</th>
              <th className="border border-slate-200 px-3 py-2">등급</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s, i) => (
              <tr key={i} className="text-center">
                <td className="border border-slate-200 px-3 py-2 font-semibold">
                  {showValue(s.subject)}
                </td>
                <td className="border border-slate-200 px-3 py-2">
                  {showValue(s.choice)}
                </td>
                <td className="border border-slate-200 px-3 py-2">
                  {showValue(s.score)}
                </td>
                <td className="border border-slate-200 px-3 py-2">
                  {showValue(s.percentile)}
                </td>
                <td className="border border-slate-200 px-3 py-2">
                  {showValue(s.grade)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [record, setRecord] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(true);

  const septemberScores = useMemo(
    () => normalizeScores(record?.september_scores),
    [record]
  );

  const novemberScores = useMemo(
    () => normalizeScores(record?.november_scores),
    [record]
  );

  const universities = useMemo(() => {
    const parsed = safeParse(record?.universities);
    return Array.isArray(parsed) ? parsed : [];
  }, [record]);

  useEffect(() => {
    async function fetchRecord() {
      setLoading(true);

      const { data, error } = await supabase
        .from("consultation_records")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        alert("상담 결과를 불러오지 못했습니다.");
        console.error(error);
      } else {
        setRecord(data);
      }

      setLoading(false);
    }

    if (id) fetchRecord();
  }, [id]);

  useEffect(() => {
    if (!loading && record && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("print") === "1") {
        setTimeout(() => {
          window.print();
        }, 500);
      }
    }
  }, [loading, record]);

  function openPrintPage() {
    if (typeof window === "undefined") return;
    window.open(`/admin/results/${id}?print=1`, "_blank");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">불러오는 중...</p>
      </main>
    );
  }

  if (!record) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">상담 결과가 없습니다.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-4xl justify-between print:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white"
        >
          뒤로가기
        </button>

        <button
          type="button"
          onClick={openPrintPage}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          PDF 저장하기
        </button>
      </div>

      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow print:max-w-none print:rounded-none print:p-6 print:shadow-none">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold text-blue-600">
            강성재교육연구소 AI 입시 CRM
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            입시 상담 결과 보고서
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            저장일: {new Date(record.created_at).toLocaleDateString("ko-KR")}
          </p>
        </header>

        <section className="mt-8 grid grid-cols-2 gap-3 text-sm">
          <Info label="학생 이름" value={record.student_name} />
          <Info label="학교" value={record.school} />
          <Info label="학년" value={record.grade || record.student_grade} />
          <Info label="계열" value={record.track} />
          <Info label="전교과 내신" value={record.overall_gpa} />
          <Info label="주요교과 내신" value={record.major_gpa} />
          <Info label="전교 등수" value={record.class_rank} />
          <Info label="주력 전형" value={record.admission_type} />
          <Info label="비교과 관리" value={record.extracurricular_needed} />
          <Info label="수능 대비" value={record.csat_plan} />
          <Info label="최우선 순위" value={record.priority_after_final} />
          <Info label="수시/정시 전략" value={record.strategy_type} />
        </section>

        {record.question && (
          <section className="mt-8">
            <h2 className="mb-3 text-xl font-bold text-slate-900">
              상담 질문
            </h2>
            <div className="rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
              {record.question}
            </div>
          </section>
        )}

        {record.memo && (
          <section className="mt-8">
            <h2 className="mb-3 text-xl font-bold text-slate-900">
              상담 메모
            </h2>
            <div className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
              {record.memo}
            </div>
          </section>
        )}

        <ScoreTable title="9월 모의고사 목표 성적표" scores={septemberScores} />
        <ScoreTable title="11월 수능 목표 성적표" scores={novemberScores} />

        {universities.length > 0 && (
          <section className="mt-8 break-inside-avoid">
            <h2 className="mb-3 text-xl font-bold text-slate-900">
              지원 희망 대학
            </h2>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="border border-slate-200 px-3 py-2">대학</th>
                    <th className="border border-slate-200 px-3 py-2">전형</th>
                    <th className="border border-slate-200 px-3 py-2">계열</th>
                    <th className="border border-slate-200 px-3 py-2">
                      모집단위
                    </th>
                    <th className="border border-slate-200 px-3 py-2">
                      특이사항
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {universities.map((u: any, i: number) => (
                    <tr key={i} className="text-center">
                      <td className="border border-slate-200 px-3 py-2">
                        {showValue(u.university)}
                      </td>
                      <td className="border border-slate-200 px-3 py-2">
                        {showValue(u.admission || u.admission_type)}
                      </td>
                      <td className="border border-slate-200 px-3 py-2">
                        {showValue(u.track)}
                      </td>
                      <td className="border border-slate-200 px-3 py-2">
                        {showValue(u.department)}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-left">
                        {showValue(u.point)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {record.ai_comment && (
          <section className="mt-8">
            <h2 className="mb-3 text-xl font-bold text-slate-900">
              AI 종합 코멘트
            </h2>
            <div className="whitespace-pre-wrap rounded-xl bg-blue-50 p-4 text-sm leading-7 text-slate-800">
              {record.ai_comment}
            </div>
          </section>
        )}

        {record.ai_recommendation && (
          <section className="mt-8">
            <h2 className="mb-3 text-xl font-bold text-slate-900">
              추천 전략
            </h2>
            <div className="whitespace-pre-wrap rounded-xl bg-emerald-50 p-4 text-sm leading-7 text-slate-800">
              {record.ai_recommendation}
            </div>
          </section>
        )}

        {record.ai_university_analysis && (
          <section className="mt-8">
            <h2 className="mb-3 text-xl font-bold text-slate-900">
              대학별 분석
            </h2>
            <div className="whitespace-pre-wrap rounded-xl bg-amber-50 p-4 text-sm leading-7 text-slate-800">
              {record.ai_university_analysis}
            </div>
          </section>
        )}

        <footer className="mt-12 border-t border-slate-200 pt-5 text-center text-xs text-slate-500">
          본 자료는 강성재교육연구소 상담 참고용 자료입니다.
        </footer>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-1 font-bold text-slate-900">{showValue(value)}</div>
    </div>
  );
}