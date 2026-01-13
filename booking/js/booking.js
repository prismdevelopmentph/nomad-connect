// Global configuration and state
let CONFIG = null;
let supabase = null;
let currentUser = null;
let currentMonth = new Date();
let selectedStartDate = null;
let selectedEndDate = null;
let bookedDates = [];
let userBookings = [];

// Pricing
const pricing = {
    daily: 1500,
    weekly: 8500,
    monthly: 28000
};

// Load configuration from serverless function
async function loadConfig() {
    try {
        const response = await fetch('/api/config.js');
        CONFIG = await response.json();
        console.log('✅ Configuration loaded from environment variables');
        return true;
    } catch (error) {
        console.error('❌ Failed to load config from API:', error);
        // Fallback to hardcoded values if API fails
        CONFIG = {
            supabase: {
                url: 'YOUR_SUPABASE_URL',
                anonKey: 'YOUR_SUPABASE_ANON_KEY'
            }
        };
        console.warn('⚠️ Using fallback configuration');
        return false;
    }
}

// Initialize services after config is loaded
function initializeServices() {
    // Initialize Supabase
    if (window.supabase && CONFIG.supabase.url && CONFIG.supabase.url !== 'YOUR_SUPABASE_URL') {
        supabase = window.supabase.createClient(
            CONFIG.supabase.url, 
            CONFIG.supabase.anonKey
        );
        console.log('✅ Supabase initialized');
    } else {
        console.warn('⚠️ Supabase not configured - using demo mode');
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing Nomad Connect Booking System...');
    
    // Load config from API
    await loadConfig();
    
    // Initialize services
    initializeServices();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check user session
    checkUserSession();
    
    // Check URL hash for direct navigation
    checkUrlHash();
    
    console.log('✅ System initialized');
});

function checkUrlHash() {
    const hash = window.location.hash;
    if (!currentUser && hash === '#register') {
        console.log('📝 Showing registration form from URL');
        showRegister();
    } else if (!currentUser && hash === '#login') {
        console.log('🔐 Showing login form from URL');
        showLogin();
    }
}

function checkUserSession() {
    const userData = localStorage.getItem('nomad_user');
    if (userData) {
        currentUser = JSON.parse(userData);
        console.log('👤 User session found:', currentUser.name);
        showDashboard();
    } else {
        console.log('👤 No active session');
        const hash = window.location.hash;
        if (hash === '#register') {
            showRegister();
        } else {
            showLogin();
        }
    }
}

function setupEventListeners() {
    console.log('⚙️ Setting up event listeners...');
    
    // Register button clicks
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) {
        registerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔘 Register button clicked');
            showRegister();
        });
    }
    
    // Login button clicks
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔘 Login button clicked');
            showLogin();
        });
    }
    
    // Show register link (inside login form)
    const showRegisterLink = document.getElementById('show-register');
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔘 Show register link clicked');
            showRegister();
        });
    }
    
    // Show login link (inside register form)
    const showLoginLink = document.getElementById('show-login');
    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔘 Show login link clicked');
            showLogin();
        });
    }
    
    // Form submissions
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBooking);
    }
    
    // Logout buttons
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Calendar navigation
    const prevMonth = document.getElementById('prev-month');
    if (prevMonth) {
        prevMonth.addEventListener('click', () => {
            currentMonth.setMonth(currentMonth.getMonth() - 1);
            renderCalendar();
        });
    }
    
    const nextMonth = document.getElementById('next-month');
    if (nextMonth) {
        nextMonth.addEventListener('click', () => {
            currentMonth.setMonth(currentMonth.getMonth() + 1);
            renderCalendar();
        });
    }
    
    // Plan type change
    const planType = document.getElementById('plan-type');
    if (planType) {
        planType.addEventListener('change', calculateTotal);
    }
    
    // Booking tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterBookings(this.dataset.tab);
        });
    });
    
    // Mobile menu
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
    
    // Hash change listener
    window.addEventListener('hashchange', checkUrlHash);
    
    console.log('✅ Event listeners set up');
}

// Show/Hide Sections
function showLogin() {
    console.log('🔐 Showing login section');
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'none';
    window.location.hash = 'login';
}

function showRegister() {
    console.log('📝 Showing register section');
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'block';
    document.getElementById('dashboard-section').style.display = 'none';
    window.location.hash = 'register';
}

