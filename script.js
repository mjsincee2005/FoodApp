// Load JSON data
let foodData = [];
fetch('food_data.json')
    .then(response => response.json())
    .then(data => {
        foodData = data.Sheet1;
        initDashboard();
        initPlanner();
    });

// User data storage
let user = JSON.parse(localStorage.getItem('user')) || {};
let meals = JSON.parse(localStorage.getItem('meals')) || [];

// Login
function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if (email && password) {
        localStorage.setItem('loggedIn', 'true');
        location.href = 'profile.html';
    }
}

// Save Profile
function saveProfile() {
    user.name = document.getElementById('name').value;
    user.gender = document.getElementById('gender').value;
    user.nickname = document.getElementById('nickname').value;
    localStorage.setItem('user', JSON.stringify(user));
    location.href = 'data.html';
}

// Save Personal Data
function saveData() {
    user.height = document.getElementById('height').value;
    user.weight = document.getElementById('weight').value;
    user.age = document.getElementById('age').value;
    user.activity = document.getElementById('activity').value;
    user.diet = document.getElementById('diet').value;
    localStorage.setItem('user', JSON.stringify(user));
    location.href = 'dashboard.html';
}

// Dashboard Initialization
function initDashboard() {
    if (document.getElementById('greeting')) {
        document.getElementById('greeting').textContent = `Hello, ${user.nickname || 'User'}!`;
        const searchInput = document.getElementById('foodSearch');
        const resultsDiv = document.getElementById('searchResults');
        
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            resultsDiv.innerHTML = '';
            if (query.length > 2) {
                const results = foodData.filter(food => food.food_name.toLowerCase().includes(query));
                results.forEach(food => {
                    const div = document.createElement('div');
                    div.className = 'food-item';
                    div.textContent = `${food.food_name} - ${food.energy_kcal} kcal`;
                    div.onclick = () => addFood(food);
                    resultsDiv.appendChild(div);
                });
            }
        });

        updateSummary();
    }
}

function addFood(food) {
    meals.push({ ...food, date: new Date().toISOString().split('T')[0] });
    localStorage.setItem('meals', JSON.stringify(meals));
    updateSummary();
}

function updateSummary() {
    const today = new Date().toISOString().split('T')[0];
    const todayMeals = meals.filter(m => m.date === today);
    const totalCal = todayMeals.reduce((sum, m) => sum + m.energy_kcal, 0);
    const totalProt = todayMeals.reduce((sum, m) => sum + m.protein_g, 0);

    document.getElementById('calories').textContent = `${totalCal.toFixed(1)} / 2000`;
    document.getElementById('calProgress').style.width = `${(totalCal / 2000) * 100}%`;
    document.getElementById('protein').textContent = `${totalProt.toFixed(1)}g / 80g`;
    document.getElementById('protProgress').style.width = `${(totalProt / 80) * 100}%`;
}

// Meal Planner Initialization
function initPlanner() {
    if (document.getElementById('foodList')) {
        const foodList = document.getElementById('foodList');
        foodData.slice(0, 5).forEach(food => { // Show first 5 for demo
            const div = document.createElement('div');
            div.className = 'draggable';
            div.setAttribute('draggable', 'true');
            div.textContent = food.food_name;
            div.dataset.food = JSON.stringify(food);
            foodList.appendChild(div);
        });

        interact('.draggable').draggable({
            listeners: {
                move(event) {
                    const target = event.target;
                    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                    const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                    target.style.transform = `translate(${x}px, ${y}px)`;
                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);
                }
            }
        });

        interact('.meal-day').dropzone({
            ondrop(event) {
                const food = JSON.parse(event.relatedTarget.dataset.food);
                const day = event.target.dataset.day;
                meals.push({ ...food, day });
                localStorage.setItem('meals', JSON.stringify(meals));
                event.target.appendChild(event.relatedTarget);
            }
        });
    }
}

function exportPlan() {
    const plan = meals.filter(m => m.day).map(m => `${m.day}: ${m.food_name}`).join('\n');
    const blob = new Blob([plan], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'meal_plan.pdf';
    link.click();
}

// History Chart
let chart;
function updateChart() {
    const start = document.getElementById('startDate').value;
    const end = document.getElementById('endDate').value;
    const filteredMeals = meals.filter(m => m.date >= start && m.date <= end);

    const dates = [...new Set(filteredMeals.map(m => m.date))];
    const calData = dates.map(date => 
        filteredMeals.filter(m => m.date === date).reduce((sum, m) => sum + m.energy_kcal, 0)
    );

    if (chart) chart.destroy();
    chart = new Chart(document.getElementById('nutritionChart'), {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Calories',
                data: calData,
                borderColor: '#2ecc71',
                fill: false
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}