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
                        <a href="#" class="dropdown-item">Profile</a>
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
        alert(result.message);
        if (response.ok) window.location.href = 'login.html';
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
            window.location.href = 'index.html';
        } else {
            alert(result.message);
        }
    });
}