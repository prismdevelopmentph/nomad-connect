// Supabase Configuration
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// EmailJS Configuration
const EMAILJS_PUBLIC_KEY = 'YOUR_EMAILJS_PUBLIC_KEY';
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_APPROVED = 'YOUR_APPROVED_TEMPLATE_ID';
const EMAILJS_TEMPLATE_REJECTED = 'YOUR_REJECTED_TEMPLATE_ID';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

// Global state
let currentAdmin = null;
let allBookings = [];
let currentMonth = new Date();
let selectedBooking = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAdminSession();
    setupEventListeners();
});

// Check if admin is logged in
function checkAdminSession() {
    const adminData = localStorage.getItem('nomad_admin');
    if (adminData) {
        currentAdmin = JSON.parse(adminData);
        showDashboard();
    } else {
        showLogin();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Admin login form
    document.getElementById('admin-login-form').addEventListener('submit', handleAdminLogin);
    
    // Logout
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Calendar navigation
    document.getElementById('admin-prev-month').addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderAdminCalendar();
    });
    
    document.getElementById('admin-next-month').addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderAdminCalendar();
    });
    
    // Filters
    document.getElementById('status-filter').addEventListener('change', function() {
        filterBookings(this.value);
    });
    
    document.getElementById('refresh-bookings').addEventListener('click', () => {
        loadAllBookings();
    });
    
    // Modal close
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('booking-modal');
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Show/Hide Sections
function showLogin() {
    document.getElementById('admin-login-section').style.display = 'block';
    document.getElementById('admin-dashboard-section').style.display = 'none';
}

function showDashboard() {
    document.getElementById('admin-login-section').style.display = 'none';
    document.getElementById('admin-dashboard-section').style.display = 'block';
    
    // Update header
    document.getElementById('header-buttons').innerHTML = `
        <span style="color: var(--dark-teal); font-weight: 600; margin-right: 12px;">
            Admin: ${currentAdmin.name}
        </span>
        <button id="admin-logout-btn-header" class="btn btn-secondary">Logout</button>
    `;
    
    document.getElementById('admin-logout-btn-header').addEventListener('click', handleLogout);
    
    loadAllBookings();
    renderAdminCalendar();
}

// Handle Admin Login
async function handleAdminLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const errorDiv = document.getElementById('admin-login-error');
    
    errorDiv.classList.remove('show');
    
    try {
        const hashedPassword = btoa(password);
        
        const { data, error } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email)
            .eq('password', hashedPassword)
            .single();
        
        if (error || !data) {
            errorDiv.textContent = 'Invalid admin credentials';
            errorDiv.classList.add('show');
            return;
        }
        
        currentAdmin = data;
        localStorage.setItem('nomad_admin', JSON.stringify(data));
        showDashboard();
        
    } catch (err) {
        errorDiv.textContent = 'Login failed: ' + err.message;
        errorDiv.classList.add('show');
    }
}

// Handle Logout
function handleLogout() {
    currentAdmin = null;
    localStorage.removeItem('nomad_admin');
    showLogin();
    
    // Reset header
    document.getElementById('header-buttons').innerHTML = `
        <a href="#login" class="btn btn-secondary" id="admin-login-btn">Admin Login</a>
    `;
}

// Load All Bookings
async function loadAllBookings() {
    try {
        // Show loading
        document.getElementById('admin-bookings-list').innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Loading bookings...</p>
            </div>
        `;
        
        const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (bookingsError) throw bookingsError;
        
        // Get user details for each booking
        const userIds = [...new Set(bookings.map(b => b.user_id))];
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .in('id', userIds);
        
        if (usersError) throw usersError;
        
        // Combine booking with user data
        allBookings = bookings.map(booking => {
            const user = users.find(u => u.id === booking.user_id);
            return { ...booking, user };
        });
        
        updateStats();
        filterBookings('all');
        renderAdminCalendar();
        
    } catch (err) {
        console.error('Error loading bookings:', err);
        document.getElementById('admin-bookings-list').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p>Error loading bookings: ${err.message}</p>
            </div>
        `;
    }
}

