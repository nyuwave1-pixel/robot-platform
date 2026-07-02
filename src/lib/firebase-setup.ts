// Firebase 초기화 및 유틸리티
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 익명 로그인
export const loginAnonymously = async () => {
  try {
    const { signInAnonymously } = await import('firebase/auth');
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('로그인 실패:', error);
    throw error;
  }
};

// RP Points 조회
export const getRPPoints = async (userId: string) => {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.data()?.rpPoints || 0;
  } catch (error) {
    console.error('포인트 조회 실패:', error);
    return 0;
  }
};

// RP Points 추가
export const addRPPoints = async (userId: string, points: number) => {
  try {
    const { doc, setDoc, getDoc, increment } = await import('firebase/firestore');
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      await setDoc(
        userRef,
        { rpPoints: increment(points), updatedAt: new Date() },
        { merge: true }
      );
    } else {
      await setDoc(userRef, {
        rpPoints: points,
        createdAt: new Date(),
        displayName: 'Anonymous',
      });
    }
  } catch (error) {
    console.error('포인트 추가 실패:', error);
    throw error;
  }
};

export { auth, db, app };
