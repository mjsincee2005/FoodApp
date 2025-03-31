import { auth, db } from './firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { collection, addDoc, setDoc, doc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

// Replace with your actual JSON data
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-storage.js";
const storage = getStorage();
let foodData;
getDownloadURL(ref(storage, 'food_data.json'))
  .then(url => fetch(url).then(res => res.json()))
  .then(data => foodData = data)
  .catch(err => console.error('Error loading JSON:', err));

// Authentication
function signUp() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => console.log('Sign-up successful'))
    .catch(err => alert(err.message));
}

function signIn() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => console.log('Sign-in successful'))
    .catch(err => alert(err.message));
}

function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then(() => console.log('Google sign-in successful'))
    .catch(err => alert(err.message));
}

function signOutUser() {
  signOut(auth).then(() => console.log('Signed out'));
}

// Profile Setup (Tab-3)
function saveProfile() {
  const name = document.getElementById('name').value;
  const gender = document.getElementById('gender').value;
  const nickname = document.getElementById('nickname').value;
  const user = auth.currentUser;

  if (user && name && gender && nickname) {
    setDoc(doc(db, 'users', user.uid), {
      name, gender, nickname, isFirstTime: true
    }, { merge: true }).then(() => {
      console.log('Profile saved');
      window.switchTab('tab-4');
    }).catch(err => alert(err.message));
  } else {
    alert('Please fill all fields');
  }
}

// Medical Data (Tab-4)
function saveMedicalData() {
  const age = document.getElementById('age').value;
  const height = document.getElementById('height').value;
  const weight = document.getElementById('weight').value;
  const conditions = document.getElementById('conditions').value;
  const user = auth.currentUser;

  if (user && age && height && weight) {
    setDoc(doc(db, 'users', user.uid), {
      age, height, weight, conditions, isFirstTime: false
    }, { merge: true }).then(() => {
      console.log('Medical data saved');
      document.getElementById('greeting').innerText = `Hello, ${nickname || 'User'}!`;
      window.switchTab('tab-5');
    }).catch(err => alert(err.message));
  } else {
    alert('Please fill all required fields');
  }
}

// Tab-5: Food Search
document.getElementById('food-search').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const matches = foodData.Sheet1.filter(food => 
    food.food_name.toLowerCase().includes(query)
  ).slice(0, 5);
  const dropdown = document.getElementById('dropdown');
  dropdown.innerHTML = matches.map(food => 
    `<div onclick="showFoodDialog('${food.food_code}')">${food.food_name}</div>`
  ).join('');
});

function showFoodDialog(foodCode) {
  const food = foodData.Sheet1.find(f => f.food_code === foodCode);
  const dialog = document.getElementById('food-dialog');
  dialog.innerHTML = `
    <h3>${food.food_name}</h3>
    <p>Calories: <span id="cal">${food.unit_serving_energy_kcal}</span> kcal</p>
    <p>Protein: ${food.unit_serving_protein_g} g</p>
    <input type="number" id="quantity" value="1" min="1" onchange="updateNutrients('${foodCode}')">
    <p id="suggestion"></p>
    <button onclick="addFood('${foodCode}')">Add</button>
    <button onclick="document.getElementById('food-dialog').style.display='none'">Close</button>
  `;
  dialog.style.display = 'block';
}

function updateNutrients(foodCode) {
  const food = foodData.Sheet1.find(f => f.food_code === foodCode);
  const qty = document.getElementById('quantity').value;
  const calories = (food.unit_serving_energy_kcal * qty).toFixed(2);
  document.getElementById('cal').innerText = calories;
  document.getElementById('suggestion').innerText = 
    calories > 500 ? 'This is a lot for one serving!' : '';
}

function addFood(foodCode) {
  const food = foodData.Sheet1.find(f => f.food_code === foodCode);
  const qty = document.getElementById('quantity').value;
  dailyNutrients.calories += food.unit_serving_energy_kcal * qty;
  dailyNutrients.protein += food.unit_serving_protein_g * qty;

  document.getElementById('calories').innerText = dailyNutrients.calories.toFixed(2);
  document.getElementById('protein').innerText = dailyNutrients.protein.toFixed(2);
  document.getElementById('health-rating').innerText = 
    dailyNutrients.calories > 2000 ? 'Over' : 'Good';

  const user = auth.currentUser;
  if (user) {
    addDoc(collection(db, 'users', user.uid, 'intake'), {
      foodCode, qty, timestamp: new Date()
    }).catch(err => console.error(err));
  }
  document.getElementById('food-dialog').style.display = 'none';
}

// Tab-6: Meal Planner
function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text('Meal Plan - Week', 10, 10);
  doc.text('Basic placeholder - expand this later', 10, 20);
  doc.save('meal_plan.pdf');
}

// Tab-7: History
document.getElementById('time-filter').addEventListener('change', () => {
  const ctx = document.getElementById('history-chart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Calories', 'Protein'],
      datasets: [{
        label: 'Daily Intake',
        data: [dailyNutrients.calories, dailyNutrients.protein],
        backgroundColor: ['#ff6384', '#36a2eb']
      }]
    },
    options: {
      scales: { y: { beginAtZero: true } }
    }
  });
});