import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCo8mk4Jk69FtZOglGaYZLjEJJwKztcUZ0",
  authDomain: "medicalchatbot-40312.firebaseapp.com",
  projectId: "medicalchatbot-40312",
  storageBucket: "medicalchatbot-40312.appspot.com",
  messagingSenderId: "462810332921",
  appId: "1:462810332921:web:9b3a28a42cc1b9f8216c28"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
