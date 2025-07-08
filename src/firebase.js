

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCo8mk4Jk69FtZOglGaYZLjEJJwKztcUZ0",
  authDomain: "medicalchatbot-40312.firebaseapp.com",
  projectId: "medicalchatbot-40312",
  storageBucket: "medicalchatbot-40312.appspot.com",
  messagingSenderId: "462810332921",
  appId: "1:462810332921:web:9b3a28a42cc1b9f8216c28"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

//Export Firebase services
export { auth, db, storage };
