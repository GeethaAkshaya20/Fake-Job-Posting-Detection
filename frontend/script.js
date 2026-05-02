// Check if user is logged in on page load
function checkLoginStatus() {
    const userName = localStorage.getItem('userName');
    const authNavItem = document.getElementById('auth-nav-item');
    const formSection = document.getElementById('form-section');
    const loginRequiredSection = document.getElementById('login-required-section');

    if (authNavItem) {
        if (userName) {
            // User is logged in - show user menu
            authNavItem.innerHTML = `
                <div class="user-menu">
                    <button class="user-button" onclick="toggleUserDropdown(event)">
                        <span class="user-avatar">👤</span>
                        <span class="user-name">${userName}</span>
                        <span class="dropdown-arrow">▼</span>
                    </button>
                    <div class="user-dropdown" id="user-dropdown">
                        <a href="profile.html" class="dropdown-item">Profile</a>
                        <a href="#" class="dropdown-item">Settings</a>
                        <hr style="margin: 8px 0; border: none; border-top: 1px solid var(--input)">
                        <button class="dropdown-item" onclick="logout()">Logout</button>
                    </div>
                </div>
            `;
        } else {
            // User is not logged in - show login button
            authNavItem.innerHTML = `<button type="button" class="nav-button" onclick="window.location.href='login.html'">Login</button>`;
        }
    }

    if (formSection && loginRequiredSection) {
        if (userName) {
            formSection.style.display = 'block';
            loginRequiredSection.style.display = 'none';
        } else {
            formSection.style.display = 'none';
            loginRequiredSection.style.display = 'block';
        }
    }
}

// Toggle user dropdown menu
function toggleUserDropdown(event) {
    event.preventDefault();
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

// Logout function
function logout() {
    localStorage.removeItem('userName');
    window.location.href = 'index.html';
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.querySelector('.user-menu');
    const dropdown = document.getElementById('user-dropdown');
    if (userMenu && !userMenu.contains(event.target) && dropdown) {
        dropdown.style.display = 'none';
    }
});

// Call on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkLoginStatus);
} else {
    checkLoginStatus();
}

// Function to show in-page messages
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `message-notification ${type}`;
        messageDiv.classList.add('show');
        setTimeout(() => {
            messageDiv.classList.remove('show');
        }, 3000); // Disappear after 3 seconds
    }
}

// Dark Mode Toggle
const darkModeCheckbox = document.getElementById('darkmode-checkbox');
const darkModeCheckboxMenu = document.getElementById('darkmode-checkbox-menu');
const hamburgerMenu = document.getElementById('hamburger-menu');
const navMenu = document.getElementById('nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const body = document.body;

// Load dark mode preference from localStorage
const isDarkMode = localStorage.getItem('darkMode') === 'true';
if (isDarkMode) {
    body.classList.add('dark-mode');
    if (darkModeCheckbox) darkModeCheckbox.checked = true;
    if (darkModeCheckboxMenu) darkModeCheckboxMenu.checked = true;
}

// Toggle dark mode
if (darkModeCheckbox) {
    darkModeCheckbox.addEventListener('change', function() {
        body.classList.toggle('dark-mode');
        if (darkModeCheckboxMenu) darkModeCheckboxMenu.checked = this.checked;
        localStorage.setItem('darkMode', body.classList.contains('dark-mode'));
    });
}

// Sync menu checkbox with navbar checkbox
if (darkModeCheckboxMenu) {
    darkModeCheckboxMenu.addEventListener('change', function() {
        body.classList.toggle('dark-mode');
        if (darkModeCheckbox) darkModeCheckbox.checked = this.checked;
        localStorage.setItem('darkMode', body.classList.contains('dark-mode'));
        // Close menu after toggle
        if (hamburgerMenu) hamburgerMenu.classList.remove('active');
        if (navMenu) navMenu.classList.remove('active');
    });
}

// Hamburger Menu Toggle
if (hamburgerMenu) {
    hamburgerMenu.addEventListener('click', function() {
        hamburgerMenu.classList.toggle('active');
        if (navMenu) navMenu.classList.toggle('active');
    });
}

// Close menu when a nav link is clicked
navLinks.forEach(link => {
    link.addEventListener('click', function() {
        if (hamburgerMenu) hamburgerMenu.classList.remove('active');
        if (navMenu) navMenu.classList.remove('active');
    });
});

// Close menu when clicking outside
document.addEventListener('click', function(event) {
    const navbar = document.querySelector('.navbar');
    if (navbar && !navbar.contains(event.target) && navMenu && navMenu.classList.contains('active')) {
        if (hamburgerMenu) hamburgerMenu.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

//registration
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const response = await fetch('http://127.0.0.1:5000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password })
        });

        const result = await response.json();
        showMessage(result.message, response.ok ? 'success' : 'error');
        if (response.ok) setTimeout(() => window.location.href = 'login.html', 3000);
    });
}

