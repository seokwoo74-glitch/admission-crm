"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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

type RecordItem = {
  id: string;
  created_at: string;
  student_name: string;
  school: string;
  grade: string;
  class_rank: string;
  admission_type: string;
  extracurricular_needed: string;
  csat_plan: string;
  priority_after_final: string;
  strategy_type: string;
  question: string;
  memo: string;
  universities: UniversityItem[];
};

export default function ResultPage() {
  const params = useParams();
  const id = params.id as string;

  const [record, setRecord] = useState<RecordItem | null>(null);

  useEffect(() => {
    fetchRecord();
  }, []);

async function fetchRecord() {
  const { data, error } = await supabase
    .from("consultation_records")
    .select("*")
    .eq("application_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(error);
    alert("상담결과를 불러오지 못했습니다.");
    return;
  }

  if (!data) {
    alert("저장된 상담결과가 없습니다.");
    return;
  }

  setRecord(data);
}

  function printPdf() {
    window.print();
  }

  if (!record) {
    return <main className="p-8">불러오는 중...</main>;
  }

  const filteredUniversities =
    record.universities?.filter(
      (item) =>
        item.university || item.admission || item.track || item.department
    ) || [];

  return (
    <main className="min-h-screen bg-gray-100 p-6 print:bg-white print:p-0">
      <div className="max-w-6xl mx-auto mb-4 flex justify-between print:hidden">
        <Link href="/admin/results" className="text-blue-600">
          ← 상담결과 목록
        </Link>

        <button
          onClick={printPdf}
          className="bg-black text-white px-5 py-2 rounded"
        >
          PDF 저장
        </button>
      </div>

      <section className="max-w-6xl mx-auto bg-white p-10 shadow rounded print:shadow-none print:rounded-none print:max-w-none">
        <div className="text-center border-b pb-5 mb-6">
          <p className="text-sm text-gray-500">강성재교육연구소</p>
          <h1 className="text-3xl font-bold mt-2">수시지원전략(안)</h1>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm mb-6">
          <Info label="학생명" value={record.student_name} />
          <Info label="학교" value={record.school} />
          <Info label="학년" value={record.grade} />
          <Info label="전교 등수" value={record.class_rank} />
          <Info label="주력전형" value={record.admission_type} />
          <Info label="수능대비" value={record.csat_plan} />
          <Info label="생기부 관리" value={record.extracurricular_needed} />
          <Info label="기말 후 우선순위" value={record.priority_after_final} />
          <Info label="전략 방향" value={record.strategy_type} />
        </div>

        <div className="mb-6">
          <h2 className="font-bold border-b pb-2 mb-3">지원전략 대학 목록</h2>

          {filteredUniversities.length === 0 ? (
            <p className="text-sm text-gray-500">입력된 지원대학이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2 w-10">번호</th>
                    <th className="border p-2">대학명</th>
                    <th className="border p-2">전형명</th>
                    <th className="border p-2">계열</th>
                    <th className="border p-2">모집단위</th>
                    <th className="border p-2">인원</th>
                    <th className="border p-2">수능최저</th>
                    <th className="border p-2">경쟁률</th>
                    <th className="border p-2">70%컷</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUniversities.map((item, index) => (
                    <tr key={index}>
                      <td className="border p-2 text-center">{index + 1}</td>
                      <td className="border p-2">{item.university || "-"}</td>
                      <td className="border p-2">{item.admission || "-"}</td>
                      <td className="border p-2">{item.track || "-"}</td>
                      <td className="border p-2">{item.department || "-"}</td>
                      <td className="border p-2 text-center">
                        {item.quota || "-"}
                      </td>
                      <td className="border p-2 whitespace-pre-wrap">
                        {item.minimum_score || "-"}
                      </td>
                      <td className="border p-2 text-center">
                        {item.competition_rate || "-"}
                      </td>
                      <td className="border p-2 text-center">
                        {item.cut_score || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h2 className="font-bold border-b pb-2 mb-3">상담 전 질문사항</h2>
          <p className="text-sm whitespace-pre-wrap min-h-16">
            {record.question || "-"}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="font-bold border-b pb-2 mb-3">상담 메모</h2>
          <p className="text-sm whitespace-pre-wrap min-h-24">
            {record.memo || "-"}
          </p>
        </div>

        <div className="border-t pt-4 text-xs text-gray-500">
          ※ 상담 결과는 학생의 현재 성적, 학교생활기록부, 모의고사 결과,
          희망 전형을 바탕으로 한 수시 지원전략 참고자료입니다.
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border rounded p-3">
      <div className="text-gray-500 text-xs mb-1">{label}</div>
      <div className="font-semibold">{value || "-"}</div>
    </div>
  );
}