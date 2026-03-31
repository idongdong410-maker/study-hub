# Study Hub 📚

중간고사 올인 모드 — 자동화 공부 시스템

## 구성
- `index.html` — 허브 (자동 동기화)
- `study.html` — StudyFlow (문제 풀기 + 오답)
- `memory.html` — MemoryFlow (암기 간격반복)
- `data/feed.json` — 자동화 데이터 피드
- `AUTOMATION.md` — 자동화 설정 가이드

## 자동화 파이프라인
안티그래비티/n8n → NotebookLM/Gemini → feed.json 업데이트 → 앱 자동 동기화

## 접속
`https://idongdong410-maker.github.io/study-hub/`

## 사용법
1. AUTOMATION.md 읽고 자동화 설정
2. 또는 각 앱의 "가져오기" 탭에서 수동 import
