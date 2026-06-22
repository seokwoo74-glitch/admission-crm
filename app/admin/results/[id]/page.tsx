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
        setTimeout(() => window.print(), 500);
      }
    }
  }, [loading, record]);

  function openPrintPage() {
    if (typeof window === "undefined") return;
    window.open(`/admin/results/${id}?print=1`, "_blank");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f8]">
        <p className="font-bold text-slate-500">불러오는 중...</p>
      </main>
    );
  }

  if (!record) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f8]">
        <p className="font-bold text-slate-500">상담 결과가 없습니다.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7f8] px-4 py-6 print:bg-white print:p-0">
<style jsx global>{`
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        body {
          background: white !important;
        }

        @page {
          size: A4;
          margin: 10mm;
        }
      }
    `}</style>
      <div className="mx-auto mb-5 flex max-w-5xl justify-between print:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm"
        >
          뒤로가기
        </button>

        <button
          type="button"
          onClick={openPrintPage}
          className="rounded-2xl bg-[#03c75a] px-6 py-3 text-sm font-black text-white shadow-sm"
        >
          PDF 저장하기
        </button>
      </div>

      <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-sm print:max-w-none print:rounded-none print:shadow-none">
        <section className="bg-[#03c75a] px-10 py-10 text-white print:px-8 print:py-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-black opacity-90">
                강성재교육연구소 AI 입시 CRM
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">
                입시 상담 결과 보고서
              </h1>
              <p className="mt-4 text-sm font-semibold opacity-90">
                학생의 현재 위치와 목표 성적, 지원 희망 대학을 바탕으로 작성된 상담 참고 자료입니다.
              </p>
            </div>

            <div className="rounded-3xl bg-white/15 px-6 py-5 text-right backdrop-blur">
              <p className="text-sm font-bold opacity-90">상담 학생</p>
              <p className="mt-2 text-3xl font-black">
                {record.student_name}
              </p>
              <p className="mt-1 text-sm font-bold opacity-90">
                {record.school} · {record.grade || record.student_grade}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 border-b border-slate-100 bg-white p-8 md:grid-cols-4 print:grid-cols-4 print:p-6">
          <TopInfo label="계열" value={record.track} />
          <TopInfo label="전교과 내신" value={record.overall_gpa} />
          <TopInfo label="주요교과 내신" value={record.major_gpa} />
          <TopInfo label="주력 전형" value={record.admission_type} />
        </section>

        <div className="space-y-7 p-8 print:p-6">
          <ReportCard
            number="01"
            title="학생 기본 정보"
            desc="상담 신청서 기준 기본 프로필입니다."
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 print:grid-cols-3">
              <Info label="학생 이름" value={record.student_name} />
              <Info label="학교" value={record.school} />
              <Info label="학년" value={record.grade || record.student_grade} />
              <Info label="계열" value={record.track} />
              <Info label="전교과 내신" value={record.overall_gpa} />
              <Info label="주요교과 내신" value={record.major_gpa} />
              <Info label="전교 등수" value={record.class_rank} />
              <Info label="비교과 관리" value={record.extracurricular_needed} />
              <Info label="수능 대비" value={record.csat_plan} />
              <Info label="최우선 순위" value={record.priority_after_final} />
              <Info label="수시/정시 전략" value={record.strategy_type} />
              <Info label="상담 저장일" value={new Date(record.created_at).toLocaleDateString("ko-KR")} />
            </div>
          </ReportCard>

          {record.question && (
            <ReportCard number="02" title="상담 질문" desc="학생 또는 학부모가 남긴 핵심 질문입니다.">
              <div className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 text-sm font-medium leading-7 text-slate-700">
                {record.question}
              </div>
            </ReportCard>
          )}

          <ReportCard number="03" title="목표 성적표" desc="PDF에는 9월 목표와 11월 수능 목표만 표시합니다.">
            <div className="space-y-6">
              <ScoreTable title="9월 모의고사 목표 성적표" scores={septemberScores} />
              <ScoreTable title="11월 수능 목표 성적표" scores={novemberScores} />
            </div>
          </ReportCard>

          {universities.length > 0 && (
            <ReportCard number="04" title="지원 희망 대학" desc="신청서 또는 상담 결과에 저장된 대학 목록입니다.">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-[#f0fff7] text-slate-700">
                    <tr>
                      <th className="border border-slate-200 px-3 py-3">번호</th>
                      <th className="border border-slate-200 px-3 py-3">대학</th>
                      <th className="border border-slate-200 px-3 py-3">전형</th>
                      <th className="border border-slate-200 px-3 py-3">계열</th>
                      <th className="border border-slate-200 px-3 py-3">모집단위</th>
                      <th className="border border-slate-200 px-3 py-3">특이사항</th>
                    </tr>
                  </thead>
                  <tbody>
                    {universities.map((u: any, i: number) => (
                      <tr key={i} className="text-center">
                        <td className="border border-slate-200 px-3 py-3 text-slate-500">
                          {i + 1}
                        </td>
                        <td className="border border-slate-200 px-3 py-3 font-black text-slate-900">
                          {showValue(u.university)}
                        </td>
                        <td className="border border-slate-200 px-3 py-3">
                          {showValue(u.admission || u.admission_type)}
                        </td>
                        <td className="border border-slate-200 px-3 py-3">
                          {showValue(u.track)}
                        </td>
                        <td className="border border-slate-200 px-3 py-3">
                          {showValue(u.department)}
                        </td>
                        <td className="border border-slate-200 px-3 py-3 text-left">
                          {showValue(u.point)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ReportCard>
          )}

          {record.memo && (
            <ReportCard number="05" title="최종 상담 메모" desc="상담자가 작성한 최종 코멘트입니다.">
              <div className="whitespace-pre-wrap rounded-2xl border border-[#b7efce] bg-[#f0fff7] p-5 text-sm font-medium leading-8 text-slate-800">
                {record.memo}
              </div>
            </ReportCard>
          )}

          {record.ai_comment && (
            <ReportCard number="AI" title="AI 종합 코멘트" desc="AI 분석 결과입니다.">
              <div className="whitespace-pre-wrap rounded-2xl bg-blue-50 p-5 text-sm leading-8 text-slate-800">
                {record.ai_comment}
              </div>
            </ReportCard>
          )}

          {record.ai_recommendation && (
            <ReportCard number="AI" title="AI 추천 전략" desc="AI 추천 전략입니다.">
              <div className="whitespace-pre-wrap rounded-2xl bg-emerald-50 p-5 text-sm leading-8 text-slate-800">
                {record.ai_recommendation}
              </div>
            </ReportCard>
          )}

          {record.ai_university_analysis && (
            <ReportCard number="AI" title="AI 대학별 분석" desc="AI 대학별 분석입니다.">
              <div className="whitespace-pre-wrap rounded-2xl bg-amber-50 p-5 text-sm leading-8 text-slate-800">
                {record.ai_university_analysis}
              </div>
            </ReportCard>
          )}

          <footer className="border-t border-slate-200 pt-6 text-center text-xs font-semibold text-slate-500">
            본 자료는 강성재교육연구소 상담 참고용 자료이며, 최종 지원 판단은 학생의 실제 성적·학교별 모집요강·경쟁률 변동을 함께 고려해야 합니다.
          </footer>
        </div>
      </div>
    </main>
  );
}

function ReportCard({
  number,
  title,
  desc,
  children,
}: {
  number: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="break-inside-avoid rounded-3xl border border-slate-200 bg-white p-6 shadow-sm print:rounded-2xl print:p-5 print:shadow-none">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#03c75a] text-sm font-black text-white">
          {number}
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">{title}</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">{desc}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ScoreTable({ title, scores }: { title: string; scores: ScoreItem[] }) {
  if (!scores.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-bold text-slate-400">
        {title} 입력값이 없습니다.
      </div>
    );
  }

  return (
    <div className="break-inside-avoid">
      <h3 className="mb-3 text-lg font-black text-slate-900">{title}</h3>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[#f0fff7] text-slate-700">
            <tr>
              <th className="border border-slate-200 px-3 py-3">과목</th>
              <th className="border border-slate-200 px-3 py-3">선택과목</th>
              <th className="border border-slate-200 px-3 py-3">원점수</th>
              <th className="border border-slate-200 px-3 py-3">백분위</th>
              <th className="border border-slate-200 px-3 py-3">등급</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s, i) => (
              <tr key={i} className="text-center">
                <td className="border border-slate-200 px-3 py-3 font-black text-slate-900">
                  {showValue(s.subject)}
                </td>
                <td className="border border-slate-200 px-3 py-3">
                  {showValue(s.choice)}
                </td>
                <td className="border border-slate-200 px-3 py-3">
                  {showValue(s.score)}
                </td>
                <td className="border border-slate-200 px-3 py-3">
                  {showValue(s.percentile)}
                </td>
                <td className="border border-slate-200 px-3 py-3 font-black text-[#03c75a]">
                  {showValue(s.grade)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TopInfo({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-900">{showValue(value)}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-black text-slate-400">{label}</div>
      <div className="mt-2 font-black text-slate-900">{showValue(value)}</div>
    </div>
  );
}