"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type RecordItem = {
  id: string;
  created_at: string;
  student_name: string;
  school: string;
  grade: string;
  admission_type: string;
  csat_plan: string;
};

export default function ResultsPage() {
  const [records, setRecords] = useState<RecordItem[]>([]);

  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    const { data, error } = await supabase
      .from("consultation_records")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("상담결과를 불러오지 못했습니다.");
      return;
    }

    setRecords(data || []);
  }

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">상담결과 목록</h1>

      <div className="mb-4">
        <Link href="/admin" className="text-blue-600">
          ← 관리자 메인으로
        </Link>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">학생명</th>
              <th className="p-3 text-left">학교</th>
              <th className="p-3 text-left">학년</th>
              <th className="p-3 text-left">주력전형</th>
              <th className="p-3 text-left">수능전략</th>
              <th className="p-3 text-left">결과</th>
            </tr>
          </thead>

          <tbody>
            {records.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3">{item.student_name}</td>
                <td className="p-3">{item.school}</td>
                <td className="p-3">{item.grade}</td>
                <td className="p-3">{item.admission_type}</td>
                <td className="p-3">{item.csat_plan}</td>
                <td className="p-3">
                  <Link
                    href={`/admin/results/${item.id}`}
                    className="text-blue-600 font-semibold"
                  >
                    결과 보기
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}