# 회계를 부탁해 😎

서울중앙교회 그루터기 2026 하기봉사 하동/합천/영동 지역 회계 관리 웹앱입니다.  
영수증을 촬영하면 연결된 하기봉사 장부·증빙 Google Sheets에 자동 기록합니다.  

## User Flow

[일반/ 취사] 구분 선택 → 영수증 촬영 → 내용 입력 → 저장 → 장부 시트(지출 기록), 증빙 시트(이미지 수식) 동시 저장 완료

<p align="center">
  <img width="400" alt="image" src="https://github.com/user-attachments/assets/f2c47cec-bfd1-4765-95a5-21741ba82718" />
</p>
## 기술 스택

- **프레임워크**: Next.js (App Router) + TypeScript
- **패키지 매니저**: pnpm
- **데이터 저장소**: Google Sheets — 최종 장부 역할, 별도 DB 없음
- **이미지 저장소**: Vercel Blob (영수증 이미지 호스팅)
- **배포**: Vercel
- **인증**: 단일 비밀번호 방식
  

## 실행

```bash
pnpm install
pnpm dev
```
