// booking/auth.js

// DOM Elements
const loginFormContainer = document.getElementById('login-form');
const signupFormContainer = document.getElementById('signup-form');
const loginFormElement = document.getElementById('login-form-element');
const signupFormElement = document.getElementById('signup-form-element');
const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');

// Check if user is already logged in
checkExistingSession();

// Event Listeners
showSignupLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginFormContainer.style.display = 'none';
    signupFormContainer.style.display = 'block';
    clearErrors();
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    signupFormContainer.style.display = 'none';
    loginFormContainer.style.display = 'block';
    clearErrors();
});

loginFormElement.addEventListener('submit', handleLogin);
signupFormElement.addEventListener('submit', handleSignup);

// Functions
function checkExistingSession() {
    const session = localStorage.getItem('customer_session');
    if (session) {
        window.location.href = 'dashboard.html';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    loginError.classList.remove('show');
    
    try {
        const response = await fetch('/api/customer/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        // Save session
        localStorage.setItem('customer_session', JSON.stringify(data));
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = error.message;
        loginError.classList.add('show');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const phone = document.getElementById('signup-phone').value;
    const address = document.getElementById('signup-address').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    signupError.classList.remove('show');
    
    // Validate password
    if (password.length < 6) {
        signupError.textContent = 'Password must be at least 6 characters';
        signupError.classList.add('show');
        return;
    }
    
    if (password !== confirmPassword) {
        signupError.textContent = 'Passwords do not match';
        signupError.classList.add('show');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';
    
    try {
        const response = await fetch('/api/customer/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                phone,
                address,
                password
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
        }
        
        // Save session
        localStorage.setItem('customer_session', JSON.stringify(data));
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Signup error:', error);
        signupError.textContent = error.message;
        signupError.classList.add('show');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
    }
}

function clearErrors() {
    loginError.classList.remove('show');
    signupError.classList.remove('show');
}