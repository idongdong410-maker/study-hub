# 자동화 파이프라인 설정 가이드

## NotebookLM 노트북 구조

| 역할 | 노트북 | ID | 출력 |
|------|--------|-----|------|
| **[개념용]** | Study Hub Calculus Concept | `cf148a18-3d18-4eff-9303-36f75de9861f` | MemoryFlow calc 카드 + notes.html 개념 |
| **[문제용]** | 미적분-문제 | `81d85c7c-f86f-431a-bb40-abca088feff7` | StudyFlow 문제 + 오답 유사 문제 |
| | study hub Speech and Composition | `a7a7587b-bc92-4cdb-807c-a71a6756c274` | korean·korsum 덱 |
| | study hub english | `6d79c301-01b6-4e9b-bd4e-70b96d3aff71` | vocab·engsum 덱 |

**쿼리 원칙:** 개념/공식 → Concept 노트, 문제 출제/오답 유사 문제 → 문제 노트

**시험 범위:** 수열의 극한 / 급수 / 여러 가지 함수의 미분 / 여러가지 미분법(합성함수·매개변수·음함수·역함수 미분)

---

## 전체 구조
```
안티그래비티/n8n → Gemini + NotebookLM MCP → JSON 생성 → GitHub 커밋 → 앱 자동 동기화
```

### 데이터 흐름
```
[문제용] 미적분-문제 노트 ──→ questions (subject: calculus)  ──→ feed.json → StudyFlow
                          └→ 오답 유사 문제 (--similar 플래그) ─→ feed.json → StudyFlow

[개념용] Study Hub Calculus Concept 노트
         ├→ cards (deck: calc)              ──→ feed.json → MemoryFlow
         └→ concepts (subject+topic)        ──→ feed.json → hub-concepts → notes.html
```

---

## 1단계: feed.json 형식

`data/feed.json` 파일에 아래 형식으로 데이터를 넣으면 앱이 자동으로 가져갑니다:

```json
{
  "lastUpdated": "2026-04-05T09:00:00Z",
  "questions": [
    {
      "id": "calc-20260405-001",
      "subject": "calculus",
      "topic": "역함수의 미분법",
      "question": "문제 내용",
      "options": ["①선택지1", "②선택지2", "③선택지3", "④선택지4"],
      "answer": 0,
      "explanation": "상세 풀이",
      "difficulty": "중"
    }
  ],
  "cards": [
    {
      "id": "calc-card-20260405-001",
      "deck": "calc",
      "front": "등비급수 수렴 조건은?",
      "back": "|r|<1 → S=a/(1-r) / r=1이면 발산! (수열 수렴과 다름)",
      "tag": "급수"
    }
  ]
}
```

### subject 값: `"calculus"`, `"english"`, `"korean"`
### deck 값: `"calc"` (미적분 공식), `"vocab"` (영단어), `"korean"` (화작), `"engsum"` (수특 요약), `"korsum"` (화작 요약)

---

## 2단계: 안티그래비티 자동화 프롬프트

NotebookLM MCP가 연결되어 있으면 실제 교재 기반으로 생성됩니다.

### [A] 미적분 문제 생성 ([문제용] 미적분-문제 노트 → questions)
```
NotebookLM의 미적분-문제 노트(81d85c7c-f86f-431a-bb40-abca088feff7)를 참조해서
학교 기출/수능 모의고사 스타일의 미적분 문제 10개를 만들어줘.

시험 범위: 수열의 극한, 급수, 여러 가지 함수의 미분, 여러가지 미분법(합성함수·매개변수·음함수·역함수)

아래 JSON 형식으로만 출력해:
{
  "lastUpdated": "[현재 ISO 날짜]",
  "questions": [
    {
      "id": "calc-[날짜]-[번호]",
      "subject": "calculus",
      "topic": "단원명",
      "question": "문제 내용",
      "options": ["①선택지1", "②선택지2", "③선택지3", "④선택지4"],
      "answer": 0,
      "explanation": "상세 풀이",
      "difficulty": "중"
    }
  ],
  "cards": []
}

규칙:
- 문제 10개 (난이도 하 2개, 중 5개, 상 3개)
- answer는 정답 인덱스 (0~3)
- 수학 공식은 텍스트: f'(x), dy/dx, lim(x→a) 등
- 노트북의 실제 기출 문제 유형을 반영할 것
```

