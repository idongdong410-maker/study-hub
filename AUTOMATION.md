# 자동화 파이프라인 설정 가이드

## 전체 구조
```
안티그래비티/n8n → Gemini + NotebookLM MCP → JSON 생성 → GitHub 커밋 → 앱 자동 동기화
```

## 1단계: feed.json 형식

`data/feed.json` 파일에 아래 형식으로 데이터를 넣으면 앱이 자동으로 가져갑니다:

```json
{
  "lastUpdated": "2026-03-30T09:00:00Z",
  "questions": [
    {
      "id": "calc-20260330-001",
      "subject": "calculus",
      "topic": "합성함수 미분",
      "question": "f(x) = sin(x^2)일 때, f'(x)를 구하시오.",
      "options": ["①2x·cos(x^2)", "②cos(x^2)", "③2x·sin(x^2)", "④x^2·cos(x^2)"],
      "answer": 0,
      "explanation": "합성함수 미분법에 의해 f'(x) = cos(x^2) · 2x = 2x·cos(x^2)",
      "difficulty": "중"
    }
  ],
  "cards": [
    {
      "id": "calc-card-001",
      "deck": "calc",
      "front": "합성함수 미분법 공식",
      "back": "{f(g(x))}' = f'(g(x)) · g'(x)",
      "tag": "합성함수"
    }
  ]
}
```

### subject 값: "calculus", "english", "korean"
### deck 값: "calc" (미적분 공식), "vocab" (영단어), "korean" (화작), "engsum" (수특 요약)

---

## 2단계: 안티그래비티 자동화 프롬프트

안티그래비티에서 아래 프롬프트를 사용하세요. NotebookLM MCP가 연결되어 있으면 실제 교재 기반으로 생성됩니다.

### 문제 생성 프롬프트:
```
NotebookLM의 미적분 노트북을 참조해서, 오늘의 학습용 문제와 암기 카드를 생성해줘.

아래 JSON 형식으로 정확히 출력해줘:

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
  "cards": [
    {
      "id": "calc-card-[날짜]-[번호]",
      "deck": "calc",
      "front": "공식 이름 또는 문제",
      "back": "공식 내용 또는 답",
      "tag": "단원명"
    }
  ]
}

규칙:
- 문제 10개 (난이도 하/중/상 골고루)
- 카드 10개 (핵심 공식 + 자주 틀리는 포인트)
- id는 반드시 고유하게 (날짜+번호 조합)
- answer는 정답 인덱스 (0~3)
- 수학 공식은 텍스트: f'(x), dy/dx, lim(x→a) 등
- 시험 범위: 미분계수, 도함수, 접선, 합성/매개변수/음함수/역함수/삼각/지수/로그 미분
```

### 영단어 카드 프롬프트:
```
수능특강 영어 노트북을 참조해서 영단어 카드를 생성해줘.

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

### 방법 A: 안티그래비티에서 직접 (가장 쉬움)
안티그래비티가 GitHub MCP도 지원하면:
```
위에서 생성한 JSON을 내 GitHub 레포 idongdong410-maker/study-hub의 data/feed.json 파일에 업데이트해줘.
```

### 방법 B: 수동 복사 (간단)
1. 안티그래비티에서 JSON 생성
2. GitHub 레포 → data/feed.json → 연필 아이콘 (Edit) → 붙여넣기 → Commit

### 방법 C: n8n 자동화 (완전 자동)
n8n 워크플로우:
1. Schedule Trigger (매일 아침 7시)
2. HTTP Request → Gemini API 호출 (위 프롬프트로)
3. GitHub Node → data/feed.json 업데이트

---

## 4단계: 앱에서 확인

Study Hub (index.html) 페이지를 열면 자동으로 feed.json을 읽어서:
- 새 문제 → StudyFlow 문제은행에 추가
- 새 카드 → MemoryFlow 덱에 추가

이미 추가된 항목은 id로 중복 체크해서 다시 안 들어감.

---

## 기존 수동 import도 계속 가능

자동화와 별개로, 각 앱의 "가져오기"/"추가" 탭에서 JSON을 직접 붙여넣는 것도 여전히 작동합니다.
