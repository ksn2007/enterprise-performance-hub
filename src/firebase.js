import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAjhwXoRSnxA7ZSV9Qr4XsB8le9zQYnIrI",
    authDomain: "goal-connect-20afe.firebaseapp.com",
    projectId: "goal-connect-20afe",
    storageBucket: "goal-connect-20afe.firebasestorage.app",
    messagingSenderId: "716239438421",
    appId: "1:716239438421:web:a620c6bfe19d98be888adc",
    measurementId: "G-HVKBPT3E61"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);