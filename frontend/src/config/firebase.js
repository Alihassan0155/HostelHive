import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_FIREBASE_APP_ID,
//   databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
// };
const firebaseConfig = {
  apiKey: "AIzaSyC7cx_udzzootlM1w71CZAqqrWmsLK-uSQ",
  authDomain: "hostelhive-5edc1.firebaseapp.com",
  databaseURL: "https://hostelhive-5edc1-default-rtdb.firebaseio.com",
  projectId: "hostelhive-5edc1",
  storageBucket: "hostelhive-5edc1.firebasestorage.app",
  messagingSenderId: "449524908540",
  appId: "1:449524908540:web:3a7808eebed8835a1a3279",
  measurementId: "G-MZTDBZ2JPP"
};

// Validate that required config is present
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_API_KEY_HERE') {
  console.error('❌ Firebase API Key is missing! Please configure frontend/.env file');
  console.error('📖 See frontend/GET_FIREBASE_CONFIG.md for instructions');
}

// Debug: Log config (remove in production)
if (import.meta.env.DEV) {
  console.log('Firebase Config:', {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'MISSING',
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId,
  });
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  throw error;
}

// Initialize Firebase Authentication with error handling
let auth;
try {
  auth = getAuth(app);
} catch (error) {
  console.warn('⚠️ Firebase Auth initialization warning:', error.message);
  // Still export auth even if there's a warning
  auth = getAuth(app);
}

export { auth };
export default app;

