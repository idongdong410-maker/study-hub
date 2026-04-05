// generate-feed.js
// Gemini API를 호출해 매일 새로운 문제와 카드를 생성하고 feed.json에 병합
//
// ===== NotebookLM 노트북 구분 =====
// [개념용] Study Hub Calculus Concept: cf148a18-3d18-4eff-9303-36f75de9861f
//   → MemoryFlow 미적분 공식 카드 (deck: calc)
//   → notes.html 개념 데이터 (concepts → hub-concepts localStorage)
//
// [문제용] 미적분-문제: 81d85c7c-f86f-431a-bb40-abca088feff7
//   → StudyFlow 미적분 문제 (subject: calculus)
//   → 오답 유사 문제 생성에도 이 노트 사용
// =====================================================

const fs = require("fs");
const path = require("path");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY 환경변수가 필요합니다.");
  process.exit(1);
}

const FEED_PATH = path.join(__dirname, "..", "data", "feed.json");
const TODAY = new Date().toISOString().slice(0, 10).replace(/-/g, "");

// 시험 범위
const EXAM_SCOPE = "수열의 극한, 급수, 여러 가지 함수의 미분(지수/로그/삼각함수), 여러가지 미분법(합성함수·매개변수·음함수·역함수 미분)";

// ===== 노트북별 역할 =====
const NOTEBOOKS = {
  concept: {
    id: "cf148a18-3d18-4eff-9303-36f75de9861f",
    name: "Study Hub Calculus Concept",
    role: "개념/공식 → MemoryFlow calc 카드 + notes.html concepts"
  },
  problem: {
    id: "81d85c7c-f86f-431a-bb40-abca088feff7",
    name: "미적분-문제",
    role: "문제 출제 → StudyFlow questions + 오답 유사 문제"
  }
};

