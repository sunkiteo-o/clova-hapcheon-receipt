# 회계를 부탁해 😎

서울 중앙 교회 그루터기 2026 하기봉사 회계 관리 웹앱.  
영수증을 촬영하면 Vercel Blob에 저장하고, 장부·증빙 Google Sheets에 자동 기록합니다.

## 흐름

구분 선택 → 영수증 촬영 → 내용 입력 → 저장  
→ 장부 시트(지출 기록) + 증빙 시트(이미지 수식) 동시 기록

## 실행

```bash
pnpm install
pnpm dev
```

## 환경 변수 (`.env.local`)

```env
# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
SHEET_ID_JANGBU=
SHEET_ID_JEUNGBING=

# 시트 바로가기 링크
NEXT_PUBLIC_JANGBU_URL=
NEXT_PUBLIC_JEUNGBING_URL=

# 로그인
APP_PASSWORD=

# Vercel Blob
BLOB_READ_WRITE_TOKEN=
```

## 시트 연결 테스트

```bash
pnpm test:sheet          # 장부 더미 행 추가
pnpm tsx scripts/test-blob-image.ts  # Blob 업로드 + 이미지 수식 삽입
```
