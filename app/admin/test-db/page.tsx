"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type DetailRow = {
  university: string;
  admission_type: string;
  track: string;
  department: string;
  quota: string;
  method: string;
  minimum_score: string;
  exam_date: string;
  competition_rate: string;
  cut_score: string;
  point: string;
};

export default function TestDBPage() {
  const [universities, setUniversities] = useState<string[]>([]);
  const [admissionTypes, setAdmissionTypes] = useState<string[]>([]);
  const [tracks, setTracks] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedAdmissionType, setSelectedAdmissionType] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const [detail, setDetail] = useState<DetailRow | null>(null);

  useEffect(() => {
    loadUniversities();
  }, []);

  async function loadUniversities() {
    const { data, error } = await supabase.rpc("get_unique_universities");

    if (error) {
      console.error("DB ERROR:", error);
      alert(JSON.stringify(error));
      return;
    }

    setUniversities((data || []).map((row: any) => row.university));
  }

  async function loadAdmissionTypes(university: string) {
    const { data, error } = await supabase
      .from("admission_db")
      .select("admission_type")
      .eq("university", university);

    if (error) {
      console.error("DB ERROR:", error);
      alert(JSON.stringify(error));
      return;
    }

    const list = [
      ...new Set((data || []).map((row) => row.admission_type).filter(Boolean)),
    ].sort();

    setAdmissionTypes(list);
  }

  async function loadTracks(university: string, admissionType: string) {
    const { data, error } = await supabase
      .from("admission_db")
      .select("track")
      .eq("university", university)
      .eq("admission_type", admissionType);

    if (error) {
      console.error("DB ERROR:", error);
      alert(JSON.stringify(error));
      return;
    }

    const list = [
      ...new Set((data || []).map((row) => row.track).filter(Boolean)),
    ].sort();

    setTracks(list);
  }

  async function loadDepartments(
    university: string,
    admissionType: string,
    track: string
  ) {
    const { data, error } = await supabase
      .from("admission_db")
      .select("department")
      .eq("university", university)
      .eq("admission_type", admissionType)
      .eq("track", track);

    if (error) {
      console.error("DB ERROR:", error);
      alert(JSON.stringify(error));
      return;
    }

    const list = [
      ...new Set((data || []).map((row) => row.department).filter(Boolean)),
    ].sort();

    setDepartments(list);
  }

  async function loadDetail(
    university: string,
    admissionType: string,
    track: string,
    department: string
  ) {
    const { data, error } = await supabase
      .from("admission_db")
      .select("*")
      .eq("university", university)
      .eq("admission_type", admissionType)
      .eq("track", track)
      .eq("department", department)
      .limit(1)
      .single();

    if (error) {
      console.error("DB ERROR:", error);
      alert(JSON.stringify(error));
      return;
    }

    setDetail(data);
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">수시DB 테스트</h1>

      <div className="space-y-4">
        <select
          value={selectedUniversity}
          onChange={(e) => {
            const value = e.target.value;

            setSelectedUniversity(value);
            setSelectedAdmissionType("");
            setSelectedTrack("");
            setSelectedDepartment("");
            setAdmissionTypes([]);
            setTracks([]);
            setDepartments([]);
            setDetail(null);

            if (value) loadAdmissionTypes(value);
          }}
          className="border p-3 rounded w-full"
        >
          <option value="">대학 선택</option>
          {universities.map((university) => (
            <option key={university} value={university}>
              {university}
            </option>
          ))}
        </select>

        <select
          value={selectedAdmissionType}
          onChange={(e) => {
            const value = e.target.value;

            setSelectedAdmissionType(value);
            setSelectedTrack("");
            setSelectedDepartment("");
            setTracks([]);
            setDepartments([]);
            setDetail(null);

            if (value) loadTracks(selectedUniversity, value);
          }}
          className="border p-3 rounded w-full"
          disabled={!selectedUniversity}
        >
          <option value="">전형 선택</option>
          {admissionTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={selectedTrack}
          onChange={(e) => {
            const value = e.target.value;

            setSelectedTrack(value);
            setSelectedDepartment("");
            setDepartments([]);
            setDetail(null);

            if (value)
              loadDepartments(selectedUniversity, selectedAdmissionType, value);
          }}
          className="border p-3 rounded w-full"
          disabled={!selectedAdmissionType}
        >
          <option value="">계열 선택</option>
          {tracks.map((track) => (
            <option key={track} value={track}>
              {track}
            </option>
          ))}
        </select>

        <select
          value={selectedDepartment}
          onChange={(e) => {
            const value = e.target.value;

            setSelectedDepartment(value);
            setDetail(null);

            if (value)
              loadDetail(
                selectedUniversity,
                selectedAdmissionType,
                selectedTrack,
                value
              );
          }}
          className="border p-3 rounded w-full"
          disabled={!selectedTrack}
        >
          <option value="">모집단위 선택</option>
          {departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 border rounded p-4 bg-gray-50 text-sm">
        <p>대학 수: {universities.length}개</p>
        <p>선택한 대학: {selectedUniversity || "-"}</p>
        <p>선택한 전형: {selectedAdmissionType || "-"}</p>
        <p>선택한 계열: {selectedTrack || "-"}</p>
        <p>선택한 모집단위: {selectedDepartment || "-"}</p>
      </div>

      {detail && (
        <div className="mt-6 border rounded-lg p-5">
          <h2 className="text-xl font-bold mb-4">상세정보</h2>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="모집인원" value={detail.quota} />
            <Info label="전형방법" value={detail.method} />
            <Info label="수능최저" value={detail.minimum_score} />
            <Info label="대학별고사일" value={detail.exam_date} />
            <Info label="경쟁률" value={detail.competition_rate} />
            <Info label="70%컷" value={detail.cut_score} />
            <Info label="1 Point" value={detail.point} />
          </div>
        </div>
      )}
    </main>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border rounded p-3">
      <div className="text-gray-500 text-xs mb-1">{label}</div>
      <div className="font-semibold whitespace-pre-wrap">{value || "-"}</div>
    </div>
  );
}