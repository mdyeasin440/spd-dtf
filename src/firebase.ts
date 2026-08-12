import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDa6AKD-cVO5fm1dN8jcoXylx4GFdP5Z3Q",
  authDomain: "spidey-dtf.firebaseapp.com",
  projectId: "spidey-dtf",
  storageBucket: "spidey-dtf.firebasestorage.app",
  messagingSenderId: "241768851793",
  appId: "1:241768851793:web:1579f0b311bada8134cb70"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