//login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const response = await fetch('http://127.0.0.1:5000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();
        if (response.ok) {
            localStorage.setItem('userName', result.user);
            localStorage.setItem('userEmail', email);
            window.location.href = 'index.html';
        } else {
            showMessage(result.message, 'error');
        }
    });
}

// Prediction form handler
const predictionForm = document.getElementById('prediction-form');
if (predictionForm) {
    predictionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const company = document.getElementById('company').value;
        const experience = document.getElementById('experience').value;
        const salary = document.getElementById('salary').value;
        const description = document.getElementById('description').value;
        const requirements = document.getElementById('requirements').value;
        const userEmail = localStorage.getItem('userEmail') || '';

        console.log('Prediction form submitted');
        console.log('Form data:', { title, company, experience, salary, description, userEmail });

        try {
            const response = await fetch('http://127.0.0.1:5000/predict-and-save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    company,
                    experience,
                    salary,
                    description,
                    requirements,
                    userEmail
                })
            });

            console.log('Response status:', response.status);
            const result = await response.json();
            console.log('Response data:', result);

            if (result.prediction === 'INVALID INPUT') {
                showMessage(result.message, 'error');
                return;
            }

            // Display result
            displayPredictionResult(result);
        } catch (error) {
            console.error('Error submitting prediction:', error);
            showMessage('Error analyzing job posting', 'error');
        }
    });
}

// Function to display prediction result
function displayPredictionResult(result) {
    const resultSection = document.getElementById('result-section');
    const statusBadge = document.getElementById('status-badge');
    const statusText = document.getElementById('status-text');
    const probabilityValue = document.getElementById('probability-value');
    const progressFill = document.getElementById('progress-fill');
    const keywordsList = document.getElementById('keywords-list');

    // Update status badge
    statusBadge.className = 'status-badge ' + result.prediction.toLowerCase();
    const statusEmoji = result.prediction === 'FAKE' ? '❌' : result.prediction === 'REAL' ? '✅' : '⚠️';
    statusText.textContent = statusEmoji + ' ' + result.prediction;

    // Update probability
    const probability = result.probability || 0;
    probabilityValue.textContent = probability.toFixed(1) + '%';
    progressFill.style.width = probability + '%';

    // Update keywords
    keywordsList.innerHTML = '';
    if (result.keywords && result.keywords.length > 0) {
        result.keywords.forEach(kw => {
            const keyword = document.createElement('span');
            keyword.className = 'keyword-badge ' + kw.type;
            keyword.textContent = kw.word;
            keywordsList.appendChild(keyword);
        });
    }

    // Show result section
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

// Close result and reset form
const closeResultBtn = document.getElementById('close-result-btn');
if (closeResultBtn) {
    closeResultBtn.addEventListener('click', () => {
        document.getElementById('result-section').classList.add('hidden');
        document.getElementById('prediction-form').reset();
    });
}