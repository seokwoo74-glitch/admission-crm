"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const koreanOptions = ["화작", "언매"];
const mathOptions = ["미적분", "기하", "확률과 통계"];
const tamguOptions = [
  "물리1", "화학1", "생명1", "지구1",
  "물리2", "화학2", "생명2", "지구2",
  "생윤", "사문", "윤사", "한지", "세지",
  "동아시아사", "세계사", "정법", "경제",
];

type ExamKey = "june" | "september" | "csat";

type ExamState = {
  korean_type: string;
  korean_score: string;
  korean_percentile: string;
  korean_grade: string;
  math_type: string;
  math_score: string;
  math_percentile: string;
  math_grade: string;
  english_grade: string;
  tamgu1_type: string;
  tamgu1_score: string;
  tamgu1_percentile: string;
  tamgu1_grade: string;
  tamgu2_type: string;
  tamgu2_score: string;
  tamgu2_percentile: string;
  tamgu2_grade: string;
};

type DesiredUniversity = {
  university: string;
  admission: string;
  track: string;
  department: string;
};

const emptyExam: ExamState = {
  korean_type: "",
  korean_score: "",
  korean_percentile: "",
  korean_grade: "",
  math_type: "",
  math_score: "",
  math_percentile: "",
  math_grade: "",
  english_grade: "",
  tamgu1_type: "",
  tamgu1_score: "",
  tamgu1_percentile: "",
  tamgu1_grade: "",
  tamgu2_type: "",
  tamgu2_score: "",
  tamgu2_percentile: "",
  tamgu2_grade: "",
};