function showDashboard() {
    console.log('📊 Showing dashboard');
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    window.location.hash = 'dashboard';
    
    // Update header buttons
    const headerButtons = document.getElementById('header-buttons');
    if (headerButtons && currentUser) {
        headerButtons.innerHTML = `
            <span style="color: var(--dark-teal); font-weight: 600; margin-right: 12px;">
                ${currentUser.name}
            </span>
            <button id="logout-btn-header" class="btn btn-secondary">Logout</button>
        `;
        
        // Add logout handler for header button
        document.getElementById('logout-btn-header').addEventListener('click', handleLogout);
    }
    
    const userName = document.getElementById('user-name');
    if (userName && currentUser) {
        userName.textContent = currentUser.name;
    }
    
    loadBookedDates();
    renderCalendar();
    loadUserBookings();
}

// Handle Registration
async function handleRegister(e) {
    e.preventDefault();
    console.log('📝 Registration form submitted');
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const address = document.getElementById('register-address').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    const errorDiv = document.getElementById('register-error');
    const successDiv = document.getElementById('register-success');
    
    // Clear messages
    errorDiv.classList.remove('show');
    successDiv.classList.remove('show');
    
    // Validate
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.classList.add('show');
        return;
    }
    
    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters';
        errorDiv.classList.add('show');
        return;
    }
    
    // Check if Supabase is configured
    if (!supabase) {
        errorDiv.textContent = 'Database not configured. Please set up Supabase environment variables.';
        errorDiv.classList.add('show');
        return;
    }
    
    try {
        // Hash password (simple method - in production use bcrypt)
        const hashedPassword = btoa(password);
        
        // Insert user
        const { data, error } = await supabase
            .from('users')
            .insert([
                { name, email, phone, address, password: hashedPassword }
            ])
            .select();
        
        if (error) {
            console.error('❌ Registration error:', error);
            if (error.code === '23505') {
                errorDiv.textContent = 'Email already registered';
            } else {
                errorDiv.textContent = 'Registration failed: ' + error.message;
            }
            errorDiv.classList.add('show');
            return;
        }
        
        console.log('✅ User registered successfully');
        successDiv.textContent = 'Account created successfully! Please login.';
        successDiv.classList.add('show');
        
        // Clear form
        document.getElementById('register-form').reset();
        
        // Redirect to login after 2 seconds
        setTimeout(() => showLogin(), 2000);
        
    } catch (err) {
        console.error('❌ Registration exception:', err);
        errorDiv.textContent = 'An error occurred: ' + err.message;
        errorDiv.classList.add('show');
    }
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    console.log('🔐 Login form submitted');
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    
    errorDiv.classList.remove('show');
    
    // Check if Supabase is configured
    if (!supabase) {
        errorDiv.textContent = 'Database not configured. Please set up Supabase environment variables.';
        errorDiv.classList.add('show');
        return;
    }
    
    try {
        const hashedPassword = btoa(password);
        
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', hashedPassword)
            .single();
        
        if (error || !data) {
            console.error('❌ Login failed');
            errorDiv.textContent = 'Invalid email or password';
            errorDiv.classList.add('show');
            return;
        }
        
        console.log('✅ Login successful:', data.name);
        currentUser = data;
        localStorage.setItem('nomad_user', JSON.stringify(data));
        showDashboard();
        
    } catch (err) {
        console.error('❌ Login exception:', err);
        errorDiv.textContent = 'Login failed: ' + err.message;
        errorDiv.classList.add('show');
    }
}

// Handle Logout
function handleLogout() {
    console.log('👋 Logging out');
    currentUser = null;
    localStorage.removeItem('nomad_user');
    
    // Reset header buttons
    const headerButtons = document.getElementById('header-buttons');
    if (headerButtons) {
        headerButtons.innerHTML = `
            <a href="#login" class="btn btn-secondary" id="login-btn">Login</a>
            <a href="#register" class="btn btn-primary" id="register-btn">Sign Up</a>
        `;
        
        // Re-attach event listeners
        document.getElementById('login-btn').addEventListener('click', function(e) {
            e.preventDefault();
            showLogin();
        });
        
        document.getElementById('register-btn').addEventListener('click', function(e) {
            e.preventDefault();
            showRegister();
        });
    }
    
    showLogin();
}

