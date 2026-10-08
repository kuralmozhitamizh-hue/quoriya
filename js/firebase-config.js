import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCQjtLtpQI1ieMwUezerXMM4rKnR-NL97s",
  authDomain: "quoriya-16d14.firebaseapp.com",
  projectId: "quoriya-16d14",
  storageBucket: "quoriya-16d14.firebasestorage.app",
  messagingSenderId: 794743790799",
  appId: "1:794743790799:web:e62b91a5132232f272abba"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

export {
  app,
  auth,
  db
};