export default function Home() {
  const [studentName, setStudentName] = useState("");
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
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

  const [june, setJune] = useState<ExamState>({ ...emptyExam });
  const [september, setSeptember] = useState<ExamState>({ ...emptyExam });
  const [csat, setCsat] = useState<ExamState>({ ...emptyExam });

  const [universityOptions, setUniversityOptions] = useState<string[]>([]);
  const [desiredUniversities, setDesiredUniversities] = useState<DesiredUniversity[]>(
    Array.from({ length: 9 }, () => ({
      university: "",
      admission: "",
      track: "",
      department: "",
    }))
  );

  const [admissionOptions, setAdmissionOptions] = useState<string[][]>(
    Array.from({ length: 9 }, () => [])
  );
  const [trackOptions, setTrackOptions] = useState<string[][]>(
    Array.from({ length: 9 }, () => [])
  );
  const [departmentOptions, setDepartmentOptions] = useState<string[][]>(
    Array.from({ length: 9 }, () => [])
  );

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUniversities();
  }, []);

 async function loadUniversities() {
  const { data, error } = await supabase
    .from("admission_db")
    .select("university")
    .not("university", "is", null)
    .range(0, 5000);

  if (error) {
    alert("대학 목록 오류: " + error.message);
    console.error(error);
    return;
  }

  const list = [
    ...new Set((data || []).map((row: any) => row.university).filter(Boolean)),
  ].sort();

  console.log("대학목록 개수:", list.length);
  setUniversityOptions(list);
}

  async function loadAdmissions(index: number, university: string) {
    const { data } = await supabase
      .from("admission_db")
      .select("admission_type")
      .eq("university", university);

    const list = [
      ...new Set((data || []).map((row) => row.admission_type).filter(Boolean)),
    ].sort();

    setAdmissionOptions((prev) => {
      const next = [...prev];
      next[index] = list;
      return next;
    });
  }

  async function loadTracks(index: number, university: string, admission: string) {
    const { data } = await supabase
      .from("admission_db")
      .select("track")
      .eq("university", university)
      .eq("admission_type", admission);

    const list = [
      ...new Set((data || []).map((row) => row.track).filter(Boolean)),
    ].sort();

    setTrackOptions((prev) => {
      const next = [...prev];
      next[index] = list;
      return next;
    });
  }

  async function loadDepartments(
    index: number,
    university: string,
    admission: string,
    track: string
  ) {
    const { data } = await supabase
      .from("admission_db")
      .select("department")
      .eq("university", university)
      .eq("admission_type", admission)
      .eq("track", track);

    const list = [
      ...new Set((data || []).map((row) => row.department).filter(Boolean)),
    ].sort();

    setDepartmentOptions((prev) => {
      const next = [...prev];
      next[index] = list;
      return next;
    });
  }

  function updateDesiredUniversity(
    index: number,
    field: keyof DesiredUniversity,
    value: string
  ) {
    const next = [...desiredUniversities];
    next[index] = { ...next[index], [field]: value };

    if (field === "university") {
      next[index].admission = "";
      next[index].track = "";
      next[index].department = "";
      if (value) loadAdmissions(index, value);
    }

    if (field === "admission") {
      next[index].track = "";
      next[index].department = "";
      if (value) loadTracks(index, next[index].university, value);
    }

    if (field === "track") {
      next[index].department = "";
      if (value) {
        loadDepartments(index, next[index].university, next[index].admission, value);
      }
    }

    setDesiredUniversities(next);
  }

  function updateExam(examKey: ExamKey, field: keyof ExamState, value: string) {
    if (examKey === "june") setJune((prev) => ({ ...prev, [field]: value }));
    if (examKey === "september") setSeptember((prev) => ({ ...prev, [field]: value }));
    if (examKey === "csat") setCsat((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!studentName || !school || !grade) {
      alert("학생 이름, 학교, 학년은 필수입니다.");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.from("consultation_applications").insert([
        {
          student_name: studentName,
          school,
          grade,
          graduation_year: graduationYear,
          track,
          school_type: schoolType,
          overall_gpa: overallGpa,
          major_gpa: majorGpa,
          hope_major: hopeMajor,
          class_rank: classRank,
          admission_type: admissionType,
          extracurricular_needed: extracurricularNeeded,
          csat_plan: csatPlan,
          priority_after_final: priorityAfterFinal,
          strategy_type: strategyType,
          preferred_call_date: preferredCallDate,
          question,
          desired_universities: desiredUniversities,

          june_korean_type: june.korean_type,
          june_korean_score: june.korean_score,
          june_korean_percentile: june.korean_percentile,
          june_korean_grade: june.korean_grade,
          june_math_type: june.math_type,
          june_math_score: june.math_score,
          june_math_percentile: june.math_percentile,
          june_math_grade: june.math_grade,
          june_english_grade: june.english_grade,
          june_tamgu1_type: june.tamgu1_type,
          june_tamgu1_score: june.tamgu1_score,
          june_tamgu1_percentile: june.tamgu1_percentile,
          june_tamgu1_grade: june.tamgu1_grade,
          june_tamgu2_type: june.tamgu2_type,
          june_tamgu2_score: june.tamgu2_score,
          june_tamgu2_percentile: june.tamgu2_percentile,
          june_tamgu2_grade: june.tamgu2_grade,

          september_korean_type: september.korean_type,
          september_korean_score: september.korean_score,
          september_korean_percentile: september.korean_percentile,
          september_korean_grade: september.korean_grade,
          september_math_type: september.math_type,
          september_math_score: september.math_score,
          september_math_percentile: september.math_percentile,
          september_math_grade: september.math_grade,
          september_english_grade: september.english_grade,
          september_tamgu1_type: september.tamgu1_type,
          september_tamgu1_score: september.tamgu1_score,
          september_tamgu1_percentile: september.tamgu1_percentile,
          september_tamgu1_grade: september.tamgu1_grade,
          september_tamgu2_type: september.tamgu2_type,
          september_tamgu2_score: september.tamgu2_score,
          september_tamgu2_percentile: september.tamgu2_percentile,
          september_tamgu2_grade: september.tamgu2_grade,

          csat_korean_type: csat.korean_type,
          csat_korean_score: csat.korean_score,
          csat_korean_percentile: csat.korean_percentile,
          csat_korean_grade: csat.korean_grade,
          csat_math_type: csat.math_type,
          csat_math_score: csat.math_score,
          csat_math_percentile: csat.math_percentile,
          csat_math_grade: csat.math_grade,
          csat_english_grade: csat.english_grade,
          csat_tamgu1_type: csat.tamgu1_type,
          csat_tamgu1_score: csat.tamgu1_score,
          csat_tamgu1_percentile: csat.tamgu1_percentile,
          csat_tamgu1_grade: csat.tamgu1_grade,
          csat_tamgu2_type: csat.tamgu2_type,
          csat_tamgu2_score: csat.tamgu2_score,
          csat_tamgu2_percentile: csat.tamgu2_percentile,
          csat_tamgu2_grade: csat.tamgu2_grade,
        },
      ]);

      if (error) {
        console.error(error);
        alert("저장 실패");
        return;
      }

      alert("상담 신청이 저장되었습니다.");
      location.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-8">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-8 text-white shadow-2xl backdrop-blur">
          <div className="mb-5 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
            강성재교육연구소
          </div>

          <h1 className="text-4xl font-black leading-tight md:text-5xl">
            수시지원전략 상담 신청서
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-slate-200">
            학생의 내신, 모의고사, 희망대학 정보를 바탕으로 맞춤형 수시 지원전략을 설계합니다.
          </p>

          
        </div>

        <div className="rounded-3xl bg-slate-50 p-4 shadow-2xl md:p-8">
          <Section number="01" title="학생 기본정보" subtitle="상담 대상 학생의 기본 정보를 입력해주세요.">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="학생 이름 *" value={studentName} onChange={setStudentName} />
              <Input label="고등학교 *" value={school} onChange={setSchool} />
              <Input label="학년 *" value={grade} onChange={setGrade} />
              <Input label="졸업년도" value={graduationYear} onChange={setGraduationYear} />
              <Select label="계열" value={track} onChange={setTrack} options={["인문", "자연", "예체능"]} />
              <Select label="학교유형" value={schoolType} onChange={setSchoolType} options={["일반고", "자사고", "특목고", "외고", "국제고", "기타"]} />
              <Input label="전교과 내신" value={overallGpa} onChange={setOverallGpa} />
              <Input label="주요교과 내신" value={majorGpa} onChange={setMajorGpa} />
              <Input label="희망학과" value={hopeMajor} onChange={setHopeMajor} />
              <Input label="나는 전교 몇 등?" value={classRank} onChange={setClassRank} />
            </div>
          </Section>

          <Section number="02" title="상담 전략정보" subtitle="현재 준비 방향과 상담 우선순위를 선택해주세요.">
            <div className="grid gap-4 md:grid-cols-2">
              <Select label="나의 주력전형" value={admissionType} onChange={setAdmissionType} options={["교과전형", "학생부종합전형", "논술전형", "지역인재전형", "지역의사제", "농어촌전형", "기회균형전형"]} />
              <Select label="생기부 비교과 관리" value={extracurricularNeeded} onChange={setExtracurricularNeeded} options={["관리한다", "관리안한다"]} />
              <Select label="수능대비" value={csatPlan} onChange={setCsatPlan} options={["전과목대비(논술/정시)", "수능최저만 관리", "수능대비 안한다"]} />
              <Select label="3-1 기말 후 최우선 순위" value={priorityAfterFinal} onChange={setPriorityAfterFinal} options={["생기부관리", "수능대비", "논술대비", "면접대비"]} />
              <Select label="수시/정시 전략" value={strategyType} onChange={setStrategyType} options={["수시에 끝낸다", "정시까지 고려한다"]} />
              <Input label="2차 전화상담 희망일" value={preferredCallDate} onChange={setPreferredCallDate} placeholder="예: 9월 4일 오후" />
            </div>
          </Section>

          <Section number="03" title="희망대학 선택" subtitle="희망대학은 최대 9개까지 선택할 수 있습니다.">
            <div className="space-y-4">
              {desiredUniversities.map((item, index) => (
                <div key={index} className="rounded-2xl border bg-white p-4 shadow-sm">
                  <h3 className="mb-3 font-bold text-slate-800">
                    희망대학 {index + 1}
                  </h3>

                  <div className="grid gap-3 md:grid-cols-4">
                    <select className="input" value={item.university} onChange={(e) => updateDesiredUniversity(index, "university", e.target.value)}>
                      <option value="">대학 선택</option>
                      {universityOptions.map((university) => (
                        <option key={university} value={university}>{university}</option>
                      ))}
                    </select>

                    <select className="input" value={item.admission} disabled={!item.university} onChange={(e) => updateDesiredUniversity(index, "admission", e.target.value)}>
                      <option value="">전형 선택</option>
                      {admissionOptions[index]?.map((admission) => (
                        <option key={admission} value={admission}>{admission}</option>
                      ))}
                    </select>

                    <select className="input" value={item.track} disabled={!item.admission} onChange={(e) => updateDesiredUniversity(index, "track", e.target.value)}>
                      <option value="">계열 선택</option>
                      {trackOptions[index]?.map((track) => (
                        <option key={track} value={track}>{track}</option>
                      ))}
                    </select>

                    <select className="input" value={item.department} disabled={!item.track} onChange={(e) => updateDesiredUniversity(index, "department", e.target.value)}>
                      <option value="">모집단위 선택</option>
                      {departmentOptions[index]?.map((department) => (
                        <option key={department} value={department}>{department}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <ExamSection title="6월 평가원" examKey="june" exam={june} updateExam={updateExam} />
          
          <Section number="07" title="상담 전 질문사항" subtitle="상담 전에 꼭 다루고 싶은 내용을 적어주세요.">
            <textarea
              className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white p-4 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              placeholder="예: 현재 내신으로 어느 정도 대학까지 가능한지 궁금합니다."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </Section>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="mt-2 w-full rounded-2xl bg-gradient-to-r from-slate-950 to-indigo-900 py-5 text-lg font-black text-white shadow-xl transition hover:scale-[1.01] disabled:bg-gray-400"
          >
            {saving ? "저장 중..." : "상담 신청하기"}
          </button>
        </div>
      </section>
    </main>
  );
}


function Section({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-2xl bg-slate-950 px-3 py-2 text-sm font-black text-white">
          {number}
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-bold text-slate-700">{label}</div>
      <input
        className="input"
        placeholder={placeholder || label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-bold text-slate-700">{label}</div>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{label} 선택</option>
        {options.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

function ExamSection({
  title,
  examKey,
  exam,
  updateExam,
}: {
  title: string;
  examKey: ExamKey;
  exam: ExamState;
  updateExam: (examKey: ExamKey, field: keyof ExamState, value: string) => void;
}) {
  return (
    <Section number={examKey === "june" ? "04" : examKey === "september" ? "05" : "06"} title={title} subtitle="원점수, 백분위, 등급을 아는 범위에서 입력해주세요.">
      <div className="space-y-4">
        <SubjectBlock title="국어" selector={<Select label="국어 선택" value={exam.korean_type} onChange={(v) => updateExam(examKey, "korean_type", v)} options={koreanOptions} />} score={exam.korean_score} percentile={exam.korean_percentile} grade={exam.korean_grade} onScore={(v) => updateExam(examKey, "korean_score", v)} onPercentile={(v) => updateExam(examKey, "korean_percentile", v)} onGrade={(v) => updateExam(examKey, "korean_grade", v)} />
        <SubjectBlock title="수학" selector={<Select label="수학 선택" value={exam.math_type} onChange={(v) => updateExam(examKey, "math_type", v)} options={mathOptions} />} score={exam.math_score} percentile={exam.math_percentile} grade={exam.math_grade} onScore={(v) => updateExam(examKey, "math_score", v)} onPercentile={(v) => updateExam(examKey, "math_percentile", v)} onGrade={(v) => updateExam(examKey, "math_grade", v)} />

        <div className="rounded-2xl border bg-slate-50 p-4">
          <h3 className="mb-3 font-black text-slate-800">영어</h3>
          <Input label="영어 등급" value={exam.english_grade} onChange={(v) => updateExam(examKey, "english_grade", v)} />
        </div>

        <SubjectBlock title="탐구1" selector={<Select label="탐구1 선택" value={exam.tamgu1_type} onChange={(v) => updateExam(examKey, "tamgu1_type", v)} options={tamguOptions} />} score={exam.tamgu1_score} percentile={exam.tamgu1_percentile} grade={exam.tamgu1_grade} onScore={(v) => updateExam(examKey, "tamgu1_score", v)} onPercentile={(v) => updateExam(examKey, "tamgu1_percentile", v)} onGrade={(v) => updateExam(examKey, "tamgu1_grade", v)} />
        <SubjectBlock title="탐구2" selector={<Select label="탐구2 선택" value={exam.tamgu2_type} onChange={(v) => updateExam(examKey, "tamgu2_type", v)} options={tamguOptions} />} score={exam.tamgu2_score} percentile={exam.tamgu2_percentile} grade={exam.tamgu2_grade} onScore={(v) => updateExam(examKey, "tamgu2_score", v)} onPercentile={(v) => updateExam(examKey, "tamgu2_percentile", v)} onGrade={(v) => updateExam(examKey, "tamgu2_grade", v)} />
      </div>
    </Section>
  );
}

function SubjectBlock({
  title,
  selector,
  score,
  percentile,
  grade,
  onScore,
  onPercentile,
  onGrade,
}: {
  title: string;
  selector: React.ReactNode;
  score: string;
  percentile: string;
  grade: string;
  onScore: (value: string) => void;
  onPercentile: (value: string) => void;
  onGrade: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-4">
      <h3 className="mb-3 font-black text-slate-800">{title}</h3>
      <div className="grid gap-3 md:grid-cols-4">
        {selector}
        <Input label="원점수" value={score} onChange={onScore} />
        <Input label="백분위" value={percentile} onChange={onPercentile} />
        <Input label="등급" value={grade} onChange={onGrade} />
      </div>
    </div>
  );
}