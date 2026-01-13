// Supabase Configuration
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// EmailJS Configuration
const EMAILJS_PUBLIC_KEY = 'YOUR_EMAILJS_PUBLIC_KEY';
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_USER = 'YOUR_USER_TEMPLATE_ID';
const EMAILJS_TEMPLATE_ADMIN = 'YOUR_ADMIN_TEMPLATE_ID';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

// Global state
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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    setupEventListeners();
});

// Check if user is logged in
async function checkUserSession() {
    const userData = localStorage.getItem('nomad_user');
    if (userData) {
        currentUser = JSON.parse(userData);
        showDashboard();
    } else {
        showLogin();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Auth navigation
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        showRegister();
    });
    
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });
    
    document.getElementById('login-btn').addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });
    
    document.getElementById('register-btn').addEventListener('click', (e) => {
        e.preventDefault();
        showRegister();
    });
    
    // Forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('booking-form').addEventListener('submit', handleBooking);
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Calendar navigation
    document.getElementById('prev-month').addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderCalendar();
    });
    
    // Plan type change
    document.getElementById('plan-type').addEventListener('change', calculateTotal);
    
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
    
    mobileToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
    });
}

// Show/Hide Sections
function showLogin() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'none';
}

function showRegister() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'block';
    document.getElementById('dashboard-section').style.display = 'none';
}

function showDashboard() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    
    // Update header buttons
    document.getElementById('header-buttons').innerHTML = `
        <span style="color: var(--dark-teal); font-weight: 600; margin-right: 12px;">
            ${currentUser.name}
        </span>
        <button id="logout-btn-header" class="btn btn-secondary">Logout</button>
    `;
    
    document.getElementById('logout-btn-header').addEventListener('click', handleLogout);
    document.getElementById('user-name').textContent = currentUser.name;
    
    loadBookedDates();
    renderCalendar();
    loadUserBookings();
}

// Handle Registration
async function handleRegister(e) {
    e.preventDefault();
    
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
            if (error.code === '23505') {
                errorDiv.textContent = 'Email already registered';
            } else {
                errorDiv.textContent = 'Registration failed: ' + error.message;
            }
            errorDiv.classList.add('show');
            return;
        }
        
        successDiv.textContent = 'Account created successfully! Please login.';
        successDiv.classList.add('show');
        
        // Clear form
        document.getElementById('register-form').reset();
        
        // Redirect to login after 2 seconds
        setTimeout(() => showLogin(), 2000);
        
    } catch (err) {
        errorDiv.textContent = 'An error occurred: ' + err.message;
        errorDiv.classList.add('show');
    }
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    
    errorDiv.classList.remove('show');
    
    try {
        const hashedPassword = btoa(password);
        
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', hashedPassword)
            .single();
        
        if (error || !data) {
            errorDiv.textContent = 'Invalid email or password';
            errorDiv.classList.add('show');
            return;
        }
        
        currentUser = data;
        localStorage.setItem('nomad_user', JSON.stringify(data));
        showDashboard();
        
    } catch (err) {
        errorDiv.textContent = 'Login failed: ' + err.message;
        errorDiv.classList.add('show');
    }
}

// Handle Logout
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('nomad_user');
    showLogin();
    
    // Reset header buttons
    document.getElementById('header-buttons').innerHTML = `
        <a href="#login" class="btn btn-secondary" id="login-btn">Login</a>
        <a href="#register" class="btn btn-primary" id="register-btn">Sign Up</a>
    `;
    
    // Re-attach event listeners
    document.getElementById('login-btn').addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });
    
    document.getElementById('register-btn').addEventListener('click', (e) => {
        e.preventDefault();
        showRegister();
    });
}

// Load Booked Dates
async function loadBookedDates() {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('start_date, end_date')
            .eq('status', 'approved');
        
        if (error) throw error;
        
        bookedDates = data || [];
        renderCalendar();
        
    } catch (err) {
        console.error('Error loading booked dates:', err);
    }
}

// Render Calendar
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const monthYear = document.getElementById('calendar-month-year');
    
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
    
    const errorDiv = document.getElementById('booking-error');
    const successDiv = document.getElementById('booking-success');
    
    errorDiv.classList.remove('show');
    successDiv.classList.remove('show');
    
    if (!selectedStartDate || !selectedEndDate) {
        errorDiv.textContent = 'Please select start and end dates';
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
        
        // Send email notifications
        await sendBookingEmails(data[0]);
        
        successDiv.textContent = 'Booking submitted successfully! Waiting for admin approval.';
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
            document.querySelector('.my-bookings-section').scrollIntoView({ behavior: 'smooth' });
        }, 1500);
        
    } catch (err) {
        errorDiv.textContent = 'Booking failed: ' + err.message;
        errorDiv.classList.add('show');
    }
}

// Send Booking Emails
async function sendBookingEmails(booking) {
    try {
        // Email to user
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_USER, {
            to_email: currentUser.email,
            to_name: currentUser.name,
            booking_id: booking.id,
            start_date: formatDateDisplay(new Date(booking.start_date)),
            end_date: formatDateDisplay(new Date(booking.end_date)),
            plan_type: booking.plan_type,
            total_price: booking.total_price
        });
        
        // Email to admin
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ADMIN, {
            to_email: 'admin@nomadconnect.ph',
            customer_name: currentUser.name,
            customer_email: currentUser.email,
            customer_phone: currentUser.phone,
            booking_id: booking.id,
            start_date: formatDateDisplay(new Date(booking.start_date)),
            end_date: formatDateDisplay(new Date(booking.end_date)),
            plan_type: booking.plan_type,
            total_price: booking.total_price
        });
        
    } catch (err) {
        console.error('Error sending emails:', err);
    }
}

// Load User Bookings
async function loadUserBookings() {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        userBookings = data || [];
        filterBookings('all');
        
    } catch (err) {
        console.error('Error loading bookings:', err);
    }
}

// Filter Bookings
function filterBookings(filter) {
    const bookingsList = document.getElementById('bookings-list');
    
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