// Load Booked Dates
async function loadBookedDates() {
    if (!supabase) return;
    
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('start_date, end_date')
            .eq('status', 'approved');
        
        if (error) throw error;
        
        bookedDates = data || [];
        console.log('📅 Loaded', bookedDates.length, 'booked dates');
        renderCalendar();
        
    } catch (err) {
        console.error('❌ Error loading booked dates:', err);
    }
}

// Render Calendar
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const monthYear = document.getElementById('calendar-month-year');
    
    if (!calendar || !monthYear) return;
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Set month/year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    monthYear.textContent = `${monthNames[month]} ${year}`;
    
    // Clear calendar
    calendar.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendar.appendChild(header);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day disabled';
        calendar.appendChild(emptyDay);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const currentDate = new Date(year, month, day);
        currentDate.setHours(0, 0, 0, 0);
        
        // Disable past dates
        if (currentDate < today) {
            dayElement.classList.add('disabled');
        } else {
            // Check if date is booked
            const dateStr = formatDate(currentDate);
            const isBooked = bookedDates.some(booking => {
                const start = new Date(booking.start_date);
                const end = new Date(booking.end_date);
                return currentDate >= start && currentDate <= end;
            });
            
            if (isBooked) {
                dayElement.classList.add('booked');
            } else {
                // Check if selected
                if (selectedStartDate && formatDate(selectedStartDate) === dateStr) {
                    dayElement.classList.add('selected');
                }
                if (selectedEndDate && formatDate(selectedEndDate) === dateStr) {
                    dayElement.classList.add('selected');
                }
                if (selectedStartDate && selectedEndDate) {
                    if (currentDate > selectedStartDate && currentDate < selectedEndDate) {
                        dayElement.classList.add('selected');
                    }
                }
                
                // Add click handler
                dayElement.addEventListener('click', () => selectDate(currentDate));
            }
        }
        
        calendar.appendChild(dayElement);
    }
}

// Select Date
function selectDate(date) {
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
        // Start new selection
        selectedStartDate = date;
        selectedEndDate = null;
        document.getElementById('start-date').value = formatDateDisplay(date);
        document.getElementById('end-date').value = '';
    } else {
        // Set end date
        if (date < selectedStartDate) {
            // Swap if end is before start
            selectedEndDate = selectedStartDate;
            selectedStartDate = date;
        } else {
            selectedEndDate = date;
        }
        
        // Check if range has any booked dates
        if (hasBookedDatesInRange(selectedStartDate, selectedEndDate)) {
            alert('Selected date range contains already booked dates. Please select different dates.');
            selectedStartDate = null;
            selectedEndDate = null;
            document.getElementById('start-date').value = '';
            document.getElementById('end-date').value = '';
        } else {
            document.getElementById('start-date').value = formatDateDisplay(selectedStartDate);
            document.getElementById('end-date').value = formatDateDisplay(selectedEndDate);
        }
    }
    
    renderCalendar();
    calculateTotal();
}

// Check if range has booked dates
function hasBookedDatesInRange(start, end) {
    return bookedDates.some(booking => {
        const bookingStart = new Date(booking.start_date);
        const bookingEnd = new Date(booking.end_date);
        
        return (start <= bookingEnd && end >= bookingStart);
    });
}

// Calculate Total Price
function calculateTotal() {
    if (!selectedStartDate || !selectedEndDate) {
        document.getElementById('booking-duration').textContent = '0 days';
        document.getElementById('booking-total').textContent = '₱0';
        return;
    }
    
    const days = Math.ceil((selectedEndDate - selectedStartDate) / (1000 * 60 * 60 * 24)) + 1;
    const plan = document.getElementById('plan-type').value;
    
    let total = 0;
    if (plan === 'daily') {
        total = days * pricing.daily;
    } else if (plan === 'weekly') {
        const weeks = Math.ceil(days / 7);
        total = weeks * pricing.weekly;
    } else if (plan === 'monthly') {
        const months = Math.ceil(days / 30);
        total = months * pricing.monthly;
    }
    
    document.getElementById('booking-duration').textContent = `${days} day${days > 1 ? 's' : ''}`;
    document.getElementById('booking-total').textContent = `₱${total.toLocaleString()}`;
}

