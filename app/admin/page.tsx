"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Application = {
  id: string;
  created_at: string;
  student_name: string;
  school: string;
  grade: string;
  student_phone?: string;
  parent_phone?: string;
  referral?: string;
  graduation_year?: string;
  track?: string;
  school_type?: string;
  hope_major?: string;
  overall_gpa?: string | number;
  major_gpa?: string | number;
  class_rank?: string | number;
  admission_type?: string;
  extracurricular_needed?: string;
  csat_plan?: string;
  priority_after_final?: string;
  strategy_type?: string;
  preferred_call_date?: string;
  question?: string;
  june_scores?: any;
  desired_universities?: any;
};

type RecordItem = {
  id: string;
  application_id?: string;
  created_at: string;
  student_name?: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [keyword, setKeyword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setLoginError("비밀번호가 맞지 않습니다.");
        return;
      }

      setLoggedIn(true);
      loadData();
    } catch (err) {
      console.error(err);
      setLoginError("로그인 중 오류가 발생했습니다.");
    }
  }

  async function loadData() {
    setLoading(true);

    const { data: apps, error: appError } = await supabase
      .from("consultation_applications")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: recs, error: recError } = await supabase
      .from("consultation_records")
      .select("id, application_id, created_at, student_name")
      .order("created_at", { ascending: false });

    if (appError) console.error(appError);
    if (recError) console.error(recError);

    const appList = apps || [];
    setApplications(appList);
    setRecords(recs || []);
    setSelected(appList[0] || null);

    setLoading(false);
  }

  function logout() {
    localStorage.removeItem("admin_login_ok");
    setLoggedIn(false);
    setPassword("");
  }

  const recordMap = useMemo(() => {
    const map: Record<string, RecordItem> = {};
    records.forEach((r) => {
      if (r.application_id && !map[r.application_id]) {
        map[r.application_id] = r;
      }
    });
    return map;
  }, [records]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return applications;

    return applications.filter((a) => {
      const universities = safeArr(a.desired_universities)
        .map((u: any) =>
          [u.university, u.admission, u.admission_type, u.track, u.department]
            .filter(Boolean)
            .join(" ")
        )
        .join(" ");

      return [
        a.student_name,
        a.school,
        a.grade,
        a.student_phone,
        a.parent_phone,
        a.referral,
        a.track,
        a.hope_major,
        a.admission_type,
        a.strategy_type,
        a.preferred_call_date,
        universities,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [applications, keyword]);

  const completedCount = applications.filter((a) => recordMap[a.id]).length;
  const waitingCount = applications.length - completedCount;

  if (!loggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3efe7] px-4">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#d9cdb8] bg-[#fffdf8] shadow-2xl">
          <div className="bg-[#061a31] px-8 py-9 text-center">
            <p className="text-sm font-bold tracking-[0.25em] text-[#d6ad67]">
              KANG&apos;S EDU LAB
            </p>
            <h1 className="mt-3 text-3xl font-black text-white">
              관리자 로그인
            </h1>
            <p className="mt-2 text-sm text-white/70">
              강성재교육연구소 입시 컨설팅 CRM
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 px-8 py-8">
            <input
              type="password"
              placeholder="관리자 비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[#cfc2ab] bg-white px-4 py-4 text-center text-lg font-bold outline-none transition focus:border-[#b78b45] focus:ring-2 focus:ring-[#d6ad67]/25"
            />

            {loginError && (
              <p className="text-center text-sm font-bold text-red-600">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#c89b55] px-4 py-4 text-lg font-black text-white shadow-lg transition hover:bg-[#b98b45]"
            >
              로그인
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3efe7] text-[#111827]">
      <div className="border-b border-[#d9cdb8] bg-[#fffdf8]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-[#8b6b35]">
              KANG&apos;S EDU LAB
            </p>
            <h1 className="mt-2 text-3xl font-black text-[#071d35]">
              상담 관리자 대시보드
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadData}
              className="rounded-xl border border-[#cfc2ab] bg-white px-4 py-2 text-sm font-bold text-[#071d35] hover:bg-[#fffaf0]"
            >
              새로고침
            </button>

            <button
              type="button"
              onClick={logout}
              className="rounded-xl bg-[#061a31] px-4 py-2 text-sm font-bold text-white"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard title="전체 신청" value={applications.length} desc="누적 상담 신청" />
          <StatCard title="결과 작성 완료" value={completedCount} desc="상담결과 저장됨" />
          <StatCard title="작성 대기" value={waitingCount} desc="상담결과 미작성" />
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
          <div className="rounded-2xl border border-[#d9cdb8] bg-[#fffdf8] p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-[#071d35]">
                상담 신청 목록
              </h2>
              <span className="rounded-full bg-[#061a31] px-3 py-1 text-xs font-black text-white">
                {filtered.length}명
              </span>
            </div>

            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="학생명, 학교, 전화번호, 대학, 전형 검색"
              className="mb-4 w-full rounded-xl border border-[#cfc2ab] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#b78b45] focus:ring-2 focus:ring-[#d6ad67]/25"
            />

            <div className="max-h-[720px] space-y-3 overflow-y-auto pr-1">
              {loading ? (
                <EmptyMessage>불러오는 중...</EmptyMessage>
              ) : filtered.length === 0 ? (
                <EmptyMessage>상담 신청이 없습니다.</EmptyMessage>
              ) : (
                filtered.map((item) => {
                  const done = !!recordMap[item.id];
                  const active = selected?.id === item.id;
                  const universities = safeArr(item.desired_universities);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelected(item)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        active
                          ? "border-[#c89b55] bg-[#fff3dc] shadow-md"
                          : "border-[#ded2bd] bg-white hover:bg-[#fffaf0]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-black text-[#071d35]">
                              {item.student_name || "이름 없음"}
                            </p>
                            <StatusBadge done={done} />
                          </div>

                          <p className="mt-1 text-sm font-semibold text-[#5f5a52]">
                            {item.school || "-"} · {item.grade || "-"}
                          </p>
                        </div>

                        <p className="text-xs font-bold text-[#8b6b35]">
                          {formatDate(item.created_at)}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <SmallBadge>{item.track || "계열 없음"}</SmallBadge>
                        <SmallBadge>{item.admission_type || "전형 없음"}</SmallBadge>
                        <SmallBadge>{item.preferred_call_date || "2차상담일 없음"}</SmallBadge>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-1 text-xs font-bold text-[#5f5a52]">
                        <p>학생: {item.student_phone || "-"}</p>
                        <p>학부모: {item.parent_phone || "-"}</p>
                        <p>소개자: {item.referral || "-"}</p>
                      </div>

                      {universities.length > 0 && (
                        <p className="mt-3 line-clamp-1 text-xs font-black text-[#8b6b35]">
                          희망대학:{" "}
                          {universities
                            .map((u: any) => u.university)
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#d9cdb8] bg-[#fffdf8] p-6 shadow-xl">
            {!selected ? (
              <div className="flex h-full min-h-[500px] items-center justify-center rounded-2xl bg-[#fffaf0] text-[#5f5a52]">
                왼쪽에서 학생을 선택하세요.
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4 border-b border-[#ded2bd] pb-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-3xl font-black text-[#071d35]">
                        {selected.student_name}
                      </h2>
                      <StatusBadge done={!!recordMap[selected.id]} large />
                    </div>

                    <p className="mt-2 text-sm font-semibold text-[#5f5a52]">
                      {selected.school} · {selected.grade} · 접수일{" "}
                      {formatDate(selected.created_at)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/consulting/${selected.id}`)}
                      className="rounded-xl bg-[#c89b55] px-4 py-3 text-sm font-black text-white hover:bg-[#b98b45]"
                    >
                      상담결과 작성
                    </button>

                    {recordMap[selected.id] && (
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/admin/results/${recordMap[selected.id].id}`)
                        }
                        className="rounded-xl bg-[#061a31] px-4 py-3 text-sm font-black text-white hover:bg-[#0b294c]"
                      >
                        결과보기
                      </button>
                    )}
                  </div>
                </div>

                <SectionTitle number="01" title="학생 정보" />
                <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <InfoCard label="학생 전화번호" value={selected.student_phone} />
                  <InfoCard label="학부모 전화번호" value={selected.parent_phone} />
                  <InfoCard label="소개자" value={selected.referral} />
                  <InfoCard label="계열" value={selected.track} />
                  <InfoCard label="학교유형" value={selected.school_type} />
                  <InfoCard label="졸업년도" value={selected.graduation_year} />
                  <InfoCard label="희망학과" value={selected.hope_major} />
                  <InfoCard label="전교과 내신" value={selected.overall_gpa} />
                  <InfoCard label="주요교과 내신" value={selected.major_gpa} />
                  <InfoCard label="전교 등수" value={selected.class_rank} />
                  <InfoCard label="주력전형" value={selected.admission_type} />
                  <InfoCard label="2차전화상담일" value={selected.preferred_call_date} />
                  <InfoCard label="생기부 비교과 관리" value={selected.extracurricular_needed} />
                  <InfoCard label="수능대비" value={selected.csat_plan} />
                  <InfoCard label="수시/정시 전략" value={selected.strategy_type} />
                  <InfoCard label="기말 후 최우선 순위" value={selected.priority_after_final} />
                </section>

                <SectionTitle number="02" title="6월 모의고사 성적" />
                <ScoreBox scores={selected.june_scores} />

                <SectionTitle number="03" title="희망 대학" />
                <UniversityBox universities={selected.desired_universities} />

                <SectionTitle number="04" title="상담 요청사항" />
                <section className="rounded-2xl border border-[#ded2bd] bg-[#fffaf0] p-5">
                  <p className="whitespace-pre-wrap text-sm font-medium leading-7 text-[#3f3a32]">
                    {selected.question || "상담 질문이 없습니다."}
                  </p>
                </section>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <h3 className="mb-4 mt-8 text-2xl font-black text-[#071d35]">
      <span className="text-[#8b6b35]">{number}.</span> {title}
    </h3>
  );
}

function ScoreBox({ scores }: { scores: any }) {
  const s = safeObj(scores);

  const rows = [
    {
      title: "국어",
      values: [
        s.koreanSubject || "-",
        scoreText(s.koreanScore, "점"),
        scoreText(s.koreanPercentile, "백분위"),
        scoreText(s.koreanGrade, "등급"),
      ],
    },
    {
      title: "수학",
      values: [
        s.mathSubject || "-",
        scoreText(s.mathScore, "점"),
        scoreText(s.mathPercentile, "백분위"),
        scoreText(s.mathGrade, "등급"),
      ],
    },
    {
      title: "영어",
      values: [scoreText(s.englishGrade, "등급"), "-", "-", "-"],
    },
    {
      title: "탐구1",
      values: [
        s.inquiry1Subject || "-",
        scoreText(s.inquiry1Score, "점"),
        scoreText(s.inquiry1Percentile, "백분위"),
        scoreText(s.inquiry1Grade, "등급"),
      ],
    },
    {
      title: "탐구2",
      values: [
        s.inquiry2Subject || "-",
        scoreText(s.inquiry2Score, "점"),
        scoreText(s.inquiry2Percentile, "백분위"),
        scoreText(s.inquiry2Grade, "등급"),
      ],
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-[#ded2bd]">
      {rows.map((row) => (
        <div
          key={row.title}
          className="grid border-b border-[#ded2bd] last:border-b-0 md:grid-cols-[90px_1fr_1fr_1fr_1fr]"
        >
          <div className="flex items-center justify-center bg-[#061a31] px-3 py-3 text-sm font-black text-white">
            {row.title}
          </div>
          {row.values.map((v, i) => (
            <div
              key={i}
              className="border-t border-[#ded2bd] bg-[#fffaf0] px-3 py-3 text-center text-sm font-bold text-[#172b43] md:border-l md:border-t-0"
            >
              {v}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function UniversityBox({ universities }: { universities: any }) {
  const list = safeArr(universities);

  if (list.length === 0) {
    return (
      <section className="rounded-2xl border border-[#ded2bd] bg-[#fffaf0] p-5 text-sm font-bold text-[#5f5a52]">
        등록된 희망 대학이 없습니다.
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#ded2bd]">
      <table className="w-full text-sm">
        <thead className="bg-[#061a31] text-white">
          <tr>
            <th className="px-3 py-3">번호</th>
            <th className="px-3 py-3">대학</th>
            <th className="px-3 py-3">전형</th>
            <th className="px-3 py-3">계열</th>
            <th className="px-3 py-3">모집단위</th>
          </tr>
        </thead>
        <tbody>
          {list.map((u: any, i: number) => (
            <tr key={i} className="bg-[#fffaf0] text-center">
              <td className="border-t border-[#ded2bd] px-3 py-3 font-black text-[#8b6b35]">
                {i + 1}
              </td>
              <td className="border-t border-[#ded2bd] px-3 py-3 font-black text-[#071d35]">
                {u.university || "-"}
              </td>
              <td className="border-t border-[#ded2bd] px-3 py-3 font-bold">
                {u.admission || u.admission_type || "-"}
              </td>
              <td className="border-t border-[#ded2bd] px-3 py-3 font-bold">
                {u.track || "-"}
              </td>
              <td className="border-t border-[#ded2bd] px-3 py-3 font-bold">
                {u.department || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function StatCard({ title, value, desc }: { title: string; value: number; desc: string }) {
  return (
    <div className="rounded-2xl border border-[#d9cdb8] bg-[#fffdf8] p-6 shadow-xl">
      <p className="text-sm font-black text-[#8b6b35]">{title}</p>
      <p className="mt-3 text-4xl font-black text-[#071d35]">{value}</p>
      <p className="mt-2 text-sm font-semibold text-[#5f5a52]">{desc}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-[#ded2bd] bg-[#fffaf0] p-4">
      <p className="text-xs font-black text-[#8b6b35]">{label}</p>
      <p className="mt-2 text-base font-black text-[#071d35]">{value || "-"}</p>
    </div>
  );
}

function SmallBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-bold text-[#5f5a52] ring-1 ring-[#ded2bd]">
      {children}
    </span>
  );
}

function StatusBadge({ done, large }: { done: boolean; large?: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 font-black ${
        large ? "text-xs" : "text-[11px]"
      } ${
        done
          ? "bg-emerald-100 text-emerald-700"
          : "bg-[#fff3dc] text-[#8b6b35] ring-1 ring-[#d6ad67]"
      }`}
    >
      {done ? "완료" : "대기"}
    </span>
  );
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[#fffaf0] p-6 text-center text-sm font-bold text-[#5f5a52]">
      {children}
    </div>
  );
}

function formatDate(date: string) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  });
}

function scoreText(value: any, suffix: string) {
  if (value === undefined || value === null || value === "") return "-";
  return `${value}${suffix}`;
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
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}