const PROMPTS = {
  // ── [개념용] Study Hub Calculus Concept 노트(cf148a18) ─────────────────
  // MemoryFlow 미적분 공식 카드(deck:calc) + notes.html concepts 생성
  calculus_concepts: `미적분 핵심 개념 암기 카드 5개와 단원별 개념 요약 4개를 만들어줘.
시험 범위: ${EXAM_SCOPE}

반드시 아래 JSON 형식만 출력해. 다른 텍스트 없이 JSON만:
{
  "questions": [],
  "cards": [
    {"id":"calc-card-${TODAY}-NUM","deck":"calc","front":"공식/개념 이름 또는 핵심 질문","back":"공식 내용·조건·핵심 포인트","tag":"단원명"}
  ],
  "concepts": [
    {"subject":"calculus","topic":"수열의 극한","date":"${TODAY.slice(0,4)}-${TODAY.slice(4,6)}-${TODAY.slice(6,8)}","content":"## 섹션\\n내용 (마크다운 형식)"}
  ]
}

카드 규칙:
- front: 간결한 질문이나 공식 이름 (예: "등비급수 수렴 조건은?")
- back: 정확한 공식과 핵심 조건 포함 (예: "|r|<1 → S=a/(1-r), r=1은 발산!")
- 수열의 극한·급수·미분 공식·미분법 골고루
- id의 NUM은 001부터 순서대로

concepts 규칙:
- 단원 4개: 수열의 극한 / 급수 / 여러 가지 함수의 미분 / 여러가지 미분법
- content는 ## 헤더, **볼드**, - 리스트 마크다운 형식
- 핵심 공식·수렴 조건·자주 틀리는 포인트 포함`,

  // ── [문제용] 미적분-문제 노트(81d85c7c) ────────────────────────────────
  // StudyFlow 미적분 문제(subject:calculus) 생성
  calculus_problems: `미적분 중간고사 대비 객관식 문제 5개를 만들어줘.
시험 범위: ${EXAM_SCOPE}
출제 스타일: 학교 기출/수능 모의고사 스타일 (계산+추론 혼합, 4지선다)

반드시 아래 JSON 형식만 출력해. 다른 텍스트 없이 JSON만:
{
  "questions": [
    {"id":"calc-${TODAY}-NUM","subject":"calculus","topic":"단원명","question":"문제","options":["①a","②b","③c","④d"],"answer":0,"explanation":"풀이","difficulty":"중"}
  ],
  "cards": [],
  "concepts": []
}

규칙:
- 난이도 하/중/상 골고루 (하 1개, 중 2개, 상 2개)
- answer는 정답 인덱스 (0~3)
- 수학 공식은 텍스트: f'(x), dy/dx, lim(x→a) 등
- 수열의 극한: 수렴·발산 판정, ∞/∞, ∞-∞, 등비수열 수렴 조건
- 급수: 급수-수열 관계, 등비급수 합, 도형의 등비급수
- 미분: 지수/로그/삼각함수 도함수, 합성함수 미분
- 미분법: 매개변수/음함수/역함수 미분, 접선의 방정식
- id의 NUM은 001부터 순서대로`,

  // ── [문제용] 미적분-문제 노트(81d85c7c) — 오답 유사 문제 생성용 ───────
  // study.html에서 오답 주제를 파라미터로 넘겨 호출 (AUTOMATION.md [D] 참고)
  // calculus_similar은 런타임에 동적으로 생성 (generateSimilar 함수 참고)

  // ── 영어 ──────────────────────────────────────────────────────────────
  english: `수능특강 영어 시험 대비 문제 5개(빈칸추론, 순서배열, 문장삽입, 어휘, 문법)와 영단어 카드 5개를 만들어줘.

반드시 아래 JSON 형식만 출력해. 다른 텍스트 없이 JSON만:
{
  "questions": [
    {"id":"eng-${TODAY}-NUM","subject":"english","topic":"유형명","question":"문제","options":["①a","②b","③c","④d"],"answer":0,"explanation":"풀이","difficulty":"중"}
  ],
  "cards": [
    {"id":"vocab-${TODAY}-NUM","deck":"vocab","front":"English word","back":"한국어 뜻\\n예문: ...","tag":"수특 강번호"}
  ],
  "concepts": []
}

규칙:
- 수능 빈출 고난도 어휘 위주
- 난이도 골고루
- answer는 정답 인덱스 (0~3)`,

  // ── 화법과 작문 ────────────────────────────────────────────────────────
  korean: `화법과 작문 수능 대비 문제 5개(화법 이론, 작문 이론, 토론, 면접, 고쳐쓰기)와 핵심 개념 카드 3개를 만들어줘.

반드시 아래 JSON 형식만 출력해. 다른 텍스트 없이 JSON만:
{
  "questions": [
    {"id":"kor-${TODAY}-NUM","subject":"korean","topic":"단원명","question":"문제","options":["①a","②b","③c","④d"],"answer":0,"explanation":"풀이","difficulty":"중"}
  ],
  "cards": [
    {"id":"korean-card-${TODAY}-NUM","deck":"korean","front":"개념/용어","back":"정의 및 설명","tag":"화법/작문"}
  ],
  "concepts": []
}

규칙:
- 시험에 자주 나오는 핵심만
- 난이도 골고루
- answer는 정답 인덱스 (0~3)`
};

// ── 오답 유사 문제 생성 (동적 프롬프트) ─────────────────────────────────
// 사용법: generateSimilar("역함수의 미분법", 3) → feed.json에 추가
function buildSimilarPrompt(topic, count = 3) {
  return `미적분-문제 노트(${NOTEBOOKS.problem.id}) 기반으로
"${topic}" 단원의 유사 문제 ${count}개를 만들어줘. (오답 복습용)

반드시 아래 JSON 형식만 출력해:
{
  "questions": [
    {"id":"calc-similar-${TODAY}-NUM","subject":"calculus","topic":"${topic}","question":"문제","options":["①a","②b","③c","④d"],"answer":0,"explanation":"틀리기 쉬운 포인트 포함 상세 풀이","difficulty":"중"}
  ],
  "cards": [],
  "concepts": []
}

규칙:
- 해당 단원의 전형적인 오답 포인트를 다루는 문제
- explanation은 핵심 개념 재확인 포함
- 난이도: 중~상 위주
- id의 NUM은 001부터 순서대로`;
}

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
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response: " + text.slice(0, 200));
  return JSON.parse(jsonMatch[0]);
}

