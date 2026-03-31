// generate-feed.js
// Gemini API를 호출해 매일 새로운 문제와 카드를 생성하고 feed.json에 병합
const fs = require("fs");
const path = require("path");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY 환경변수가 필요합니다.");
  process.exit(1);
}

const FEED_PATH = path.join(__dirname, "..", "data", "feed.json");
const TODAY = new Date().toISOString().slice(0, 10).replace(/-/g, "");

const PROMPTS = {
  calculus: `미적분 중간고사 범위(미분계수, 도함수, 접선, 합성함수 미분, 매개변수 미분, 음함수 미분, 역함수 미분, 삼각/지수/로그 도함수)에서 객관식 문제 5개와 암기 카드 5개를 만들어줘.

반드시 아래 JSON 형식만 출력해. 다른 텍스트 없이 JSON만:
{
  "questions": [
    {"id":"calc-${TODAY}-NUM","subject":"calculus","topic":"단원명","question":"문제","options":["①a","②b","③c","④d"],"answer":0,"explanation":"풀이","difficulty":"중"}
  ],
  "cards": [
    {"id":"calc-card-${TODAY}-NUM","deck":"calc","front":"앞면","back":"뒷면","tag":"단원명"}
  ]
}

규칙:
- 난이도 하/중/상 골고루
- answer는 정답 인덱스 (0~3)
- 수학 공식은 텍스트: f'(x), dy/dx, lim(x→a) 등
- id의 NUM은 001부터 순서대로`,

  english: `수능 영어 시험 대비 문제 5개(빈칸추론, 순서배열, 문장삽입, 어휘, 문법)와 영단어 카드 5개를 만들어줘.

반드시 아래 JSON 형식만 출력해. 다른 텍스트 없이 JSON만:
{
  "questions": [
    {"id":"eng-${TODAY}-NUM","subject":"english","topic":"유형명","question":"문제","options":["①a","②b","③c","④d"],"answer":0,"explanation":"풀이","difficulty":"중"}
  ],
  "cards": [
    {"id":"vocab-${TODAY}-NUM","deck":"vocab","front":"English word","back":"한국어 뜻\\n예문: ...","tag":"수특 강번호"}
  ]
}

규칙:
- 수능 빈출 고난도 어휘 위주
- 난이도 골고루
- answer는 정답 인덱스 (0~3)`,

  korean: `화법과 작문 수능 대비 문제 5개(화법 이론, 작문 이론, 토론, 면접, 고쳐쓰기)와 핵심 개념 카드 3개를 만들어줘.

반드시 아래 JSON 형식만 출력해. 다른 텍스트 없이 JSON만:
{
  "questions": [
    {"id":"kor-${TODAY}-NUM","subject":"korean","topic":"단원명","question":"문제","options":["①a","②b","③c","④d"],"answer":0,"explanation":"풀이","difficulty":"중"}
  ],
  "cards": [
    {"id":"korean-card-${TODAY}-NUM","deck":"korean","front":"개념/용어","back":"정의 및 설명","tag":"화법/작문"}
  ]
}

규칙:
- 시험에 자주 나오는 핵심만
- 난이도 골고루
- answer는 정답 인덱스 (0~3)`
};

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response: " + text.slice(0, 200));
  return JSON.parse(jsonMatch[0]);
}

async function main() {
  console.log("=== Study Hub Feed Generator ===");
  console.log(`Date: ${TODAY}`);

  // Load existing feed
  let feed = { lastUpdated: "", questions: [], cards: [] };
  try {
    feed = JSON.parse(fs.readFileSync(FEED_PATH, "utf8"));
  } catch (e) {
    console.log("No existing feed.json, creating new one.");
  }

  const existingIds = new Set([
    ...feed.questions.map((q) => q.id),
    ...feed.cards.map((c) => c.id)
  ]);

  let newQuestions = [];
  let newCards = [];

  for (const [subject, prompt] of Object.entries(PROMPTS)) {
    console.log(`Generating ${subject}...`);
    try {
      const result = await callGemini(prompt);

      const qs = (result.questions || []).filter((q) => !existingIds.has(q.id));
      const cs = (result.cards || []).filter((c) => !existingIds.has(c.id));

      newQuestions.push(...qs);
      newCards.push(...cs);
      console.log(`  -> ${qs.length} questions, ${cs.length} cards`);
    } catch (e) {
      console.error(`  Error for ${subject}:`, e.message);
    }
  }

  // Merge
  feed.lastUpdated = new Date().toISOString();
  feed.questions.push(...newQuestions);
  feed.cards.push(...newCards);

  fs.writeFileSync(FEED_PATH, JSON.stringify(feed, null, 2), "utf8");
  console.log(`\nDone! Total: ${feed.questions.length} questions, ${feed.cards.length} cards`);
  console.log(`New: +${newQuestions.length} questions, +${newCards.length} cards`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
