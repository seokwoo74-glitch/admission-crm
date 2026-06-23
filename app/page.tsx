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
  const [desiredUniversities, setDesiredUniversities] = useState<
    DesiredUniversity[]
  >([{ ...emptyDesired }]);

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

  function getDepartments(
    university: string,
    admission: string,
    selectedTrack: string
  ) {
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
    setJuneScores((prev) => ({
      ...prev,
      [key]: value,
    }));
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
      (item) =>
        item.university || item.admission || item.track || item.department
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
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-slate-900">
            상담 신청이 완료되었습니다.
          </h1>
          <p className="mt-4 text-slate-600">
            입력해주신 내용을 바탕으로 담당 연구원이 상담 준비 후 연락드리겠습니다.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-lg md:p-10"
      >
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-600">
            강성재교육연구소
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            입시 컨설팅 신청서
          </h1>
          <p className="mt-3 text-slate-600">
            상담에 필요한 기본 정보와 희망 대학을 입력해주세요.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            학생 기본 정보
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <Input label="학생 이름 *" value={studentName} setValue={setStudentName} />
            <Input label="학교 *" value={school} setValue={setSchool} />
            <Input label="학년 *" value={grade} setValue={setGrade} />

            <Input label="학생 전화번호" value={studentPhone} setValue={setStudentPhone} />
            <Input label="학부모 전화번호" value={parentPhone} setValue={setParentPhone} />
            <Input label="소개자" value={referral} setValue={setReferral} />

            <Input label="졸업년도" value={graduationYear} setValue={setGraduationYear} />
            <Select label="계열" value={track} setValue={setTrack} options={["인문", "자연", "예체능"]} />
            <Select label="학교유형" value={schoolType} setValue={setSchoolType} options={["일반고", "자사고", "특목고", "특성화고", "기타"]} />

            <Input label="전교과 내신" value={overallGpa} setValue={setOverallGpa} />
            <Input label="주요교과 내신" value={majorGpa} setValue={setMajorGpa} />
            <Input label="희망학과" value={hopeMajor} setValue={setHopeMajor} />

            <Input label="전교 등수" value={classRank} setValue={setClassRank} />
            <Select label="주력전형" value={admissionType} setValue={setAdmissionType} options={["교과전형", "종합전형", "논술전형", "지역인재", "지역의사제", "농어촌", "기회균형"]} />
            <Select label="생기부 비교과 관리" value={extracurricularNeeded} setValue={setExtracurricularNeeded} options={["관리한다", "관리하지 않는다", "상담 후 결정"]} />

            <Select label="수능대비" value={csatPlan} setValue={setCsatPlan} options={["전과목대비", "최저만 대비", "안함"]} />
            <Select label="3-1 기말 후 최우선 순위" value={priorityAfterFinal} setValue={setPriorityAfterFinal} options={["생기부", "수능대비", "논술", "면접"]} />
            <Select label="수시/정시 전략" value={strategyType} setValue={setStrategyType} options={["수시에 끝낸다", "정시까지 고려", "상담 후 결정"]} />

            <Input
              label="2차전화상담일"
              value={preferredCallDate}
              setValue={setPreferredCallDate}
              placeholder="예: 9월 4,5,6 중 택1"
            />
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            6월 모의고사 성적
          </h2>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Select
                label="국어 선택"
                value={juneScores.koreanSubject}
                setValue={(v) => updateJuneScore("koreanSubject", v)}
                options={["화작", "언매"]}
              />
              <Input label="국어 원점수" value={juneScores.koreanScore} setValue={(v) => updateJuneScore("koreanScore", v)} />
              <Input label="국어 백분위" value={juneScores.koreanPercentile} setValue={(v) => updateJuneScore("koreanPercentile", v)} />
              <Input label="국어 등급" value={juneScores.koreanGrade} setValue={(v) => updateJuneScore("koreanGrade", v)} />

              <Select
                label="수학 선택"
                value={juneScores.mathSubject}
                setValue={(v) => updateJuneScore("mathSubject", v)}
                options={["미적", "기하", "확통"]}
              />
              <Input label="수학 원점수" value={juneScores.mathScore} setValue={(v) => updateJuneScore("mathScore", v)} />
              <Input label="수학 백분위" value={juneScores.mathPercentile} setValue={(v) => updateJuneScore("mathPercentile", v)} />
              <Input label="수학 등급" value={juneScores.mathGrade} setValue={(v) => updateJuneScore("mathGrade", v)} />

              <Input label="영어 등급" value={juneScores.englishGrade} setValue={(v) => updateJuneScore("englishGrade", v)} />

              <Select
                label="탐구1 과목"
                value={juneScores.inquiry1Subject}
                setValue={(v) => updateJuneScore("inquiry1Subject", v)}
                options={inquirySubjects}
              />
              <Input label="탐구1 원점수" value={juneScores.inquiry1Score} setValue={(v) => updateJuneScore("inquiry1Score", v)} />
              <Input label="탐구1 백분위" value={juneScores.inquiry1Percentile} setValue={(v) => updateJuneScore("inquiry1Percentile", v)} />
              <Input label="탐구1 등급" value={juneScores.inquiry1Grade} setValue={(v) => updateJuneScore("inquiry1Grade", v)} />

              <Select
                label="탐구2 과목"
                value={juneScores.inquiry2Subject}
                setValue={(v) => updateJuneScore("inquiry2Subject", v)}
                options={inquirySubjects}
              />
              <Input label="탐구2 원점수" value={juneScores.inquiry2Score} setValue={(v) => updateJuneScore("inquiry2Score", v)} />
              <Input label="탐구2 백분위" value={juneScores.inquiry2Percentile} setValue={(v) => updateJuneScore("inquiry2Percentile", v)} />
              <Input label="탐구2 등급" value={juneScores.inquiry2Grade} setValue={(v) => updateJuneScore("inquiry2Grade", v)} />
            </div>
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">희망 대학</h2>
            <button
              type="button"
              onClick={addDesiredUniversity}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300"
              disabled={desiredUniversities.length >= 9}
            >
              + 추가
            </button>
          </div>

          <div className="space-y-4">
            {desiredUniversities.map((item, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-bold text-slate-800">희망 대학 {index + 1}</p>
                  <button type="button" onClick={() => removeDesiredUniversity(index)} className="text-sm font-semibold text-red-500">
                    삭제
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <Select label="대학" value={item.university} setValue={(v) => updateDesiredUniversity(index, "university", v)} options={universities} />
                  <Select label="전형" value={item.admission} setValue={(v) => updateDesiredUniversity(index, "admission", v)} options={getAdmissions(item.university)} />
                  <Select label="계열" value={item.track} setValue={(v) => updateDesiredUniversity(index, "track", v)} options={getTracks(item.university, item.admission)} />
                  <Select label="모집단위" value={item.department} setValue={(v) => updateDesiredUniversity(index, "department", v)} options={getDepartments(item.university, item.admission, item.track)} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-slate-900">상담 요청사항</h2>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={5}
            className="w-full rounded-2xl border border-slate-300 p-4 outline-none focus:border-blue-500"
            placeholder="궁금한 점이나 상담받고 싶은 내용을 적어주세요."
          />
        </section>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-blue-600 py-4 text-lg font-extrabold text-white disabled:bg-slate-300"
        >
          {loading ? "저장 중..." : "상담 신청하기"}
        </button>
      </form>
    </main>
  );
}

const inquirySubjects = [
  "물1",
  "화1",
  "생1",
  "지1",
  "물2",
  "화2",
  "생2",
  "지2",
  "생윤",
  "사문",
  "윤사",
  "한지",
  "세지",
  "동사",
  "세사",
  "정법",
  "경제",
];

function Input({
  label,
  value,
  setValue,
  placeholder,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-700">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
      />
    </label>
  );
}

function Select({
  label,
  value,
  setValue,
  options,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
      >
        <option value="">선택</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}