async function main() {
  console.log("=== Study Hub Feed Generator ===");
  console.log(`Date: ${TODAY}`);
  console.log("\n노트북 구분:");
  console.log(`  [개념용] ${NOTEBOOKS.concept.name} (${NOTEBOOKS.concept.id.slice(0,8)})`);
  console.log(`           → ${NOTEBOOKS.concept.role}`);
  console.log(`  [문제용] ${NOTEBOOKS.problem.name} (${NOTEBOOKS.problem.id.slice(0,8)})`);
  console.log(`           → ${NOTEBOOKS.problem.role}`);

  let feed = { lastUpdated: "", questions: [], cards: [], concepts: [] };
  try {
    feed = JSON.parse(fs.readFileSync(FEED_PATH, "utf8"));
    if (!feed.concepts) feed.concepts = [];
  } catch (e) {
    console.log("\nNo existing feed.json, creating new one.");
  }

  const existingIds = new Set([
    ...feed.questions.map((q) => q.id),
    ...feed.cards.map((c) => c.id)
  ]);

  let newQuestions = [];
  let newCards = [];
  let conceptUpdates = [];

  const LABELS = {
    calculus_concepts: `개념카드 + notes.html 개념 [${NOTEBOOKS.concept.name}]`,
    calculus_problems: `미적분 문제 [${NOTEBOOKS.problem.name}]`,
    english: "영어",
    korean: "화법과 작문"
  };

  for (const [subject, prompt] of Object.entries(PROMPTS)) {
    console.log(`\nGenerating ${LABELS[subject] || subject}...`);
    try {
      const result = await callGemini(prompt);

      const qs = (result.questions || []).filter((q) => !existingIds.has(q.id));
      const cs = (result.cards || []).filter((c) => !existingIds.has(c.id));
      const concepts = result.concepts || [];

      newQuestions.push(...qs);
      newCards.push(...cs);
      conceptUpdates.push(...concepts);

      console.log(`  → ${qs.length} questions, ${cs.length} cards, ${concepts.length} concepts`);
    } catch (e) {
      console.error(`  Error for ${subject}:`, e.message);
    }
  }

  // Merge questions + cards
  feed.lastUpdated = new Date().toISOString();
  feed.questions.push(...newQuestions);
  feed.cards.push(...newCards);

  // Merge concepts (subject+topic 기준 upsert)
  conceptUpdates.forEach((c) => {
    const idx = feed.concepts.findIndex(
      (e) => e.subject === c.subject && e.topic === c.topic
    );
    if (idx >= 0) feed.concepts[idx] = c;
    else feed.concepts.push(c);
  });

  fs.writeFileSync(FEED_PATH, JSON.stringify(feed, null, 2), "utf8");

  console.log(`\nDone!`);
  console.log(`Total: ${feed.questions.length} questions, ${feed.cards.length} cards, ${feed.concepts.length} concepts`);
  console.log(`New: +${newQuestions.length} questions, +${newCards.length} cards, ${conceptUpdates.length} concept updates`);
}

// ── 오답 유사 문제 생성 (단독 실행) ──────────────────────────────────────
// 사용: node scripts/generate-feed.js --similar "역함수의 미분법" 3
async function generateSimilar(topic, count) {
  const prompt = buildSimilarPrompt(topic, count);
  console.log(`\n[${NOTEBOOKS.problem.name}] 오답 유사 문제 생성: "${topic}" x${count}`);
  const result = await callGemini(prompt);

  let feed = { lastUpdated: "", questions: [], cards: [], concepts: [] };
  try { feed = JSON.parse(fs.readFileSync(FEED_PATH, "utf8")); } catch (e) {}
  if (!feed.concepts) feed.concepts = [];

  const existingIds = new Set(feed.questions.map((q) => q.id));
  const qs = (result.questions || []).filter((q) => !existingIds.has(q.id));
  feed.questions.push(...qs);
  feed.lastUpdated = new Date().toISOString();
  fs.writeFileSync(FEED_PATH, JSON.stringify(feed, null, 2), "utf8");
  console.log(`  → ${qs.length} similar questions added for "${topic}"`);
}

// CLI 분기
const args = process.argv.slice(2);
if (args[0] === "--similar" && args[1]) {
  const topic = args[1];
  const count = parseInt(args[2]) || 3;
  generateSimilar(topic, count).catch((e) => { console.error("Fatal:", e); process.exit(1); });
} else {
  main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
}
