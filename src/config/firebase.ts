import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Firebase 설정 (실제 프로젝트에서는 환경변수로 관리)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 내보내기
export const database = getDatabase(app);
export const auth = getAuth(app);
export default app; 