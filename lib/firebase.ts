// ─────────────────────────────────────────────────────────────────────────────
// Firebase Admin SDK 초기화 (서버 전용 — API 라우트 & 서버 컴포넌트)
//
// 필요한 환경 변수 (.env.local):
//   FIREBASE_PROJECT_ID      Firebase 프로젝트 ID
//   FIREBASE_CLIENT_EMAIL    서비스 계정 이메일
//   FIREBASE_PRIVATE_KEY     서비스 계정 개인 키 (개행 포함 원본 문자열)
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function createApp(): App {
  const projectId   = process.env.FIREBASE_PROJECT_ID!;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
  // 환경 변수에서 \n 이스케이프를 실제 개행 문자로 변환
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n');

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

// Hot-reload 대비 싱글턴 패턴 (Next.js dev 모드에서 중복 초기화 방지)
const app: App = getApps().length === 0 ? createApp() : getApps()[0];

export const db: Firestore = getFirestore(app);
