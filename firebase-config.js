import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAnAZm4cWyunE5ucturFEsKS6jbDnuvj0M",
  authDomain: "ethagentry.firebaseapp.com",
  projectId: "ethagentry",
  storageBucket: "ethagentry.firebasestorage.app",
  messagingSenderId: "915688964520",
  appId: "1:915688964520:web:2ebf3dbe362155c7dc5d9d"
};

export const EMPLOYEE_EMAIL = "ethagemployee@gmail.com";

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export { serverTimestamp };
