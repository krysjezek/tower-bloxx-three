// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAWq_KV5MWccFgWUjevpB7x9WEOFNkADNk",
  authDomain: "tower-bloxx-three.firebaseapp.com",
  projectId: "tower-bloxx-three",
  storageBucket: "tower-bloxx-three.appspot.com",
  messagingSenderId: "994521676192",
  appId: "1:994521676192:web:19e0bc3f81d0209d7b8cc5",
  measurementId: "G-YL79CLL8T3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export default getFirestore(app);