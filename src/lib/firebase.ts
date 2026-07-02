import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 실제 Firebase 키가 설정됐는지 확인 (플레이스홀더/빈 값 방어)
// 로그인·회원가입 UI는 이 값으로 "데모 모드" 안내를 띄운다.
export const isFirebaseConfigured =
  !!firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.includes("xxxx") &&
  !firebaseConfig.apiKey.includes("YOUR_") &&
  !!firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes("your-project");

// 키가 없을 때도 앱이 죽지 않도록 안전한 플레이스홀더로 초기화한다.
// initializeApp 자체는 네트워크 호출을 하지 않으므로 데모 페이지는 정상 렌더된다.
// 실제 인증/DB 호출만 키가 있을 때 동작한다.
const safeConfig = isFirebaseConfigured
  ? firebaseConfig
  : {
      apiKey: "demo-mode-no-key",
      authDomain: "demo.firebaseapp.com",
      projectId: "demo-mode",
      storageBucket: "demo.appspot.com",
      messagingSenderId: "000000000000",
      appId: "1:000000000000:web:demomode",
    };

const app: FirebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp(safeConfig);

export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);

export default app;
