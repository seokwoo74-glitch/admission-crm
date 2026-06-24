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
  student_phone?: string;
  parent_phone?: string;
  referral?: string;
  graduation_year?: string;
  school_type?: string;
  preferred_call_date?: string;
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
    const parsed = JSON.parse(value);
    if (typeof parsed === "string") return JSON.parse(parsed);
    return parsed;
  } catch {
    return null;
  }
}

function showValue(value: any) {
  return value !== undefined && value !== null && value !== "" ? value : "-";
}

function formatDecimal(value: any) {
  if (value === undefined || value === null || value === "") return "-";
  const num = Number(value);
  if (isNaN(num)) return value;
  return num.toFixed(2);
}

function normalizeScores(raw: any): ScoreItem[] {
  const data = safeParse(raw);
  if (!data) return [];
  if (Array.isArray(data)) return data;

  if (data.korean || data.math || data.english || data.inquiry1 || data.inquiry2) {
    return [
      { subject: "국어", choice: data.korean?.choice || data.korean?.type || "", score: data.korean?.score || "", percentile: data.korean?.percentile || "", grade: data.korean?.grade || "" },
      { subject: "수학", choice: data.math?.choice || data.math?.type || "", score: data.math?.score || "", percentile: data.math?.percentile || "", grade: data.math?.grade || "" },
      { subject: "영어", choice: "-", score: data.english?.score || "", percentile: data.english?.percentile || "", grade: data.english?.grade || "" },
      { subject: "탐구1", choice: data.inquiry1?.choice || data.inquiry1?.type || "", score: data.inquiry1?.score || "", percentile: data.inquiry1?.percentile || "", grade: data.inquiry1?.grade || "" },
      { subject: "탐구2", choice: data.inquiry2?.choice || data.inquiry2?.type || "", score: data.inquiry2?.score || "", percentile: data.inquiry2?.percentile || "", grade: data.inquiry2?.grade || "" },
    ];
  }

  if (
    data.koreanSubject !== undefined ||
    data.koreanScore !== undefined ||
    data.mathSubject !== undefined ||
    data.mathScore !== undefined ||
    data.englishGrade !== undefined
  ) {
    return [
      { subject: "국어", choice: data.koreanSubject || "", score: data.koreanScore || "", percentile: data.koreanPercentile || "", grade: data.koreanGrade || "" },
      { subject: "수학", choice: data.mathSubject || "", score: data.mathScore || "", percentile: data.mathPercentile || "", grade: data.mathGrade || "" },
      { subject: "영어", choice: "-", score: "", percentile: "", grade: data.englishGrade || "" },
      { subject: "탐구1", choice: data.inquiry1Subject || "", score: data.inquiry1Score || "", percentile: data.inquiry1Percentile || "", grade: data.inquiry1Grade || "" },
      { subject: "탐구2", choice: data.inquiry2Subject || "", score: data.inquiry2Score || "", percentile: data.inquiry2Percentile || "", grade: data.inquiry2Grade || "" },
    ];
  }

  if (
    data.korean_type !== undefined ||
    data.korean_score !== undefined ||
    data.math_type !== undefined ||
    data.math_score !== undefined ||
    data.english_grade !== undefined ||
    data.tamgu1_type !== undefined ||
    data.tamgu2_type !== undefined
  ) {
    return [
      { subject: "국어", choice: data.korean_type || "", score: data.korean_score || "", percentile: data.korean_percentile || "", grade: data.korean_grade || "" },
      { subject: "수학", choice: data.math_type || "", score: data.math_score || "", percentile: data.math_percentile || "", grade: data.math_grade || "" },
      { subject: "영어", choice: "-", score: data.english_score || "", percentile: data.english_percentile || "", grade: data.english_grade || "" },
      { subject: "탐구1", choice: data.tamgu1_type || data.inquiry1_type || "", score: data.tamgu1_score || data.inquiry1_score || "", percentile: data.tamgu1_percentile || data.inquiry1_percentile || "", grade: data.tamgu1_grade || data.inquiry1_grade || "" },
      { subject: "탐구2", choice: data.tamgu2_type || data.inquiry2_type || "", score: data.tamgu2_score || data.inquiry2_score || "", percentile: data.tamgu2_percentile || data.inquiry2_percentile || "", grade: data.tamgu2_grade || data.inquiry2_grade || "" },
    ];
  }

  return [];
}

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [record, setRecord] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(true);

  const juneScores = useMemo(() => normalizeScores(record?.june_scores), [record]);
  const septemberScores = useMemo(() => normalizeScores(record?.september_scores), [record]);
  const novemberScores = useMemo(() => normalizeScores(record?.november_scores), [record]);

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
        setTimeout(() => window.print(), 700);
      }
    }
  }, [loading, record]);

  function openPrintPage() {
    if (typeof window === "undefined") return;
    window.open(`/admin/results/${id}?print=1`, "_blank");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3efe7]">
        <div className="rounded-2xl border border-[#d9cdb8] bg-[#fffdf8] px-8 py-6 shadow-xl">
          <p className="font-black text-[#071d35]">불러오는 중...</p>
        </div>
      </main>
    );
  }

  if (!record) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3efe7]">
        <p className="font-bold text-[#071d35]">상담 결과가 없습니다.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3efe7] px-4 py-6 print:bg-white print:p-0">
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
            margin: 7mm;
          }

          .report-page {
            min-height: 282mm;
            page-break-after: always;
          }

          .report-page:last-child {
            page-break-after: auto;
          }

          .break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .print-compact {
            padding: 14px !important;
          }

          .print-hide {
            display: none !important;
          }
        }
      `}</style>

      <div className="mx-auto mb-5 flex max-w-5xl justify-between print:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-[#cfc2ab] bg-white px-5 py-3 text-sm font-black text-[#071d35] shadow-sm"
        >
          뒤로가기
        </button>

        <button
          type="button"
          onClick={openPrintPage}
          className="rounded-xl bg-[#c89b55] px-6 py-3 text-sm font-black text-white shadow-lg"
        >
          PDF 저장하기
        </button>
      </div>

      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-[#d9cdb8] bg-[#fffdf8] shadow-2xl print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        <div className="report-page">
          <section className="relative overflow-hidden bg-[#061a31] px-10 py-10 text-white print:px-7 print:py-7">
            <div className="absolute inset-0 opacity-10">
              <div className="h-full w-full bg-[radial-gradient(circle_at_80%_20%,#ffffff_0,transparent_28%)]" />
            </div>

            <div className="relative z-10 flex items-start justify-between gap-8">
              <div>
                <p className="text-xs font-bold tracking-[0.25em] text-[#d6ad67]">
                  KANG&apos;S EDU LAB
                </p>
                <h1 className="mt-4 text-5xl font-black leading-tight tracking-tight text-[#d6ad67] print:text-4xl">
                  입시 컨설팅
                  <br />
                  결과 보고서
                </h1>
                <p className="mt-5 max-w-xl text-sm font-semibold leading-7 text-white/90 print:text-xs">
                  학생의 성적, 희망 대학, 전형 방향을 종합하여 정리한 맞춤형 입시 전략 리포트입니다.
                </p>
              </div>

              <div className="min-w-[230px] rounded-2xl border border-white/20 bg-white/10 px-6 py-5 text-right backdrop-blur print:px-5 print:py-4">
                <p className="text-sm font-bold text-white/80">상담 학생</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-white">
                  {record.student_name}
                </p>
                <p className="mt-2 text-sm font-bold text-white/80">
                  {record.school} · {record.grade || record.student_grade}
                </p>
                <p className="mt-5 text-xs font-bold text-[#d6ad67]">
                  {new Date(record.created_at).toLocaleDateString("ko-KR")}
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-4 gap-3 border-b border-[#ded2bd] bg-[#fffaf0] p-5 print:p-4">
            <SummaryBox label="계열" value={record.track} />
            <SummaryBox label="전교과 내신" value={record.overall_gpa} />
            <SummaryBox label="주요교과 내신" value={record.major_gpa} />
            <SummaryBox label="주력 전형" value={record.admission_type} />
          </section>

          <div className="space-y-5 p-6 print:space-y-4 print:p-4">
            <SectionTitle title="학생 기본 정보" desc="Student Information" />

            <div className="grid grid-cols-3 gap-2 print:grid-cols-3">
              <Info label="학생 이름" value={record.student_name} />
              <Info label="학교" value={record.school} />
              <Info label="학년" value={record.grade || record.student_grade} />
              <Info label="학생 전화번호" value={record.student_phone} />
              <Info label="학부모 전화번호" value={record.parent_phone} />
              <Info label="소개자" value={record.referral} />
              <Info label="졸업년도" value={record.graduation_year} />
              <Info label="학교유형" value={record.school_type} />
              <Info label="2차전화상담일" value={record.preferred_call_date} />
              <Info label="전교 등수" value={record.class_rank} />
              <Info label="수능 대비" value={record.csat_plan} />
              <Info label="수시/정시 전략" value={record.strategy_type} />
            </div>

            {record.question && (
              <ReportCard number="01" title="상담 질문">
                <div className="whitespace-pre-wrap rounded-2xl border border-[#ded2bd] bg-[#fffaf0] p-4 text-sm font-medium leading-6 text-[#3f3a32] print:p-3 print:text-xs">
                  {record.question}
                </div>
              </ReportCard>
            )}

            <ReportCard number="02" title="성적 및 목표 관리">
              <div className="grid grid-cols-1 gap-4 print:gap-3">
                <GoalBlock
                  title="6월 모의고사 성적"
                  desc="현재 기준 학생의 모의고사 성적입니다."
                  scores={juneScores}
                  badge="현재 성적"
                />
                <GoalBlock
                  title="9월 모의고사 목표"
                  desc="수시 지원 전 최종 점검용 목표 성적입니다."
                  scores={septemberScores}
                  badge="9월 목표"
                />
                <GoalBlock
                  title="11월 수능 목표"
                  desc="최종 수능 기준 목표 성적입니다."
                  scores={novemberScores}
                  badge="수능 목표"
                />
              </div>
            </ReportCard>
          </div>
        </div>

        <div className="report-page">
          <div className="space-y-5 p-6 print:space-y-4 print:p-4">
            <SectionTitle title="희망 대학 및 상담 코멘트" desc="University Strategy" />

            {universities.length > 0 && (
              <ReportCard number="03" title="지원 희망 대학 분석">
                <div className="mb-4 grid grid-cols-3 gap-3 print:mb-3">
                  <MiniMetric label="희망 대학 수" value={`${universities.length}개`} />
                  <MiniMetric label="주요 전형" value={record.admission_type || "-"} />
                  <MiniMetric label="전략 방향" value={record.strategy_type || "-"} />
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#ded2bd]">
                  <table className="w-full border-collapse text-sm print:text-[11px]">
                    <thead className="bg-[#061a31] text-white">
                      <tr>
                        <th className="px-2 py-3">번호</th>
                        <th className="px-2 py-3">대학</th>
                        <th className="px-2 py-3">전형</th>
                        <th className="px-2 py-3">계열</th>
                        <th className="px-2 py-3">모집단위</th>
                        <th className="px-2 py-3 text-right">경쟁률</th>
                        <th className="px-2 py-3 text-right">내신컷</th>
                      </tr>
                    </thead>
                    <tbody>
                      {universities.map((u: any, i: number) => (
                        <tr key={i} className="bg-[#fffaf0] text-center">
                          <td className="border-t border-[#ded2bd] px-2 py-3 font-black text-[#8b6b35]">
                            {i + 1}
                          </td>
                          <td className="border-t border-[#ded2bd] px-2 py-3 font-black text-[#071d35]">
                            {showValue(u.university)}
                          </td>
                          <td className="border-t border-[#ded2bd] px-2 py-3 font-bold">
                            {showValue(u.admission || u.admission_type)}
                          </td>
                          <td className="border-t border-[#ded2bd] px-2 py-3 font-bold">
                            {showValue(u.track)}
                          </td>
                          <td className="border-t border-[#ded2bd] px-2 py-3 font-bold">
                            {showValue(u.department)}
                          </td>
                          <td className="border-t border-[#ded2bd] px-2 py-3 text-right font-black tabular-nums text-[#071d35]">
                            {formatDecimal(u.competition_rate)}
                          </td>
                          <td className="border-t border-[#ded2bd] px-2 py-3 text-right font-black tabular-nums text-[#071d35]">
                            {formatDecimal(u.cut_score)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 space-y-3 print:hidden">
                  {universities.map((u: any, i: number) => (
                    <div key={i} className="rounded-2xl border border-[#ded2bd] bg-white p-4">
                      <p className="text-sm font-black text-[#071d35]">
                        {i + 1}. {showValue(u.university)} · {showValue(u.department)}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <Detail label="모집인원" value={u.quota} />
                        <Detail label="수능최저" value={u.minimum_score} />
                        <Detail label="전형방법" value={u.method} />
                        <Detail label="면접/고사일" value={u.exam_date} />
                      </div>
                      <div className="mt-3">
                        <Detail label="특이사항" value={u.point} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 hidden print:block">
                  <table className="w-full border-collapse text-[10px]">
                    <thead className="bg-[#fffaf0] text-[#071d35]">
                      <tr>
                        <th className="border border-[#ded2bd] px-2 py-2">대학/모집단위</th>
                        <th className="border border-[#ded2bd] px-2 py-2">모집인원</th>
                        <th className="border border-[#ded2bd] px-2 py-2">수능최저</th>
                        <th className="border border-[#ded2bd] px-2 py-2">전형방법</th>
                        <th className="border border-[#ded2bd] px-2 py-2">특이사항</th>
                      </tr>
                    </thead>
                    <tbody>
                      {universities.slice(0, 9).map((u: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-[#ded2bd] px-2 py-2 font-bold">
                            {i + 1}. {showValue(u.university)} / {showValue(u.department)}
                          </td>
                          <td className="border border-[#ded2bd] px-2 py-2 text-center">
                            {showValue(u.quota)}
                          </td>
                          <td className="border border-[#ded2bd] px-2 py-2">
                            {showValue(u.minimum_score)}
                          </td>
                          <td className="border border-[#ded2bd] px-2 py-2">
                            {showValue(u.method)}
                          </td>
                          <td className="border border-[#ded2bd] px-2 py-2">
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
              <ReportCard number="04" title="최종 상담 코멘트">
                <div className="rounded-2xl border border-[#ded2bd] bg-[#fffaf0] p-6 print:p-4">
                  <p className="mb-3 text-sm font-black text-[#8b6b35]">
                    Counselor Comment
                  </p>
                  <div className="whitespace-pre-wrap text-sm font-medium leading-8 text-[#3f3a32] print:text-xs print:leading-6">
                    {record.memo}
                  </div>
                </div>
              </ReportCard>
            )}

            {(record.ai_comment ||
              record.ai_recommendation ||
              record.ai_university_analysis) && (
              <ReportCard number="AI" title="AI 분석 결과">
                <div className="space-y-4">
                  {record.ai_comment && <AiBox title="AI 종합 코멘트" text={record.ai_comment} />}
                  {record.ai_recommendation && <AiBox title="AI 추천 전략" text={record.ai_recommendation} />}
                  {record.ai_university_analysis && <AiBox title="AI 대학별 분석" text={record.ai_university_analysis} />}
                </div>
              </ReportCard>
            )}

            <footer className="mt-8 border-t border-[#ded2bd] pt-5 text-center text-xs font-semibold leading-6 text-[#5f5a52] print:mt-4 print:pt-4 print:text-[10px]">
              본 자료는 강성재교육연구소 상담 참고용 자료입니다.
              <br />
              최종 지원 판단은 실제 성적, 모집요강, 경쟁률, 대학별 환산 방식 변동을 함께 고려해야 합니다.
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}

function SectionTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <p className="text-xs font-bold tracking-[0.25em] text-[#8b6b35]">
        ADMISSION REPORT
      </p>
      <h2 className="mt-1 text-2xl font-black text-[#071d35] print:text-xl">{title}</h2>
      <p className="mt-1 text-sm font-semibold text-[#5f5a52] print:text-xs">{desc}</p>
    </div>
  );
}

function ReportCard({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid rounded-2xl border border-[#d9cdb8] bg-[#fffdf8] p-5 shadow-md print:rounded-xl print:p-3 print:shadow-none">
      <div className="mb-4 flex items-center gap-3 print:mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#061a31] text-sm font-black text-[#d6ad67] print:h-8 print:w-8 print:text-xs">
          {number}
        </div>
        <h2 className="text-xl font-black text-[#071d35] print:text-base">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function GoalBlock({ title, desc, scores, badge }: { title: string; desc: string; scores: ScoreItem[]; badge: string }) {
  return (
    <div className="break-inside-avoid rounded-2xl border border-[#ded2bd] bg-white p-4 print:p-3">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h3 className="text-base font-black text-[#071d35] print:text-sm">{title}</h3>
          <p className="mt-1 text-xs font-semibold text-[#5f5a52]">{desc}</p>
        </div>
        <span className="rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-black text-[#8b6b35] ring-1 ring-[#ded2bd] print:px-2">
          {badge}
        </span>
      </div>

      <ScoreTable scores={scores} />
    </div>
  );
}

function ScoreTable({ scores }: { scores: ScoreItem[] }) {
  if (!scores.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#ded2bd] bg-[#fffaf0] p-4 text-center text-sm font-bold text-[#8b6b35] print:p-3 print:text-xs">
        입력된 성적이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#ded2bd]">
      <table className="w-full border-collapse text-xs print:text-[10px]">
        <thead className="bg-[#061a31] text-white">
          <tr>
            <th className="px-2 py-2">과목</th>
            <th className="px-2 py-2">선택과목</th>
            <th className="px-2 py-2">원점수</th>
            <th className="px-2 py-2">백분위</th>
            <th className="px-2 py-2">등급</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s, i) => (
            <tr key={i} className="bg-[#fffaf0] text-center">
              <td className="border-t border-[#ded2bd] px-2 py-2 font-black text-[#071d35]">
                {showValue(s.subject)}
              </td>
              <td className="border-t border-[#ded2bd] px-2 py-2 font-bold">
                {showValue(s.choice)}
              </td>
              <td className="border-t border-[#ded2bd] px-2 py-2 font-bold">
                {showValue(s.score)}
              </td>
              <td className="border-t border-[#ded2bd] px-2 py-2 font-bold">
                {showValue(s.percentile)}
              </td>
              <td className="border-t border-[#ded2bd] px-2 py-2 font-black text-[#8b6b35]">
                {showValue(s.grade)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-[#ded2bd] bg-white p-3">
      <p className="text-xs font-black text-[#8b6b35]">{label}</p>
      <p className="mt-1 text-base font-black text-[#071d35]">{showValue(value)}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border border-[#ded2bd] bg-[#fffaf0] p-3 print:p-2">
      <p className="text-[11px] font-black text-[#8b6b35]">{label}</p>
      <p className="mt-1 text-sm font-black text-[#071d35] print:text-xs">{showValue(value)}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-[#ded2bd] bg-[#fffaf0] p-3">
      <p className="text-xs font-black text-[#8b6b35]">{label}</p>
      <p className="mt-1 text-base font-black text-[#071d35]">{showValue(value)}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl bg-[#fffaf0] p-3">
      <p className="text-xs font-black text-[#8b6b35]">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm font-bold text-[#071d35]">
        {showValue(value)}
      </p>
    </div>
  );
}

function AiBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[#ded2bd] bg-[#fffaf0] p-5">
      <h3 className="mb-2 text-sm font-black text-[#071d35]">{title}</h3>
      <div className="whitespace-pre-wrap text-sm leading-8 text-[#3f3a32]">
        {text}
      </div>
    </div>
  );
}