import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, query, where } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyBtqau9aCu_ISs97cT0fB3iMPacSbxegJc",
    authDomain: "online-student-learning.firebaseapp.com",
    projectId: "online-student-learning",
    storageBucket: "online-student-learning.firebasestorage.app",
    messagingSenderId: "333972164119",
    appId: "1:333972164119:web:5e12f8ed74a095ed3c1652",
    measurementId: "G-DE44VYTB6G"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
