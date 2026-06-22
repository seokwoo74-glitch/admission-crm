"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type DesiredUniversity = {
  university?: string;
  admission?: string;
  track?: string;
  department?: string;
};

type Application = {
  id: string;
  created_at?: string;
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
  desired_universities?: DesiredUniversity[];

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
};

export default function AdminPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);

  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_authed");

    if (saved === "true") {
      setIsAuthed(true);
      fetchApplications();
    }
  }, []);

  async function login() {
    try {
      setChecking(true);

      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "로그인 실패");
        return;
      }

      sessionStorage.setItem("admin_authed", "true");
      setIsAuthed(true);
      fetchApplications();
    } catch (error) {
      console.error(error);
      alert("로그인 중 오류가 발생했습니다.");
    } finally {
      setChecking(false);
    }
  }

  async function logout() {
    await fetch("/api/admin-logout", {
      method: "POST",
    });

    sessionStorage.removeItem("admin_authed");
    setIsAuthed(false);
    setPassword("");
    setSelected(null);
    setApplications([]);
  }

  async function fetchApplications() {
    const { data, error } = await supabase
      .from("consultation_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("신청 목록을 불러오지 못했습니다.");
      return;
    }

    setApplications(data || []);
  }

  const selectedUniversities =
    selected?.desired_universities?.filter(
      (u) => u?.university || u?.admission || u?.track || u?.department
    ) || [];

  if (!isAuthed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white border rounded-xl p-8 w-full max-w-sm shadow">
          <h1 className="text-2xl font-bold mb-2 text-center">
            관리자 로그인
          </h1>

          <p className="text-sm text-gray-500 text-center mb-6">
            강성재교육연구소 입시 CRM
          </p>

          <input
            type="password"
            className="w-full border p-3 rounded mb-4"
            placeholder="관리자 비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") login();
            }}
          />

          <button
            onClick={login}
            disabled={checking}
            className="w-full bg-black text-white py-3 rounded font-bold disabled:bg-gray-400"
          >
            {checking ? "확인 중..." : "로그인"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">강성재교육연구소</p>
          <h1 className="text-3xl font-bold">입시상담 관리자</h1>
        </div>

        <button
          onClick={logout}
          className="bg-gray-200 px-4 py-2 rounded text-sm font-semibold"
        >
          로그아웃
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <div className="border rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">상담 신청 목록</h2>
            <span className="text-sm text-gray-500">{applications.length}건</span>
          </div>

          <div className="space-y-2 max-h-[75vh] overflow-y-auto">
            {applications.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelected(item)}
                className={`border p-3 rounded-xl cursor-pointer hover:bg-gray-100 ${
                  selected?.id === item.id ? "bg-slate-900 text-white" : "bg-white"
                }`}
              >
                <div className="font-semibold">{item.student_name}</div>

                <div
                  className={`text-sm ${
                    selected?.id === item.id ? "text-gray-200" : "text-gray-500"
                  }`}
                >
                  {item.school} | {item.grade}
                </div>

                <div
                  className={`text-xs mt-1 ${
                    selected?.id === item.id ? "text-gray-300" : "text-gray-400"
                  }`}
                >
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString("ko-KR")
                    : ""}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-2xl bg-white p-6 shadow-sm">
          {!selected ? (
            <div className="text-gray-500">학생을 선택하세요.</div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 border-b pb-5 mb-5">
                <div>
                  <p className="text-sm text-gray-500">신청서 상세</p>
                  <h2 className="text-3xl font-bold">
                    {selected.student_name}
                  </h2>
                  <p className="text-gray-500 mt-1">
                    {selected.school} · {selected.grade}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/admin/consulting/${selected.id}`}
                    className="inline-block bg-black text-white px-4 py-3 rounded-xl font-semibold"
                  >
                    상담결과 작성
                  </Link>

                  <Link
                    href={`/admin/results/${selected.id}`}
                    className="inline-block bg-gray-700 text-white px-4 py-3 rounded-xl font-semibold"
                  >
                    상담결과 보기
                  </Link>
                </div>
              </div>

              <Section title="학생 기본정보">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Info label="학생명" value={selected.student_name} />
                  <Info label="학교" value={selected.school} />
                  <Info label="학년" value={selected.grade} />
                  <Info label="졸업년도" value={selected.graduation_year} />
                  <Info label="계열" value={selected.track} />
                  <Info label="학교유형" value={selected.school_type} />
                  <Info label="전교과 내신" value={selected.overall_gpa} />
                  <Info label="주요교과 내신" value={selected.major_gpa} />
                  <Info label="희망학과" value={selected.hope_major} />
                  <Info label="전교 등수" value={selected.class_rank} />
                </div>
              </Section>

              <Section title="상담 전략정보">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Info label="주력전형" value={selected.admission_type} />
                  <Info
                    label="생기부 비교과 관리"
                    value={selected.extracurricular_needed}
                  />
                  <Info label="수능대비" value={selected.csat_plan} />
                  <Info
                    label="기말 후 우선순위"
                    value={selected.priority_after_final}
                  />
                  <Info label="수시/정시 전략" value={selected.strategy_type} />
                  <Info
                    label="2차 전화상담 희망일"
                    value={selected.preferred_call_date}
                  />
                </div>
              </Section>

              <Section title="희망대학 1~9">
                {selectedUniversities.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    입력된 희망대학이 없습니다.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border p-2 w-12">번호</th>
                          <th className="border p-2">대학</th>
                          <th className="border p-2">전형</th>
                          <th className="border p-2">계열</th>
                          <th className="border p-2">모집단위</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUniversities.map((u, i) => (
                          <tr key={i}>
                            <td className="border p-2 text-center">{i + 1}</td>
                            <td className="border p-2">{u.university || "-"}</td>
                            <td className="border p-2">{u.admission || "-"}</td>
                            <td className="border p-2">{u.track || "-"}</td>
                            <td className="border p-2">{u.department || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>

              <Section title="6월 평가원 성적">
                <div className="space-y-3">
                  <ScoreRow
                    subject="국어"
                    type={selected.june_korean_type}
                    score={selected.june_korean_score}
                    percentile={selected.june_korean_percentile}
                    grade={selected.june_korean_grade}
                  />
                  <ScoreRow
                    subject="수학"
                    type={selected.june_math_type}
                    score={selected.june_math_score}
                    percentile={selected.june_math_percentile}
                    grade={selected.june_math_grade}
                  />
                  <div className="grid grid-cols-5 gap-2 text-sm">
                    <div className="font-bold">영어</div>
                    <div className="col-span-4 border rounded p-2">
                      등급: {selected.june_english_grade || "-"}
                    </div>
                  </div>
                  <ScoreRow
                    subject="탐구1"
                    type={selected.june_tamgu1_type}
                    score={selected.june_tamgu1_score}
                    percentile={selected.june_tamgu1_percentile}
                    grade={selected.june_tamgu1_grade}
                  />
                  <ScoreRow
                    subject="탐구2"
                    type={selected.june_tamgu2_type}
                    score={selected.june_tamgu2_score}
                    percentile={selected.june_tamgu2_percentile}
                    grade={selected.june_tamgu2_grade}
                  />
                </div>
              </Section>

              <Section title="상담 전 질문사항">
                <div className="border rounded-xl p-4 min-h-24 whitespace-pre-wrap">
                  {selected.question || "-"}
                </div>
              </Section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <h3 className="font-bold text-lg mb-3 border-b pb-2">{title}</h3>
      {children}
    </section>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border rounded-xl p-3 bg-slate-50">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="font-semibold whitespace-pre-wrap">{value || "-"}</div>
    </div>
  );
}

function ScoreRow({
  subject,
  type,
  score,
  percentile,
  grade,
}: {
  subject: string;
  type?: string;
  score?: string;
  percentile?: string;
  grade?: string;
}) {
  return (
    <div className="grid grid-cols-5 gap-2 text-sm">
      <div className="font-bold">{subject}</div>
      <div className="border rounded p-2">선택: {type || "-"}</div>
      <div className="border rounded p-2">원점수: {score || "-"}</div>
      <div className="border rounded p-2">백분위: {percentile || "-"}</div>
      <div className="border rounded p-2">등급: {grade || "-"}</div>
    </div>
  );
}