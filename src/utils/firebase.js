// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCqgUEJFohM5pgwqYipXeUVEpUlX7o2NA0",
  authDomain: "hd2-attrition.firebaseapp.com",
  databaseURL: "https://hd2-attrition-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "hd2-attrition",
  storageBucket: "hd2-attrition.firebasestorage.app",
  messagingSenderId: "375272568229",
  appId: "1:375272568229:web:ed4e276fcc664f5e5be44c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);