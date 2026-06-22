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
  track?: string;
  hope_major?: string;
  overall_gpa?: string | number;
  major_gpa?: string | number;
  admission_type?: string;
  strategy_type?: string;
  question?: string;
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
          [
            u.university,
            u.admission,
            u.admission_type,
            u.track,
            u.department,
          ]
            .filter(Boolean)
            .join(" ")
        )
        .join(" ");

      return [
        a.student_name,
        a.school,
        a.grade,
        a.track,
        a.hope_major,
        a.admission_type,
        a.strategy_type,
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
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500 text-2xl font-black text-white shadow-lg">
              K
            </div>
            <p className="text-sm font-semibold text-blue-200">
              강성재교육연구소
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">
              AI 입시 CRM
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              관리자 전용 상담 관리 시스템
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="관리자 비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/90 px-4 py-4 text-center text-lg font-bold outline-none"
            />

            {loginError && (
              <p className="text-center text-sm font-semibold text-red-300">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-2xl bg-blue-500 px-4 py-4 text-lg font-black text-white shadow-lg transition hover:bg-blue-600"
            >
              관리자 로그인
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-bold text-blue-600">
              강성재교육연구소 AI 입시 CRM
            </p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">
              상담 관리자 대시보드
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadData}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              새로고침
            </button>

            <button
              type="button"
              onClick={logout}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
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
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">
                상담 신청 목록
              </h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {filtered.length}명
              </span>
            </div>

            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="학생명, 학교, 대학, 전형 검색"
              className="mb-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
            />

            <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">
              {loading ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                  불러오는 중...
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                  상담 신청이 없습니다.
                </div>
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
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-black text-slate-900">
                              {item.student_name || "이름 없음"}
                            </p>
                            <span
                              className={`rounded-full px-2 py-1 text-[11px] font-black ${
                                done
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {done ? "완료" : "대기"}
                            </span>
                          </div>

                          <p className="mt-1 text-sm font-semibold text-slate-600">
                            {item.school || "-"} · {item.grade || "-"}
                          </p>
                        </div>

                        <p className="text-xs text-slate-400">
                          {formatDate(item.created_at)}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <SmallBadge>{item.track || "계열 없음"}</SmallBadge>
                        <SmallBadge>{item.admission_type || "전형 없음"}</SmallBadge>
                        <SmallBadge>{item.strategy_type || "전략 없음"}</SmallBadge>
                      </div>

                      {universities.length > 0 && (
                        <p className="mt-3 line-clamp-1 text-xs font-bold text-blue-700">
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

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            {!selected ? (
              <div className="flex h-full min-h-[500px] items-center justify-center rounded-3xl bg-slate-50 text-slate-500">
                왼쪽에서 학생을 선택하세요.
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between border-b border-slate-200 pb-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-black text-slate-900">
                        {selected.student_name}
                      </h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          recordMap[selected.id]
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {recordMap[selected.id] ? "상담결과 완료" : "상담결과 대기"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {selected.school} · {selected.grade} · 접수일{" "}
                      {formatDate(selected.created_at)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/admin/consulting/${selected.id}`)
                      }
                      className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700"
                    >
                      상담결과 작성
                    </button>

                    {recordMap[selected.id] && (
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/admin/results/${recordMap[selected.id].id}`)
                        }
                        className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-black"
                      >
                        결과보기
                      </button>
                    )}
                  </div>
                </div>

                <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <InfoCard label="계열" value={selected.track} />
                  <InfoCard label="희망학과" value={selected.hope_major} />
                  <InfoCard label="주력전형" value={selected.admission_type} />
                  <InfoCard label="전교과 내신" value={selected.overall_gpa} />
                  <InfoCard label="주요교과 내신" value={selected.major_gpa} />
                  <InfoCard label="수시/정시 전략" value={selected.strategy_type} />
                </section>

                <UniversityBox universities={selected.desired_universities} />

                <section className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="mb-3 text-lg font-black text-slate-900">
                    상담 질문
                  </h3>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {selected.question || "상담 질문이 없습니다."}
                  </p>
                </section>

                <section className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-5">
                  <h3 className="mb-3 text-lg font-black text-blue-900">
                    다음 작업
                  </h3>
                  <p className="text-sm leading-7 text-blue-900">
                    상담결과 작성 버튼을 누르면 학생 신청서 수정, 6월/9월/11월 성적 입력,
                    상담 메모 저장을 한 번에 진행할 수 있습니다.
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

function UniversityBox({ universities }: { universities: any }) {
  const list = safeArr(universities);

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-900">희망 대학</h3>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
          {list.length}개
        </span>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-slate-500">등록된 희망 대학이 없습니다.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="border border-slate-200 px-3 py-2">번호</th>
                <th className="border border-slate-200 px-3 py-2">대학</th>
                <th className="border border-slate-200 px-3 py-2">전형</th>
                <th className="border border-slate-200 px-3 py-2">계열</th>
                <th className="border border-slate-200 px-3 py-2">모집단위</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u: any, i: number) => (
                <tr key={i} className="text-center">
                  <td className="border border-slate-200 px-3 py-2 text-slate-500">
                    {i + 1}
                  </td>
                  <td className="border border-slate-200 px-3 py-2 font-black text-slate-900">
                    {u.university || "-"}
                  </td>
                  <td className="border border-slate-200 px-3 py-2">
                    {u.admission || u.admission_type || "-"}
                  </td>
                  <td className="border border-slate-200 px-3 py-2">
                    {u.track || "-"}
                  </td>
                  <td className="border border-slate-200 px-3 py-2">
                    {u.department || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StatCard({
  title,
  value,
  desc,
}: {
  title: string;
  value: number;
  desc: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-3 text-4xl font-black text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{desc}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-black text-slate-900">{value || "-"}</p>
    </div>
  );
}

function SmallBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
      {children}
    </span>
  );
}

function formatDate(date: string) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  });
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