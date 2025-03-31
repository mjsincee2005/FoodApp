import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCLdT3xk5j2WIxfNHrGSYOBPFYhGO4zO1s",
  authDomain: "foodapp-61348.firebaseapp.com",
  projectId: "foodapp-61348",
  storageBucket: "foodapp-61348.firebasestorage.app",
  messagingSenderId: "878710098014",
  appId: "1:878710098014:web:2795550702480ac55d8ccf",
  measurementId: "G-W7349BP3P9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

// Global switchTab function
window.switchTab = function(tabId) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
};

onAuthStateChanged(auth, (user) => {
  console.log('Auth state changed:', user ? 'Logged in' : 'Logged out');
  if (user) {
    const userDocRef = doc(db, 'users', user.uid);
    getDoc(userDocRef).then((docSnapshot) => {
      if (docSnapshot.exists() && docSnapshot.data().isFirstTime === false) {
        const nickname = docSnapshot.data().nickname;
        document.getElementById('greeting').innerText = `Hello, ${nickname}!`;
        window.switchTab('tab-5');
      } else {
        window.switchTab('tab-3');
      }
    }).catch(err => console.error('Firestore error:', err));
  } else {
    window.switchTab('tab-2');
  }
});