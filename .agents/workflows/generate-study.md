---
description: NotebookLM 교재 기반으로 오늘의 학습 문제와 암기 카드를 자동 생성하고 GitHub에 push
---

# /generate-study 워크플로우

이 워크플로우는 NotebookLM MCP를 통해 **실제 교재 기반** 학습 컨텐츠를 자동 생성합니다.

## 사전 준비
- `data/config.json`에서 시험 범위와 일일 분량을 확인합니다.
- 시험 범위가 설정되지 않았으면 노트북 전체에서 출제합니다.

## 실행 단계

### 1단계: 설정 로드
- `data/config.json` 파일을 읽어 시험 범위(`exam_ranges`)와 일일 분량(`daily_quota`)을 확인합니다.
- `data/feed.json` 파일을 읽어 기존 데이터의 id 목록을 파악합니다 (중복 방지).
- 오늘 날짜를 YYYYMMDD 형식으로 준비합니다.

### 2단계: 미적분 컨텐츠 생성
- NotebookLM MCP의 `ask_question` 도구로 **미적분 - 미분법** 노트북(notebook_url: `https://notebooklm.google.com/notebook/b7c4a509-91f3-42c7-9df4-cdc2891fa779`)에 아래 질문을 합니다:

```
오늘 학습할 단원 1개를 골라서 아래 내용을 만들어줘:

1. 해당 단원의 핵심 개념 카드 (공식, 정의, 핵심 포인트)
2. 단계별 문제 3개 (하/중/상 각 1개씩)

반드시 아래 JSON 형식으로만 출력해:
{
  "questions": [
    {"id":"calc-{오늘날짜}-NUM","subject":"calculus","topic":"단원명","question":"문제","options":["a","b","c","d"],"answer":0,"explanation":"상세 풀이","difficulty":"하/중/상"}
  ],
  "cards": [
    {"id":"calc-card-{오늘날짜}-NUM","deck":"calc","front":"공식/개념 이름","back":"내용","tag":"단원명"}
  ]
}

규칙:
- 교재에 있는 실제 문제 유형과 난이도를 참고해서 만들어줘
- answer는 정답 인덱스 (0~3)
- 수학 공식은 텍스트: f'(x), dy/dx, lim(x->a) 등
- id의 NUM은 001부터 순서대로
- 어제까지 다룬 단원과 겹치지 않게 새로운 단원을 선택해줘
```

- config.json에 시험 범위가 설정되어 있으면 질문에 "시험 범위: [범위]" 를 추가합니다.

### 3단계: 영어 컨텐츠 생성
- NotebookLM MCP의 `ask_question` 도구로 **영어 - 수능특강** 노트북(notebook_url: `https://notebooklm.google.com/notebook/6d79c301-01b6-4e9b-bd4e-70b96d3aff71`)에 아래 질문을 합니다:

```
오늘 학습할 지문 4개를 골라서 아래 내용을 만들어줘:

1. 각 지문의 요약/분석 카드 (주제, 핵심 논지, 주요 어휘)
2. 각 지문에서 문제 1개씩 (빈칸추론/순서배열/문장삽입/어휘 등 다양하게)

반드시 아래 JSON 형식으로만 출력해:
{
  "questions": [
    {"id":"eng-{오늘날짜}-NUM","subject":"english","topic":"유형명","question":"문제 내용","options":["a","b","c","d"],"answer":0,"explanation":"풀이","difficulty":"중"}
  ],
  "cards": [
    {"id":"eng-card-{오늘날짜}-NUM","deck":"engsum","front":"지문 제목/주제","back":"요약: ...\n핵심 논지: ...\n주요 어휘: ...","tag":"강 번호"}
  ]
}

규칙:
- 교재의 실제 지문 내용을 기반으로 만들어줘
- 지문당 분석 카드 1개 + 문제 1개
- 어제까지 다룬 지문과 겹치지 않게 새로운 지문을 선택해줘
- answer는 정답 인덱스 (0~3)
- id의 NUM은 001부터 순서대로
```

### 4단계: 화법과 작문 컨텐츠 생성
- NotebookLM MCP의 `ask_question` 도구로 **화법과 작문** 노트북(notebook_url: `https://notebooklm.google.com/notebook/a7a7587b-bc92-4cdb-807c-a71a6756c274`)에 아래 질문을 합니다:

```
오늘 학습할 지문 2개를 골라서 아래 내용을 만들어줘:

1. 각 지문의 분석 카드 (화법/작문 유형, 핵심 개념, 출제 포인트)
2. 각 지문에서 문제 1개씩

반드시 아래 JSON 형식으로만 출력해:
{
  "questions": [
    {"id":"kor-{오늘날짜}-NUM","subject":"korean","topic":"단원명","question":"문제 내용","options":["a","b","c","d"],"answer":0,"explanation":"풀이","difficulty":"중"}
  ],
  "cards": [
    {"id":"kor-card-{오늘날짜}-NUM","deck":"korean","front":"지문 유형/주제","back":"분석: ...\n핵심 개념: ...\n출제 포인트: ...","tag":"화법/작문"}
  ]
}

규칙:
- 교재의 실제 지문 내용을 기반으로 만들어줘
- 지문당 분석 카드 1개 + 문제 1개
- answer는 정답 인덱스 (0~3)
- id의 NUM은 001부터 순서대로
```

### 5단계: feed.json 병합
- 각 단계에서 받은 JSON 응답에서 questions와 cards를 추출합니다.
- 기존 `data/feed.json`의 데이터와 병합합니다:
  - `lastUpdated`를 현재 ISO 시간으로 갱신
  - 새 questions를 기존 questions 배열 뒤에 추가 (id 중복 제거)
  - 새 cards를 기존 cards 배열 뒤에 추가 (id 중복 제거)
- 병합된 JSON을 `data/feed.json`에 저장합니다.

### 6단계: GitHub Push
// turbo-all
```powershell
git add data/feed.json data/config.json
git commit -m "auto: daily study feed update"
git push origin main
```

### 7단계: 결과 보고
- 생성된 컨텐츠를 과목별로 요약하여 보고합니다:
  - 미적분: 오늘 단원, 문제 수, 카드 수
  - 영어: 오늘 지문 목록, 문제 수, 카드 수
  - 화작: 오늘 지문 목록, 문제 수, 카드 수
  - 전체: 총 새로 추가된 문제/카드 수
