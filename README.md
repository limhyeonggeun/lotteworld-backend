# 롯데월드 백엔드 서버 (LotteWorld Backend)

본 프로젝트는 롯데월드 모바일 앱과 관리자 웹에서 사용하는  
회원·티켓·알림·운휴 등 서비스 전반의 데이터를 처리하는  
REST API 기반 백엔드 서버입니다.

---

## Base URL (Production)
https://lotteworld-backend-production.up.railway.app

모바일 앱(React Native)과 관리자 페이지(Next.js)는  
모두 해당 API 엔드포인트를 통해 서버와 통신합니다.

---

## 주요 기능

### 1. 사용자 인증·관리
- JWT 기반 로그인/회원 인증
- 이메일 인증(Verification Code) 처리
- 사용자 정보 조회·수정
- 회원 상태 변경 기능
- 관리자 계정 및 권한 구분

### 2. 티켓 / 예매 관리
- 티켓 조회 및 예약 생성
- 결제 완료 처리 흐름 연동
- 티켓 등록 및 수정
- 방문일·인원·옵션 관리
- 어트랙션/콘텐츠 운휴 정보 등록·수정

### 3. 알림 관리 (FCM)
- Firebase FCM 실시간 푸시 발송
- 알림함 연동 및 발송 이력 저장

---

## 기술 스택

### Backend
- Node.js / Express
- JWT 인증 방식 적용
- Nodemailer 기반 이메일 인증

### Database
- MariaDB  
- Sequelize ORM 모델 구성  
  (Users, Tickets, Ticket_Register_Logs, Notifications, POIs, Schedules, Announcements, Admin_Users 등)

### Infra / Deploy
- Railway PaaS 환경 배포
- GitHub 연동 자동 배포
- 환경 변수 기반 설정

### External Services
- Firebase Cloud Messaging (FCM)
- SMTP(Nodemailer) 이메일 인증

---
