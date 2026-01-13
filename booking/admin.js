// booking/admin.js
// Supabase config will be loaded from environment variables via API
let currentUser = null;
let currentFilter = 'all';
let allBookings = [];

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const adminEmail = document.getElementById('admin-email');
const refreshBtn = document.getElementById('refresh-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const bookingModal = document.getElementById('booking-modal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const loadingSpinner = document.getElementById('loading-spinner');
const bookingsTableContainer = document.getElementById('bookings-table-container');

// Check if user is already logged in
checkAuth();

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
refreshBtn.addEventListener('click', loadBookings);

filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.status;
        renderBookingsTable();
    });
});

closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        bookingModal.classList.remove('show');
    });
});

// Close modal on outside click
bookingModal.addEventListener('click', (e) => {
    if (e.target === bookingModal) {
        bookingModal.classList.remove('show');
    }
});

// Auth Functions
async function checkAuth() {
    const session = localStorage.getItem('admin_session');
    if (session) {
        try {
            const sessionData = JSON.parse(session);
            currentUser = sessionData;
            showDashboard();
            loadBookings();
        } catch (error) {
            console.error('Invalid session', error);
            localStorage.removeItem('admin_session');
        }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    loginError.classList.remove('show');
    
    try {
        // Call our serverless function for login
        const response = await fetch('/api/auth/login', {
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
        
        // Check if user is admin
        if (data.role !== 'admin') {
            throw new Error('Access denied. Admin privileges required.');
        }
        
        // Save session
        currentUser = data;
        localStorage.setItem('admin_session', JSON.stringify(data));
        
        showDashboard();
        loadBookings();
        
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = error.message;
        loginError.classList.add('show');
    }
}

function handleLogout() {
    localStorage.removeItem('admin_session');
    currentUser = null;
    showLogin();
}

function showLogin() {
    loginScreen.style.display = 'flex';
    dashboardScreen.style.display = 'none';
}

function showDashboard() {
    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'block';
    adminEmail.textContent = currentUser.email;
}

// Bookings Functions
async function loadBookings() {
    if (!currentUser) return;
    
    loadingSpinner.style.display = 'block';
    bookingsTableContainer.innerHTML = '';
    
    try {
        const response = await fetch('/api/bookings/list', {
            headers: {
                'Authorization': `Bearer ${currentUser.access_token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load bookings');
        }
        
        allBookings = data.bookings || [];
        updateStats();
        renderBookingsTable();
        
    } catch (error) {
        console.error('Error loading bookings:', error);
        bookingsTableContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h3>Error loading bookings</h3>
                <p>${error.message}</p>
            </div>
        `;
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

function updateStats() {
    const pending = allBookings.filter(b => b.status === 'pending').length;
    const confirmed = allBookings.filter(b => b.status === 'confirmed').length;
    const total = allBookings.length;
    const revenue = allBookings
        .filter(b => b.status === 'confirmed')
        .reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0);
    
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-confirmed').textContent = confirmed;
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-revenue').textContent = `₱${revenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function renderBookingsTable() {
    const filteredBookings = currentFilter === 'all' 
        ? allBookings 
        : allBookings.filter(b => b.status === currentFilter);
    
    if (filteredBookings.length === 0) {
        bookingsTableContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>No bookings found</h3>
                <p>No ${currentFilter === 'all' ? '' : currentFilter} bookings at the moment.</p>
            </div>
        `;
        return;
    }
    
    const tableHTML = `
        <div class="bookings-table">
            <table>
                <thead>
                    <tr>
                        <th>Reference</th>
                        <th>Customer</th>
                        <th>Dates</th>
                        <th>Plan</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredBookings.map(booking => `
                        <tr>
                            <td><strong>${booking.booking_reference}</strong></td>
                            <td>
                                ${booking.customer_name}<br>
                                <small>${booking.customer_email}</small>
                            </td>
                            <td>
                                ${formatDate(booking.start_date)} -<br>
                                ${formatDate(booking.end_date)}
                            </td>
                            <td>${capitalizeFirst(booking.plan_type)}</td>
                            <td><strong>₱${parseFloat(booking.total_price).toLocaleString('en-PH')}</strong></td>
                            <td><span class="status-badge ${booking.status}">${capitalizeFirst(booking.status)}</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="action-btn view-btn" onclick="viewBooking('${booking.id}')">View Details</button>
                                    ${booking.payment_method === 'gcash' && booking.payment_proof_url ? `
                                        <button class="action-btn" 
                                                style="background: #00BFA5; color: white;" 
                                                onclick="window.open('${booking.payment_proof_url}', '_blank')">
                                            💳 Payment
                                        </button>
                                    ` : ''}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    bookingsTableContainer.innerHTML = tableHTML;
}

function viewBooking(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    const detailsHTML = `
        <div class="detail-row">
            <span class="detail-label">Reference:</span>
            <span class="detail-value"><strong>${booking.booking_reference}</strong></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value"><span class="status-badge ${booking.status}">${capitalizeFirst(booking.status)}</span></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Customer Name:</span>
            <span class="detail-value">${booking.customer_name}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${booking.customer_email}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${booking.customer_phone}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Delivery Address:</span>
            <span class="detail-value">${booking.delivery_address}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Plan Type:</span>
            <span class="detail-value">${capitalizeFirst(booking.plan_type)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Start Date:</span>
            <span class="detail-value">${formatDate(booking.start_date)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">End Date:</span>
            <span class="detail-value">${formatDate(booking.end_date)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Total Price:</span>
            <span class="detail-value"><strong>₱${parseFloat(booking.total_price).toLocaleString('en-PH')}</strong></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Payment Method:</span>
            <span class="detail-value">${booking.payment_method === 'gcash' ? 'GCash' : 'Direct Payment'}</span>
        </div>
        ${booking.special_requests ? `
            <div class="detail-row">
                <span class="detail-label">Special Requests:</span>
                <span class="detail-value">${booking.special_requests}</span>
            </div>
        ` : ''}
        <div class="detail-row">
            <span class="detail-label">Booked On:</span>
            <span class="detail-value">${formatDateTime(booking.created_at)}</span>
        </div>
        
        <!-- PAYMENT PROOF SECTION - NEW -->
        ${booking.payment_method === 'gcash' ? `
            <div style="margin-top: 24px; padding-top: 24px; border-top: 2px solid var(--sand);">
                <h3 style="color: var(--dark-teal); margin-bottom: 16px; font-size: 18px;">Payment Proof</h3>
                ${booking.payment_proof_url ? `
                    <div style="text-align: center;">
                        <img src="${booking.payment_proof_url}" 
                             alt="Payment Proof" 
                             style="max-width: 100%; max-height: 400px; border-radius: 12px; border: 2px solid var(--sand); cursor: pointer;"
                             onclick="window.open('${booking.payment_proof_url}', '_blank')">
                        <p style="margin-top: 12px; color: var(--text-light); font-size: 12px;">
                            Click image to view full size
                        </p>
                    </div>
                ` : `
                    <p style="color: var(--text-light); text-align: center;">No payment proof uploaded</p>
                `}
            </div>
        ` : ''}
    `;
    
    document.getElementById('booking-details').innerHTML = detailsHTML;
    
    const confirmBtn = document.getElementById('confirm-booking-btn');
    const rejectBtn = document.getElementById('reject-booking-btn');
    
    // Show/hide action buttons based on status
    if (booking.status === 'pending') {
        confirmBtn.style.display = 'inline-block';
        rejectBtn.style.display = 'inline-block';
        
        confirmBtn.onclick = () => updateBookingStatus(bookingId, 'confirmed');
        rejectBtn.onclick = () => updateBookingStatus(bookingId, 'rejected');
    } else {
        confirmBtn.style.display = 'none';
        rejectBtn.style.display = 'none';
    }
    
    bookingModal.classList.add('show');
}

async function updateBookingStatus(bookingId, newStatus) {
    if (!confirm(`Are you sure you want to ${newStatus === 'confirmed' ? 'confirm' : 'reject'} this booking?`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/bookings/update-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.access_token}`
            },
            body: JSON.stringify({
                booking_id: bookingId,
                status: newStatus
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update booking');
        }
        
        alert(`Booking ${newStatus === 'confirmed' ? 'confirmed' : 'rejected'} successfully!`);
        bookingModal.classList.remove('show');
        loadBookings();
        
    } catch (error) {
        console.error('Error updating booking:', error);
        alert('Error: ' + error.message);
    }
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-PH', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Make viewBooking available globally
window.viewBooking = viewBooking;