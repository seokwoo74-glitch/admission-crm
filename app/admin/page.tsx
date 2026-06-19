"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Application = {
  id: string;
  student_name: string;
  school: string;
  grade: string;
  question: string;
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
      return;
    }

    setApplications(data || []);
  }

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
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">입시상담 관리자</h1>

        <button
          onClick={logout}
          className="bg-gray-200 px-4 py-2 rounded text-sm font-semibold"
        >
          로그아웃
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h2 className="font-bold mb-4">상담 신청 목록</h2>

          <div className="space-y-2">
            {applications.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelected(item)}
                className="border p-3 rounded cursor-pointer hover:bg-gray-100"
              >
                <div className="font-semibold">{item.student_name}</div>

                <div className="text-sm text-gray-500">
                  {item.school} | {item.grade}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          {!selected ? (
            <div>학생을 선택하세요.</div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-4">
                {selected.student_name}
              </h2>

              <div className="space-y-3">
                <div>
                  <strong>학교</strong>
                  <br />
                  {selected.school}
                </div>

                <div>
                  <strong>학년</strong>
                  <br />
                  {selected.grade}
                </div>

                <div>
                  <strong>질문사항</strong>
                  <br />
                  {selected.question}
                </div>

                <div className="pt-4 flex gap-3">
                  <Link
                    href={`/admin/consulting/${selected.id}`}
                    className="inline-block bg-black text-white px-5 py-3 rounded"
                  >
                    상담결과 작성
                  </Link>

                  <Link
                    href={`/admin/results/${selected.id}`}
                    className="inline-block bg-gray-700 text-white px-5 py-3 rounded"
                  >
                    상담결과 보기
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}