// Handle Booking
async function handleBooking(e) {
    e.preventDefault();
    console.log('📅 Booking form submitted');
    
    const errorDiv = document.getElementById('booking-error');
    const successDiv = document.getElementById('booking-success');
    
    errorDiv.classList.remove('show');
    successDiv.classList.remove('show');
    
    if (!selectedStartDate || !selectedEndDate) {
        errorDiv.textContent = 'Please select start and end dates';
        errorDiv.classList.add('show');
        return;
    }
    
    if (!supabase) {
        errorDiv.textContent = 'Database not configured. Please set up Supabase environment variables.';
        errorDiv.classList.add('show');
        return;
    }
    
    const planType = document.getElementById('plan-type').value;
    const notes = document.getElementById('booking-notes').value;
    const totalPrice = parseFloat(document.getElementById('booking-total').textContent.replace('₱', '').replace(',', ''));
    
    try {
        // Insert booking
        const { data, error } = await supabase
            .from('bookings')
            .insert([{
                user_id: currentUser.id,
                start_date: formatDate(selectedStartDate),
                end_date: formatDate(selectedEndDate),
                plan_type: planType,
                total_price: totalPrice,
                status: 'pending',
                notes: notes || null
            }])
            .select();
        
        if (error) throw error;
        
        console.log('✅ Booking created successfully');
        successDiv.textContent = 'Booking submitted successfully! Waiting for admin approval. (Email notifications disabled)';
        successDiv.classList.add('show');
        
        // Reset form
        document.getElementById('booking-form').reset();
        selectedStartDate = null;
        selectedEndDate = null;
        document.getElementById('start-date').value = '';
        document.getElementById('end-date').value = '';
        
        renderCalendar();
        loadUserBookings();
        
        // Scroll to bookings section
        setTimeout(() => {
            const bookingsSection = document.querySelector('.my-bookings-section');
            if (bookingsSection) {
                bookingsSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 1500);
        
    } catch (err) {
        console.error('❌ Booking error:', err);
        errorDiv.textContent = 'Booking failed: ' + err.message;
        errorDiv.classList.add('show');
    }
}

// Load User Bookings
async function loadUserBookings() {
    if (!supabase) return;
    
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        userBookings = data || [];
        console.log('📋 Loaded', userBookings.length, 'user bookings');
        filterBookings('all');
        
    } catch (err) {
        console.error('❌ Error loading bookings:', err);
    }
}

// Filter Bookings
function filterBookings(filter) {
    const bookingsList = document.getElementById('bookings-list');
    
    if (!bookingsList) return;
    
    let filtered = userBookings;
    if (filter !== 'all') {
        filtered = userBookings.filter(b => b.status === filter);
    }
    
    if (filtered.length === 0) {
        bookingsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p>No ${filter === 'all' ? '' : filter} bookings found</p>
            </div>
        `;
        return;
    }
    
    bookingsList.innerHTML = filtered.map(booking => `
        <div class="booking-card">
            <div class="booking-card-header">
                <div class="booking-id">Booking #${booking.id.slice(0, 8)}</div>
                <div class="booking-status ${booking.status}">${booking.status}</div>
            </div>
            <div class="booking-card-body">
                <div class="booking-info">
                    <div class="booking-info-label">Start Date</div>
                    <div class="booking-info-value">${formatDateDisplay(new Date(booking.start_date))}</div>
                </div>
                <div class="booking-info">
                    <div class="booking-info-label">End Date</div>
                    <div class="booking-info-value">${formatDateDisplay(new Date(booking.end_date))}</div>
                </div>
                <div class="booking-info">
                    <div class="booking-info-label">Plan Type</div>
                    <div class="booking-info-value">${booking.plan_type.charAt(0).toUpperCase() + booking.plan_type.slice(1)}</div>
                </div>
                <div class="booking-info">
                    <div class="booking-info-label">Duration</div>
                    <div class="booking-info-value">${Math.ceil((new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24)) + 1} days</div>
                </div>
            </div>
            ${booking.notes ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 2px solid var(--sand);">
                    <div class="booking-info-label">Notes</div>
                    <div style="font-size: 14px; color: var(--text-dark); margin-top: 4px;">${booking.notes}</div>
                </div>
            ` : ''}
            <div class="booking-card-footer">
                <div class="booking-total-price">₱${parseFloat(booking.total_price).toLocaleString()}</div>
                <div class="booking-created">Created: ${new Date(booking.created_at).toLocaleDateString()}</div>
            </div>
        </div>
    `).join('');
}

// Utility Functions
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function formatDateDisplay(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}