// Update Stats
function updateStats() {
    const pending = allBookings.filter(b => b.status === 'pending').length;
    const approved = allBookings.filter(b => b.status === 'approved').length;
    const total = allBookings.length;
    const revenue = allBookings
        .filter(b => b.status === 'approved')
        .reduce((sum, b) => sum + parseFloat(b.total_price), 0);
    
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-approved').textContent = approved;
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-revenue').textContent = `₱${revenue.toLocaleString()}`;
}

// Filter Bookings
function filterBookings(status) {
    const bookingsList = document.getElementById('admin-bookings-list');
    
    let filtered = allBookings;
    if (status !== 'all') {
        filtered = allBookings.filter(b => b.status === status);
    }
    
    if (filtered.length === 0) {
        bookingsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p>No ${status === 'all' ? '' : status} bookings found</p>
            </div>
        `;
        return;
    }
    
    bookingsList.innerHTML = filtered.map(booking => renderBookingCard(booking)).join('');
    
    // Attach event listeners
    filtered.forEach(booking => {
        const card = document.querySelector(`[data-booking-id="${booking.id}"]`);
        
        // Approve button
        const approveBtn = card.querySelector('.btn-approve');
        if (approveBtn) {
            approveBtn.addEventListener('click', () => handleApprove(booking.id));
        }
        
        // Reject button
        const rejectBtn = card.querySelector('.btn-reject');
        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => handleReject(booking.id));
        }
        
        // View button
        const viewBtn = card.querySelector('.btn-view');
        if (viewBtn) {
            viewBtn.addEventListener('click', () => showBookingDetails(booking));
        }
        
        // Save deposit button
        const saveBtn = card.querySelector('.btn-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => saveDepositInfo(booking.id));
        }
    });
}

// Render Booking Card
function renderBookingCard(booking) {
    const duration = Math.ceil((new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24)) + 1;
    
    return `
        <div class="admin-booking-card" data-booking-id="${booking.id}">
            <div class="admin-booking-header">
                <div class="booking-header-left">
                    <div class="booking-number">Booking #${booking.id.slice(0, 8)}</div>
                    <div class="booking-date-submitted">Submitted: ${new Date(booking.created_at).toLocaleString()}</div>
                </div>
                <div class="booking-status ${booking.status}">${booking.status.toUpperCase()}</div>
            </div>
            
            <div class="admin-booking-body">
                <div class="admin-info-section">
                    <h4>Customer Info</h4>
                    <div class="info-row">
                        <div class="info-label">Name</div>
                        <div class="info-value">${booking.user.name}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Email</div>
                        <div class="info-value">${booking.user.email}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Phone</div>
                        <div class="info-value">${booking.user.phone}</div>
                    </div>
                </div>
                
                <div class="admin-info-section">
                    <h4>Booking Details</h4>
                    <div class="info-row">
                        <div class="info-label">Start Date</div>
                        <div class="info-value">${formatDateDisplay(new Date(booking.start_date))}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">End Date</div>
                        <div class="info-value">${formatDateDisplay(new Date(booking.end_date))}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Duration</div>
                        <div class="info-value">${duration} day${duration > 1 ? 's' : ''}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Plan</div>
                        <div class="info-value">${booking.plan_type.charAt(0).toUpperCase() + booking.plan_type.slice(1)}</div>
                    </div>
                </div>
                
                <div class="admin-info-section">
                    <h4>Payment Info</h4>
                    <div class="info-row">
                        <div class="info-label">Total Price</div>
                        <div class="info-value price">₱${parseFloat(booking.total_price).toLocaleString()}</div>
                    </div>
                    ${booking.notes ? `
                        <div class="info-row">
                            <div class="info-label">Notes</div>
                            <div class="info-value">${booking.notes}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="admin-booking-footer">
                <div class="deposit-status">
                    <label class="deposit-toggle">
                        <input type="checkbox" 
                               class="deposit-checkbox" 
                               ${booking.deposit_paid ? 'checked' : ''}
                               data-booking-id="${booking.id}">
                        Deposit Paid
                    </label>
                    <input type="number" 
                           class="deposit-amount" 
                           placeholder="Amount"
                           value="${booking.deposit_amount || ''}"
                           data-booking-id="${booking.id}">
                    <button class="btn-save">💾 Save</button>
                </div>
                <div class="admin-actions">
                    ${booking.status === 'pending' ? `
                        <button class="btn-approve">✓ Approve</button>
                        <button class="btn-reject">✗ Reject</button>
                    ` : ''}
                    <button class="btn-view">👁️ View Details</button>
                </div>
            </div>
        </div>
    `;
}

// Handle Approve
async function handleApprove(bookingId) {
    if (!confirm('Are you sure you want to approve this booking?')) return;
    
    try {
        const booking = allBookings.find(b => b.id === bookingId);
        
        // Check for date conflicts
        const { data: conflicts } = await supabase
            .from('bookings')
            .select('*')
            .eq('status', 'approved')
            .neq('id', bookingId);
        
        const hasConflict = conflicts.some(b => {
            const bStart = new Date(b.start_date);
            const bEnd = new Date(b.end_date);
            const start = new Date(booking.start_date);
            const end = new Date(booking.end_date);
            
            return (start <= bEnd && end >= bStart);
        });
        
        if (hasConflict) {
            alert('Cannot approve: Date conflict with existing approved booking!');
            return;
        }
        
        // Update booking status
        const { error } = await supabase
            .from('bookings')
            .update({ status: 'approved', updated_at: new Date() })
            .eq('id', bookingId);
        
        if (error) throw error;
        
        // Send email notification
        await sendApprovalEmail(booking);
        
        alert('Booking approved successfully!');
        loadAllBookings();
        
    } catch (err) {
        alert('Error approving booking: ' + err.message);
    }
}

// Handle Reject
async function handleReject(bookingId) {
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (reason === null) return; // User cancelled
    
    try {
        const booking = allBookings.find(b => b.id === bookingId);
        
        // Update booking status
        const { error } = await supabase
            .from('bookings')
            .update({ 
                status: 'rejected', 
                notes: reason ? `Rejected: ${reason}` : 'Rejected',
                updated_at: new Date() 
            })
            .eq('id', bookingId);
        
        if (error) throw error;
        
        // Send email notification
        await sendRejectionEmail(booking, reason);
        
        alert('Booking rejected.');
        loadAllBookings();
        
    } catch (err) {
        alert('Error rejecting booking: ' + err.message);
    }
}

// Save Deposit Info
async function saveDepositInfo(bookingId) {
    try {
        const card = document.querySelector(`[data-booking-id="${bookingId}"]`);
        const depositPaid = card.querySelector('.deposit-checkbox').checked;
        const depositAmount = parseFloat(card.querySelector('.deposit-amount').value) || 0;
        
        const { error } = await supabase
            .from('bookings')
            .update({ 
                deposit_paid: depositPaid,
                deposit_amount: depositAmount,
                updated_at: new Date()
            })
            .eq('id', bookingId);
        
        if (error) throw error;
        
        alert('Deposit information saved!');
        loadAllBookings();
        
    } catch (err) {
        alert('Error saving deposit info: ' + err.message);
    }
}

// Send Approval Email
async function sendApprovalEmail(booking) {
    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_APPROVED, {
            to_email: booking.user.email,
            to_name: booking.user.name,
            booking_id: booking.id.slice(0, 8),
            start_date: formatDateDisplay(new Date(booking.start_date)),
            end_date: formatDateDisplay(new Date(booking.end_date)),
            plan_type: booking.plan_type,
            total_price: booking.total_price
        });
    } catch (err) {
        console.error('Error sending approval email:', err);
    }
}

