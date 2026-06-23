"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type AdmissionRow = {
  id: number;
  university: string;
  admission_type: string;
  track: string;
  department: string;
};

type DesiredUniversity = {
  university: string;
  admission: string;
  track: string;
  department: string;
};

const emptyDesired: DesiredUniversity = {
  university: "",
  admission: "",
  track: "",
  department: "",
};

const emptyScores = {
  koreanSubject: "",
  koreanScore: "",
  koreanPercentile: "",
  koreanGrade: "",
  mathSubject: "",
  mathScore: "",
  mathPercentile: "",
  mathGrade: "",
  englishGrade: "",
  inquiry1Subject: "",
  inquiry1Score: "",
  inquiry1Percentile: "",
  inquiry1Grade: "",
  inquiry2Subject: "",
  inquiry2Score: "",
  inquiry2Percentile: "",
  inquiry2Grade: "",
};

const inquirySubjects = [
  "물1", "화1", "생1", "지1", "물2", "화2", "생2", "지2",
  "생윤", "사문", "윤사", "한지", "세지", "동사", "세사", "정법", "경제",
];

export default function HomePage() {
  const [studentName, setStudentName] = useState("");
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [referral, setReferral] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [track, setTrack] = useState("");
  const [schoolType, setSchoolType] = useState("");
  const [overallGpa, setOverallGpa] = useState("");
  const [majorGpa, setMajorGpa] = useState("");
  const [hopeMajor, setHopeMajor] = useState("");
  const [classRank, setClassRank] = useState("");
  const [admissionType, setAdmissionType] = useState("");
  const [extracurricularNeeded, setExtracurricularNeeded] = useState("");
  const [csatPlan, setCsatPlan] = useState("");
  const [priorityAfterFinal, setPriorityAfterFinal] = useState("");
  const [strategyType, setStrategyType] = useState("");
  const [preferredCallDate, setPreferredCallDate] = useState("");
  const [question, setQuestion] = useState("");
  const [juneScores, setJuneScores] = useState({ ...emptyScores });

  const [admissionRows, setAdmissionRows] = useState<AdmissionRow[]>([]);
  const [desiredUniversities, setDesiredUniversities] = useState<DesiredUniversity[]>([
    { ...emptyDesired },
  ]);

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function loadAdmissionDb() {
      const pageSize = 1000;
      let from = 0;
      let allRows: AdmissionRow[] = [];

      while (true) {
        const { data, error } = await supabase
          .from("admission_db")
          .select("id, university, admission_type, track, department")
          .order("university", { ascending: true })
          .range(from, from + pageSize - 1);

        if (error) {
          console.error(error);
          break;
        }

        if (!data || data.length === 0) break;

        allRows = [...allRows, ...data];

        if (data.length < pageSize) break;
        from += pageSize;
      }

      setAdmissionRows(allRows);
    }

    loadAdmissionDb();
  }, []);

  const universities = useMemo(() => {
    return Array.from(
      new Set(admissionRows.map((row) => row.university).filter(Boolean))
    ).sort();
  }, [admissionRows]);

  function getAdmissions(university: string) {
    return Array.from(
      new Set(
        admissionRows
          .filter((row) => row.university === university)
          .map((row) => row.admission_type)
          .filter(Boolean)
      )
    ).sort();
  }

  function getTracks(university: string, admission: string) {
    return Array.from(
      new Set(
        admissionRows
          .filter(
            (row) =>
              row.university === university &&
              row.admission_type === admission
          )
          .map((row) => row.track)
          .filter(Boolean)
      )
    ).sort();
  }

  function getDepartments(university: string, admission: string, selectedTrack: string) {
    return Array.from(
      new Set(
        admissionRows
          .filter(
            (row) =>
              row.university === university &&
              row.admission_type === admission &&
              row.track === selectedTrack
          )
          .map((row) => row.department)
          .filter(Boolean)
      )
    ).sort();
  }

  function updateDesiredUniversity(
    index: number,
    key: keyof DesiredUniversity,
    value: string
  ) {
    setDesiredUniversities((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };

      if (key === "university") {
        next[index].admission = "";
        next[index].track = "";
        next[index].department = "";
      }

      if (key === "admission") {
        next[index].track = "";
        next[index].department = "";
      }

      if (key === "track") {
        next[index].department = "";
      }

      return next;
    });
  }

  function updateJuneScore(key: keyof typeof emptyScores, value: string) {
    setJuneScores((prev) => ({ ...prev, [key]: value }));
  }

  function addDesiredUniversity() {
    if (desiredUniversities.length >= 9) return;
    setDesiredUniversities((prev) => [...prev, { ...emptyDesired }]);
  }

  function removeDesiredUniversity(index: number) {
    setDesiredUniversities((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!studentName.trim() || !school.trim() || !grade.trim()) {
      alert("학생 이름, 학교, 학년은 필수입니다.");
      return;
    }

    setLoading(true);

    const cleanedDesiredUniversities = desiredUniversities.filter(
      (item) => item.university || item.admission || item.track || item.department
    );

    const payload = {
      student_name: studentName.trim(),
      school: school.trim(),
      grade: grade.trim(),
      student_phone: studentPhone.trim(),
      parent_phone: parentPhone.trim(),
      referral: referral.trim(),
      graduation_year: graduationYear.trim(),
      track,
      school_type: schoolType,
      overall_gpa: overallGpa.trim(),
      major_gpa: majorGpa.trim(),
      hope_major: hopeMajor.trim(),
      class_rank: classRank.trim(),
      admission_type: admissionType,
      extracurricular_needed: extracurricularNeeded,
      csat_plan: csatPlan,
      priority_after_final: priorityAfterFinal,
      strategy_type: strategyType,
      preferred_call_date: preferredCallDate.trim(),
      question: question.trim(),
      june_scores: juneScores,
      desired_universities: cleanedDesiredUniversities,
    };

    const { error } = await supabase
      .from("consultation_applications")
      .insert(payload);

    setLoading(false);

    if (error) {
      console.error(error);
      alert("신청 저장 중 오류가 발생했습니다.");
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <main className="min-h-screen bg-[#f3efe7] px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#d8c8ad] bg-white p-10 text-center shadow-2xl">
          <h1 className="text-2xl font-black text-[#071d35]">
            상담 신청이 완료되었습니다.
          </h1>
          <p className="mt-4 text-[#5f5a52]">
            입력해주신 내용을 바탕으로 담당 연구원이 상담 준비 후 연락드리겠습니다.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3efe7] px-4 py-8 text-[#111827]">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-[#d9cdb8] bg-[#fffdf8] shadow-2xl"
      >
        <div className="flex items-start justify-between px-8 py-7 md:px-12">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-[#071d35]">
              강성재교육연구소
            </h2>
            <p className="mt-1 text-xs font-semibold tracking-[0.2em] text-[#7a6a50]">
              GANG SUNG JAE EDUCATION INSTITUTE
            </p>
          </div>

          <p className="hidden max-w-xs text-right text-sm font-semibold leading-6 text-[#5f5a52] md:block">
            학생 개개인의 가능성을 발견하고,<br />
            최적의 입시 전략을 함께 설계합니다.
          </p>
        </div>

        <div className="relative bg-[#061a31] px-8 py-10 md:px-12">
          <div className="absolute inset-0 opacity-10">
            <div className="h-full w-full bg-[radial-gradient(circle_at_80%_20%,#ffffff_0,transparent_28%)]" />
          </div>
          <div className="relative">
            <h1 className="text-4xl font-black tracking-tight text-[#d6ad67] md:text-5xl">
              입시 컨설팅 신청서
            </h1>
            <p className="mt-4 text-base font-medium text-white/90">
              정확한 정보 입력이 맞춤형 입시 전략 수립의 첫걸음입니다.
            </p>
          </div>
        </div>

        <div className="px-8 py-8 md:px-12">
          <SectionTitle number="01" title="학생 기본 정보" />

          <div className="grid gap-4 md:grid-cols-3">
            <Input label="학생 이름 *" value={studentName} setValue={setStudentName} placeholder="학생 이름을 입력하세요" />
            <Input label="학교 *" value={school} setValue={setSchool} placeholder="학교명을 입력하세요" />
            <Input label="학년 *" value={grade} setValue={setGrade} placeholder="학년을 입력하세요" />

            <Input label="학생 전화번호" value={studentPhone} setValue={setStudentPhone} placeholder="010-0000-0000" />
            <Input label="학부모 전화번호" value={parentPhone} setValue={setParentPhone} placeholder="010-0000-0000" />
            <Input label="소개자" value={referral} setValue={setReferral} placeholder="소개자 이름 또는 경로" />

            <Input label="졸업년도" value={graduationYear} setValue={setGraduationYear} placeholder="예) 2026" />
            <Select label="계열" value={track} setValue={setTrack} options={["인문", "자연", "예체능"]} />
            <Select label="학교유형" value={schoolType} setValue={setSchoolType} options={["일반고", "자사고", "특목고", "특성화고", "기타"]} />

            <Input label="전교과 내신" value={overallGpa} setValue={setOverallGpa} placeholder="예) 2.15" />
            <Input label="주요교과 내신" value={majorGpa} setValue={setMajorGpa} placeholder="예) 1.85" />
            <Input label="희망학과" value={hopeMajor} setValue={setHopeMajor} placeholder="희망하는 학과를 입력하세요" />

            <Input label="전교 등수" value={classRank} setValue={setClassRank} placeholder="예) 25 / 300" />
            <Select label="주력전형" value={admissionType} setValue={setAdmissionType} options={["교과전형", "종합전형", "논술전형", "지역인재", "지역의사제", "농어촌", "기회균형"]} />
            <Select label="생기부 비교과 관리" value={extracurricularNeeded} setValue={setExtracurricularNeeded} options={["관리한다", "관리하지 않는다", "상담 후 결정"]} />

            <Select label="수능대비" value={csatPlan} setValue={setCsatPlan} options={["전과목대비", "최저만 대비", "안함"]} />
            <Select label="3-1 기말 후 최우선 순위" value={priorityAfterFinal} setValue={setPriorityAfterFinal} options={["생기부", "수능대비", "논술", "면접"]} />
            <Select label="수시/정시 전략" value={strategyType} setValue={setStrategyType} options={["수시에 끝낸다", "정시까지 고려", "상담 후 결정"]} />

            <Input label="2차전화상담일" value={preferredCallDate} setValue={setPreferredCallDate} placeholder="예) 9월 4,5,6 중 택1" />
          </div>

          <Divider />

          <SectionTitle number="02" title="6월 모의고사 성적" />

          <div className="overflow-hidden rounded-xl border border-[#ded2bd]">
            <ScoreRow title="국어">
              <Select small label="국어 선택" value={juneScores.koreanSubject} setValue={(v) => updateJuneScore("koreanSubject", v)} options={["화작", "언매"]} />
              <Input small label="국어 원점수" value={juneScores.koreanScore} setValue={(v) => updateJuneScore("koreanScore", v)} />
              <Input small label="국어 백분위" value={juneScores.koreanPercentile} setValue={(v) => updateJuneScore("koreanPercentile", v)} />
              <Input small label="국어 등급" value={juneScores.koreanGrade} setValue={(v) => updateJuneScore("koreanGrade", v)} />
            </ScoreRow>

            <ScoreRow title="수학">
              <Select small label="수학 선택" value={juneScores.mathSubject} setValue={(v) => updateJuneScore("mathSubject", v)} options={["미적", "기하", "확통"]} />
              <Input small label="수학 원점수" value={juneScores.mathScore} setValue={(v) => updateJuneScore("mathScore", v)} />
              <Input small label="수학 백분위" value={juneScores.mathPercentile} setValue={(v) => updateJuneScore("mathPercentile", v)} />
              <Input small label="수학 등급" value={juneScores.mathGrade} setValue={(v) => updateJuneScore("mathGrade", v)} />
            </ScoreRow>

            <ScoreRow title="영어">
              <Input small label="영어 등급" value={juneScores.englishGrade} setValue={(v) => updateJuneScore("englishGrade", v)} />
              <EmptyCell />
              <EmptyCell />
              <EmptyCell />
            </ScoreRow>

            <ScoreRow title="탐구1">
              <Select small label="탐구1 과목" value={juneScores.inquiry1Subject} setValue={(v) => updateJuneScore("inquiry1Subject", v)} options={inquirySubjects} />
              <Input small label="탐구1 원점수" value={juneScores.inquiry1Score} setValue={(v) => updateJuneScore("inquiry1Score", v)} />
              <Input small label="탐구1 백분위" value={juneScores.inquiry1Percentile} setValue={(v) => updateJuneScore("inquiry1Percentile", v)} />
              <Input small label="탐구1 등급" value={juneScores.inquiry1Grade} setValue={(v) => updateJuneScore("inquiry1Grade", v)} />
            </ScoreRow>

            <ScoreRow title="탐구2">
              <Select small label="탐구2 과목" value={juneScores.inquiry2Subject} setValue={(v) => updateJuneScore("inquiry2Subject", v)} options={inquirySubjects} />
              <Input small label="탐구2 원점수" value={juneScores.inquiry2Score} setValue={(v) => updateJuneScore("inquiry2Score", v)} />
              <Input small label="탐구2 백분위" value={juneScores.inquiry2Percentile} setValue={(v) => updateJuneScore("inquiry2Percentile", v)} />
              <Input small label="탐구2 등급" value={juneScores.inquiry2Grade} setValue={(v) => updateJuneScore("inquiry2Grade", v)} />
            </ScoreRow>
          </div>

          <Divider />

          <div className="mb-4 flex items-center justify-between">
            <SectionTitle number="03" title="희망 대학" noMargin />
            <button
              type="button"
              onClick={addDesiredUniversity}
              disabled={desiredUniversities.length >= 9}
              className="rounded-lg bg-[#061a31] px-4 py-2 text-sm font-bold text-white shadow-md disabled:bg-gray-300"
            >
              + 대학 추가
            </button>
          </div>

          <div className="space-y-3">
            {desiredUniversities.map((item, index) => (
              <div key={index} className="grid gap-3 rounded-xl border border-[#ded2bd] bg-[#fffaf0] p-3 md:grid-cols-[44px_1fr_1fr_1fr_1fr_50px]">
                <div className="flex h-10 items-center justify-center rounded-lg bg-[#061a31] text-sm font-black text-white">
                  {index + 1}
                </div>
                <Select label="대학" value={item.university} setValue={(v) => updateDesiredUniversity(index, "university", v)} options={universities} />
                <Select label="전형" value={item.admission} setValue={(v) => updateDesiredUniversity(index, "admission", v)} options={getAdmissions(item.university)} />
                <Select label="계열" value={item.track} setValue={(v) => updateDesiredUniversity(index, "track", v)} options={getTracks(item.university, item.admission)} />
                <Select label="모집단위" value={item.department} setValue={(v) => updateDesiredUniversity(index, "department", v)} options={getDepartments(item.university, item.admission, item.track)} />
                <button type="button" onClick={() => removeDesiredUniversity(index)} className="text-sm font-bold text-[#8a4b32]">
                  삭제
                </button>
              </div>
            ))}
          </div>

          <Divider />

          <SectionTitle number="04" title="상담 요청사항" />

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-[#cfc2ab] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#b78b45] focus:ring-2 focus:ring-[#d6ad67]/25"
            placeholder="궁금한 점이나 상담받고 싶은 내용을 자유롭게 적어주세요."
          />

          <div className="mt-8 flex flex-col gap-4 rounded-xl bg-[#061a31] p-5 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-medium leading-6 text-white/85">
              입력하신 정보는 상담 목적 외에 사용되지 않으며,<br />
              안전하게 관리됩니다.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#c89b55] px-10 py-4 text-lg font-black text-white shadow-lg transition hover:bg-[#b98b45] disabled:bg-gray-400"
            >
              {loading ? "저장 중..." : "상담 신청하기 〉"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

function SectionTitle({
  number,
  title,
  noMargin,
}: {
  number: string;
  title: string;
  noMargin?: boolean;
}) {
  return (
    <h2 className={`${noMargin ? "" : "mb-5"} text-2xl font-black text-[#071d35]`}>
      <span className="text-[#8b6b35]">{number}.</span> {title}
    </h2>
  );
}

function Divider() {
  return <div className="my-8 border-t border-[#ded2bd]" />;
}

function EmptyCell() {
  return <div className="hidden md:block" />;
}

function ScoreRow({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid border-b border-[#ded2bd] last:border-b-0 md:grid-cols-[80px_1fr_1fr_1fr_1fr]">
      <div className="flex items-center justify-center bg-[#061a31] px-3 py-4 text-sm font-black text-white">
        {title}
      </div>
      <div className="grid gap-3 bg-[#fffaf0] p-3 md:col-span-4 md:grid-cols-4">
        {children}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  setValue,
  placeholder,
  small,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
  small?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-[#172b43]">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-[#cfc2ab] bg-white outline-none transition focus:border-[#b78b45] focus:ring-2 focus:ring-[#d6ad67]/25 ${
          small ? "px-3 py-2 text-sm" : "px-4 py-3 text-sm"
        }`}
      />
    </label>
  );
}

function Select({
  label,
  value,
  setValue,
  options,
  small,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  options: string[];
  small?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-[#172b43]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`w-full rounded-lg border border-[#cfc2ab] bg-white outline-none transition focus:border-[#b78b45] focus:ring-2 focus:ring-[#d6ad67]/25 ${
          small ? "px-3 py-2 text-sm" : "px-4 py-3 text-sm"
        }`}
      >
        <option value="">선택하세요</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}