### [B] 미적분 개념 카드 + notes.html 개념 생성 ([개념용] Study Hub Calculus Concept 노트)
```
NotebookLM의 Study Hub Calculus Concept 노트(cf148a18-3d18-4eff-9303-36f75de9861f)를 참조해서
핵심 개념/공식 암기 카드 10개와 notes.html용 개념 요약 4개를 만들어줘.

시험 범위: 수열의 극한, 급수, 여러 가지 함수의 미분, 여러가지 미분법

아래 JSON 형식으로만 출력해:
{
  "lastUpdated": "[현재 ISO 날짜]",
  "questions": [],
  "cards": [
    {
      "id": "calc-card-[날짜]-[번호]",
      "deck": "calc",
      "front": "공식 이름 또는 핵심 질문",
      "back": "공식 내용·조건·핵심 포인트",
      "tag": "단원명"
    }
  ],
  "concepts": [
    {
      "subject": "calculus",
      "topic": "수열의 극한",
      "date": "[오늘 날짜]",
      "content": "## 섹션\n내용 (마크다운 형식)"
    }
  ]
}

단원별 concepts 1개씩: 수열의 극한 / 급수 / 여러 가지 함수의 미분 / 여러가지 미분법
concepts.content는 ## 헤더, **볼드**, - 리스트 마크다운 사용
```

> **자동 동기화 흐름:** feed.json의 concepts → index.html sync → `hub-concepts` localStorage → notes.html 자동 표시
> 수동으로 반영하려면:
> ```js
> const existing = JSON.parse(localStorage.getItem("hub-concepts") || "[]");
> result.concepts.forEach(c => {
>   const idx = existing.findIndex(e => e.subject===c.subject && e.topic===c.topic);
>   if(idx>=0) existing[idx]=c; else existing.push(c);
> });
> localStorage.setItem("hub-concepts", JSON.stringify(existing));
> ```

### [D] 오답 유사 문제 생성 ([문제용] 미적분-문제 노트)
```
NotebookLM의 미적분-문제 노트(81d85c7c-f86f-431a-bb40-abca088feff7)를 참조해서
"[오답 단원명]" 단원의 유사 문제 3개를 만들어줘. (오답 복습용)

아래 JSON 형식으로만 출력해:
{
  "questions": [
    {
      "id": "calc-similar-[날짜]-[번호]",
      "subject": "calculus",
      "topic": "[오답 단원명]",
      "question": "문제",
      "options": ["①a","②b","③c","④d"],
      "answer": 0,
      "explanation": "틀리기 쉬운 포인트 포함 상세 풀이",
      "difficulty": "중"
    }
  ],
  "cards": [],
  "concepts": []
}

규칙:
- 해당 단원의 전형적인 오답 포인트를 다루는 문제
- explanation은 핵심 개념 재확인 포함
- 난이도 중~상 위주
```

CLI로 실행:
```bash
GEMINI_API_KEY=your_key node scripts/generate-feed.js --similar "역함수의 미분법" 3
```

### [C] 영단어 카드 생성 (study hub english 노트)
```
수능특강 영어 노트북(6d79c301-01b6-4e9b-bd4e-70b96d3aff71)을 참조해서 영단어 카드를 생성해줘.
시험 범위 지문 (1강2·3, 2강2, 3강2·3, 4강1·2, 5강1·4, 6강1·2, 7강3, 11강2, 12강4, 13강3, 21강2, 22강1, 23강1, 24강1) 위주.

{
  "lastUpdated": "[현재 ISO 날짜]",
  "questions": [],
  "cards": [
    {
      "id": "vocab-[날짜]-[번호]",
      "deck": "vocab",
      "front": "English word",
      "back": "한국어 뜻\n예문: ...",
      "tag": "강번호"
    }
  ]
}

- 15개 카드
- 수능 빈출 고난도 위주
```

---

## 3단계: GitHub에 자동 커밋

### 방법 A: 안티그래비티에서 직접
```
위에서 생성한 JSON을 내 GitHub 레포 idongdong410-maker/study-hub의 data/feed.json 파일에 업데이트해줘.
```

### 방법 B: 수동 복사
1. 안티그래비티에서 JSON 생성
2. GitHub → data/feed.json → 연필 아이콘 (Edit) → 붙여넣기 → Commit

### 방법 C: n8n 완전 자동
```
n8n 워크플로우:
1. Schedule Trigger (매일 아침 7시)
2. HTTP Request → Gemini API (generate-feed.js 로직)
3. GitHub Node → data/feed.json 업데이트
```

또는 로컬 실행:
```bash
GEMINI_API_KEY=your_key node scripts/generate-feed.js
```

---

## 4단계: 앱에서 확인

- **StudyFlow (study.html):** feed.json → questions → 문제은행 자동 추가
- **MemoryFlow (memory.html):** feed.json → cards → 덱별 카드 추가
- **노트 (notes.html):** hub-concepts localStorage → 단원별 개념 자동 표시

이미 추가된 항목은 id로 중복 체크해서 다시 안 들어감.

---

## 수동 import도 계속 가능

자동화와 별개로, 각 앱의 "가져오기"/"추가" 탭에서 JSON을 직접 붙여넣는 것도 여전히 작동합니다.
