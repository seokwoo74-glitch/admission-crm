import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      studentName,
      school,
      grade,
      classRank,
      admissionType,
      csatPlan,
      strategyType,
      memo,
      hopeMajor,
    } = body;

    const { data: candidates, error } = await supabase
      .from("admission_db")
      .select("*")
      .ilike("department", `%${hopeMajor || ""}%`)
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const prompt = `
너는 32년차 입시컨설턴트다.

아래 학생 정보를 바탕으로 수시 지원전략을 작성하라.

[학생 정보]
이름: ${studentName}
학교: ${school}
학년: ${grade}
전교등수: ${classRank}
주력전형: ${admissionType}
수능대비: ${csatPlan}
전략방향: ${strategyType}
희망학과: ${hopeMajor}
상담메모: ${memo}

[후보 모집단위 DB]
${JSON.stringify(candidates, null, 2)}

아래 형식으로 작성하라.

1. 학생 현재 상황 분석
2. 상향 지원 추천
3. 적정 지원 추천
4. 안정 지원 추천
5. 3-1 기말 이후 최우선 전략
6. 학부모 상담용 요약 코멘트

주의:
- 실제 DB에 있는 대학/전형/모집단위를 우선 활용하라.
- 없는 정보를 지어내지 말라.
- 판단 근거를 입시 상담 말투로 설명하라.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
      }),
    });

    const result = await response.json();

    const text =
      result.output_text ||
      result.output?.[0]?.content?.[0]?.text ||
      "AI 코멘트 생성 실패";

    return NextResponse.json({ comment: text });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "AI 생성 중 오류 발생" },
      { status: 500 }
    );
  }
}