// Send Rejection Email
async function sendRejectionEmail(booking, reason) {
    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_REJECTED, {
            to_email: booking.user.email,
            to_name: booking.user.name,
            booking_id: booking.id.slice(0, 8),
            start_date: formatDateDisplay(new Date(booking.start_date)),
            end_date: formatDateDisplay(new Date(booking.end_date)),
            rejection_reason: reason || 'No reason provided'
        });
    } catch (err) {
        console.error('Error sending rejection email:', err);
    }
}

// Show Booking Details Modal
function showBookingDetails(booking) {
    const modal = document.getElementById('booking-modal');
    const modalBody = document.getElementById('modal-body');
    
    const duration = Math.ceil((new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24)) + 1;
    
    modalBody.innerHTML = `
        <div class="modal-section">
            <h4>Customer Information</h4>
            <div class="modal-info-grid">
                <div class="info-row">
                    <div class="info-label">Full Name</div>
                    <div class="info-value">${booking.user.name}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Email</div>
                    <div class="info-value">${booking.user.email}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Phone</div>
                    <div class="info-value">${booking.user.phone}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Address</div>
                    <div class="info-value">${booking.user.address}</div>
                </div>
            </div>
        </div>
        
        <div class="modal-section">
            <h4>Booking Information</h4>
            <div class="modal-info-grid">
                <div class="info-row">
                    <div class="info-label">Booking ID</div>
                    <div class="info-value">${booking.id}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Status</div>
                    <div class="info-value">
                        <span class="booking-status ${booking.status}">${booking.status.toUpperCase()}</span>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-label">Start Date</div>
                    <div class="info-value">${formatDateDisplay(new Date(booking.start_date))}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">End Date</div>
                    <div class="info-value">${formatDateDisplay(new Date(booking.end_date))}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Duration</div>
                    <div class="info-value">${duration} day${duration > 1 ? 's' : ''}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Plan Type</div>
                    <div class="info-value">${booking.plan_type.charAt(0).toUpperCase() + booking.plan_type.slice(1)}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Total Price</div>
                    <div class="info-value price">₱${parseFloat(booking.total_price).toLocaleString()}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Deposit Status</div>
                    <div class="info-value">${booking.deposit_paid ? '✓ Paid' : '✗ Not Paid'}</div>
                </div>
                ${booking.deposit_amount ? `
                    <div class="info-row">
                        <div class="info-label">Deposit Amount</div>
                        <div class="info-value">₱${parseFloat(booking.deposit_amount).toLocaleString()}</div>
                    </div>
                ` : ''}
            </div>
        </div>
        
        ${booking.notes ? `
            <div class="modal-section">
                <h4>Additional Notes</h4>
                <p style="color: var(--text-dark); line-height: 1.6;">${booking.notes}</p>
            </div>
        ` : ''}
        
        <div class="modal-section">
            <h4>Timestamps</h4>
            <div class="modal-info-grid">
                <div class="info-row">
                    <div class="info-label">Created</div>
                    <div class="info-value">${new Date(booking.created_at).toLocaleString()}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Last Updated</div>
                    <div class="info-value">${new Date(booking.updated_at).toLocaleString()}</div>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
}

// Close Modal
function closeModal() {
    document.getElementById('booking-modal').classList.remove('show');
}

// Render Admin Calendar
function renderAdminCalendar() {
    const calendar = document.getElementById('admin-calendar');
    const monthYear = document.getElementById('admin-calendar-month-year');
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    monthYear.textContent = `${monthNames[month]} ${year}`;
    
    calendar.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendar.appendChild(header);
    });
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Empty cells
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day disabled';
        calendar.appendChild(emptyDay);
    }
    
    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const currentDate = new Date(year, month, day);
        const dateStr = formatDate(currentDate);
        
        // Check bookings for this date
        const approvedBooking = allBookings.find(b => {
            if (b.status !== 'approved') return false;
            const start = new Date(b.start_date);
            const end = new Date(b.end_date);
            return currentDate >= start && currentDate <= end;
        });
        
        const pendingBooking = allBookings.find(b => {
            if (b.status !== 'pending') return false;
            const start = new Date(b.start_date);
            const end = new Date(b.end_date);
            return currentDate >= start && currentDate <= end;
        });
        
        if (approvedBooking) {
            dayElement.classList.add('booked');
            dayElement.title = `Approved: ${approvedBooking.user.name}`;
        } else if (pendingBooking) {
            dayElement.style.background = '#fff4e6';
            dayElement.title = `Pending: ${pendingBooking.user.name}`;
        }
        
        calendar.appendChild(dayElement);
    }
}

// Utility Functions
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function formatDateDisplay(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}