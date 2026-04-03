---
description: NotebookLM 없이 Claude 자체 지식으로 학습 문제와 암기 카드를 생성하고 GitHub에 push
---

# /generate-study-noNLM 워크플로우

이 워크플로우는 **NotebookLM MCP 없이** Claude 자체 지식으로 학습 컨텐츠를 생성합니다.
NotebookLM 연결이 안 될 때 또는 빠르게 문제를 보충할 때 사용하세요.

## 시험 범위 (고정)

### 미적분
- 수열의 극한
- 급수
- 여러 가지 함수의 미분
- 여러가지 미분법(음함수의 미분)까지

### 영어 (수능특강)
- 1강: 글의 목적 파악 / 2강: 심경 변화 파악 / 3강: 함축적 의미 파악
- 4강: 요지 파악 / 5강: 주장 파악 / 6강: 주제 파악 / 7강: 제목 파악
- 11강: 어법 정확성 파악 / 12강: 어휘 적절성 파악 / 13강: 빈칸 내용 추론
- 21강: 철학·역사 지문 / 22강: 환경·자원 지문 / 23강: 과학 지문 / 24강: 스포츠·레저 지문

## 실행 단계

### 1단계: 설정 로드
- `data/feed.json` 파일을 읽어 기존 데이터의 id 목록을 파악합니다 (중복 방지).
- 오늘 날짜를 YYYYMMDD 형식으로 준비합니다.

### 2단계: 미적분 컨텐츠 생성 (Claude 직접 생성)

시험 범위 중 오늘 학습할 단원 1개를 선택하고, 아래 형식으로 직접 생성합니다.
(기존에 생성된 문제가 적은 단원 우선 선택)

생성 내용:
1. 핵심 개념 카드 2~3개 (공식, 정의, 핵심 포인트)
2. 변형문제 3개:
   - 수치 변형 (하): 같은 풀이 방식, 숫자·계수만 변경
   - 조건 변형 (중): 함수 형태나 조건을 바꾼 유사 유형
   - 복합 변형 (상): 두 개념을 결합한 심화 문제
3. 핵심 개념 정리 1개

출력 JSON 형식:
```json
{
  "questions": [
    {
      "id": "calc-{오늘날짜}-001",
      "subject": "calculus",
      "topic": "단원명",
      "question": "문제 내용",
      "options": ["① a", "② b", "③ c", "④ d"],
      "answer": 0,
      "explanation": "상세 풀이",
      "difficulty": "하",
      "variationType": "수치변형"
    }
  ],
  "cards": [
    {
      "id": "calc-card-{오늘날짜}-001",
      "deck": "calc",
      "front": "공식/개념 이름",
      "back": "내용",
      "tag": "단원명"
    }
  ],
  "concepts": [
    {
      "id": "concept-calc-{오늘날짜}",
      "subject": "calculus",
      "topic": "단원명",
      "content": "## 핵심 개념\n...\n\n## 핵심 공식\n...\n\n## 풀이 포인트\n...\n\n## 예제\n...",
      "date": "{오늘날짜}"
    }
  ]
}
```

규칙:
- 수능 미적분 실제 출제 유형과 난이도에 맞게 생성
- 수학 공식은 텍스트: lim(n→∞), Σ, f'(x), dy/dx 등
- topic 이름은 시험 범위 이름 그대로
- answer는 정답 인덱스 (0~3)

### 3단계: 영어 컨텐츠 생성 (Claude 직접 생성)

시험 범위에서 오늘 학습할 강 4개를 선택하고 각 강마다 생성합니다.

생성 내용 (각 강마다):
1. 수능특강 해당 유형의 전형적인 지문 스타일로 문제 1개
2. 해당 유형의 학습 카드 1개
3. 유형별 풀이 전략 개념 1개

출력 JSON 형식:
```json
{
  "questions": [
    {
      "id": "eng-{오늘날짜}-001",
      "subject": "english",
      "topic": "유형명",
      "question": "문제 내용 (지문 포함)",
      "options": ["① a", "② b", "③ c", "④ d"],
      "answer": 0,
      "explanation": "풀이",
      "difficulty": "중"
    }
  ],
  "cards": [
    {
      "id": "eng-card-{오늘날짜}-001",
      "deck": "engsum",
      "front": "{강번호} / 지문 주제",
      "back": "요약: ...\n핵심 논지: ...\n주요 어휘: ...",
      "tag": "{강번호}강"
    }
  ],
  "concepts": [
    {
      "id": "concept-eng-{강번호}-{오늘날짜}",
      "subject": "english",
      "topic": "유형명",
      "content": "## 유형 특징\n...\n\n## 풀이 전략\n...\n\n## 핵심 표현\n...\n\n## 주의 사항\n...",
      "date": "{오늘날짜}"
    }
  ]
}
```

규칙:
- topic은 시험 범위 이름 그대로 (예: "글의 목적 파악")
- 수능 실제 출제 스타일에 맞는 지문과 선택지 구성
- 4개 강 각각 concept 1개씩 총 4개 생성

### 4단계: 화법과 작문 컨텐츠 생성 (Claude 직접 생성)

수능 화법과 작문 출제 유형에서 오늘 학습할 유형 2개를 선택합니다.
(토론, 면접, 강연, 대화, 설명문 작성, 논설문 작성 등)

생성 내용 (각 유형마다):
1. 유형 분석 카드 1개 (korean 덱)
2. 지문 요약 카드 1개 (korsum 덱)
3. 문제 1개

출력 JSON 형식:
```json
{
  "questions": [
    {
      "id": "kor-{오늘날짜}-001",
      "subject": "korean",
      "topic": "화법 이론",
      "question": "문제 내용",
      "options": ["① a", "② b", "③ c", "④ d"],
      "answer": 0,
      "explanation": "풀이",
      "difficulty": "중"
    }
  ],
  "cards": [
    {
      "id": "kor-card-{오늘날짜}-001",
      "deck": "korean",
      "front": "지문 유형/주제",
      "back": "분석: ...\n핵심 개념: ...\n출제 포인트: ...",
      "tag": "화법/작문"
    },
    {
      "id": "korsum-card-{오늘날짜}-001",
      "deck": "korsum",
      "front": "지문 제목 또는 주제",
      "back": "내용 요약: ...\n핵심 포인트: ...",
      "tag": "화법/작문"
    }
  ],
  "concepts": [
    {
      "id": "concept-kor-{오늘날짜}",
      "subject": "korean",
      "topic": "화법 이론",
      "content": "## 오늘의 유형 분석\n...\n\n## 핵심 개념 정리\n...\n\n## 출제 포인트\n...",
      "date": "{오늘날짜}"
    }
  ]
}
```

### 5단계: feed.json 병합
- 각 단계에서 생성한 JSON의 questions, cards, concepts를 추출합니다.
- 기존 `data/feed.json`과 병합합니다:
  - `lastUpdated`를 현재 ISO 시간으로 갱신
  - 새 항목을 기존 배열 뒤에 추가 (id 중복 제거)
- 병합된 JSON을 `data/feed.json`에 저장합니다.

### 6단계: GitHub Push
```bash
git add data/feed.json
git commit -m "auto: daily study feed update (noNLM) $(date +%Y-%m-%d)"
git push origin main
```

### 7단계: 결과 보고
- 생성된 컨텐츠를 과목별로 요약하여 보고합니다:
  - 미적분: 오늘 단원, 변형문제 3개, 카드 수
  - 영어: 오늘 강 목록, 문제 수, 카드 수
  - 화작: 오늘 유형 목록, 문제 수, 카드 수
  - 전체: 총 새로 추가된 문제/카드 수
