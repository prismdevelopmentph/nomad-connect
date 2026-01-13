// booking/dashboard.js

let currentUser = null;
let userBookings = [];
let blockedDates = [];
let calendar = null;
let selectedStartDate = null;
let selectedEndDate = null;
let startDatePicker = null;
let endDatePicker = null;

// DOM Elements
const welcomeName = document.getElementById('welcome-name');
const userName = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const newBookingBtn = document.getElementById('new-booking-btn');
const bookingModal = document.getElementById('booking-modal');
const detailModal = document.getElementById('detail-modal');
const bookingForm = document.getElementById('booking-form');
const bookingsContainer = document.getElementById('bookings-container');
const loadingBookings = document.getElementById('loading-bookings');
const noBookings = document.getElementById('no-bookings');
const formError = document.getElementById('form-error');

// Initialize
checkAuth();

// Event Listeners
logoutBtn.addEventListener('click', handleLogout);
newBookingBtn.addEventListener('click', openBookingModal);
bookingForm.addEventListener('submit', handleBookingSubmit);

// Close modals
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', closeModals);
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModals();
    }
});


// Payment method
document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const gcashSection = document.getElementById('gcash-upload-section');
        const paymentProof = document.getElementById('payment-proof');
        
        if (e.target.value === 'gcash') {
            gcashSection.style.display = 'block';
            paymentProof.required = true;
        } else {
            gcashSection.style.display = 'none';
            paymentProof.required = false;
        }
    });
});

// Payment proof preview
document.getElementById('payment-proof').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('image-preview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" alt="Payment proof">`;
        };
        reader.readAsDataURL(file);
    }
});

// Auth Functions
function checkAuth() {
    const session = localStorage.getItem('customer_session');
    if (!session) {
        window.location.href = 'auth.html';
        return;
    }
    
    try {
        currentUser = JSON.parse(session);
        initializeDashboard();
    } catch (error) {
        console.error('Invalid session:', error);
        localStorage.removeItem('customer_session');
        window.location.href = 'auth.html';
    }
}

function handleLogout() {
    localStorage.removeItem('customer_session');
    window.location.href = 'auth.html';
}

// Add profile validation before booking
async function validateUserProfile() {
    try {
        const response = await fetch('/api/customer/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: currentUser.email,
                password: 'dummy' // This won't work, we need a better approach
            })
        });
        
        // Better approach: Check if profile exists in current session
        if (!currentUser.profile || !currentUser.profile.name || !currentUser.profile.phone) {
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Profile validation error:', error);
        return false;
    }
}

// Dashboard Functions
async function initializeDashboard() {
    // Set user name
    const name = currentUser.profile?.name || currentUser.email.split('@')[0];
    welcomeName.textContent = name;
    userName.textContent = name;
    
    // Load data
    await loadBlockedDates();
    await loadBookings();
    // initializeDatePickers(); // ← REMOVE THIS LINE OR COMMENT IT OUT
}

async function loadBookings() {
    loadingBookings.style.display = 'block';
    bookingsContainer.innerHTML = '';
    noBookings.style.display = 'none';
    
    try {
        const response = await fetch('/api/bookings/my-bookings', {
            headers: {
                'Authorization': `Bearer ${currentUser.access_token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load bookings');
        }
        
        userBookings = data.bookings || [];
        renderBookings();
        
    } catch (error) {
        console.error('Error loading bookings:', error);
        bookingsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>Error loading bookings</h3>
                <p>${error.message}</p>
            </div>
        `;
    } finally {
        loadingBookings.style.display = 'none';
    }
}

function renderBookings() {
    if (userBookings.length === 0) {
        noBookings.style.display = 'block';
        return;
    }
    
    const bookingsHTML = userBookings.map(booking => `
        <div class="booking-card">
            <div class="booking-header">
                <span class="booking-reference">${booking.booking_reference}</span>
                <span class="status-badge ${booking.status}">${capitalizeFirst(booking.status)}</span>
            </div>
            <div class="booking-info">
                <div class="info-row">
                    <span class="info-label">Plan:</span>
                    <span class="info-value">${capitalizeFirst(booking.plan_type)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Dates:</span>
                    <span class="info-value">${formatDate(booking.start_date)} - ${formatDate(booking.end_date)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total:</span>
                    <span class="info-value">₱${parseFloat(booking.total_price).toLocaleString('en-PH')}</span>
                </div>
            </div>
            <div class="booking-actions">
                <button class="btn btn-primary btn-small" onclick="showBookingDetail('${booking.id}')">View Details</button>
            </div>
        </div>
    `).join('');
    
    bookingsContainer.innerHTML = bookingsHTML;
}

async function loadBlockedDates() {
    try {
        const response = await fetch('/api/bookings/blocked-dates');
        const data = await response.json();
        
        if (response.ok && data.blocked_dates) {
            blockedDates = data.blocked_dates;
        }
    } catch (error) {
        console.error('Error loading blocked dates:', error);
    }
}

// Date Picker Functions - REPLACE THIS ENTIRE SECTION
// Initialize FullCalendar
function initializeCalendar() {
    const calendarEl = document.getElementById('booking-calendar');
    if (!calendarEl) return;
    
    // Destroy existing calendar if any
    if (calendar) {
        calendar.destroy();
    }
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: ''
        },
        selectable: true,
        selectMirror: true,
        validRange: {
            start: new Date().toISOString().split('T')[0]
        },
        
        // Handle date selection
        select: function(info) {
            const startDate = info.startStr;
            const endDate = new Date(info.end);
            endDate.setDate(endDate.getDate() - 1); // Adjust for FullCalendar's exclusive end
            const endDateStr = endDate.toISOString().split('T')[0];
            
            // Check if any date in range is blocked
            const selectedDates = getDatesInRange(startDate, endDateStr);
            const hasBlockedDate = selectedDates.some(date => blockedDates.includes(date));
            
            if (hasBlockedDate) {
                alert('One or more selected dates are already booked. Please choose different dates.');
                calendar.unselect();
                return;
            }
            
            // Update selected dates
            selectedStartDate = startDate;
            selectedEndDate = endDateStr;
            
            // Update input fields
            document.getElementById('start-date').value = startDate;
            document.getElementById('end-date').value = endDateStr;
            
            // Update note
            document.getElementById('calendar-note').textContent = 
                `Selected: ${formatDate(startDate)} to ${formatDate(endDateStr)}`;
            
            updateCalendarSelection();
            updateSummary();
        },
        
        // Handle single date click
        dateClick: function(info) {
            const clickedDate = info.dateStr;
            
            // Prevent selecting past dates
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (new Date(clickedDate) < today) {
                alert('Cannot select past dates.');
                return;
            }
            
            // Check if date is blocked
            if (blockedDates.includes(clickedDate)) {
                alert('This date is already booked. Please choose another date.');
                return;
            }
            
            // If no start date or both dates selected, start new selection
            if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
                selectedStartDate = clickedDate;
                selectedEndDate = null;
                document.getElementById('start-date').value = clickedDate;
                document.getElementById('end-date').value = '';
                document.getElementById('calendar-note').textContent = 
                    'Now click on your end date';
                
                updateCalendarSelection();
                updateSummary();
            }
            // If start date exists but no end date
            else if (selectedStartDate && !selectedEndDate) {
                // Ensure end date is after or equal to start date
                if (clickedDate < selectedStartDate) {
                    // Swap dates - make clicked date the new start
                    selectedEndDate = selectedStartDate;
                    selectedStartDate = clickedDate;
                    document.getElementById('start-date').value = clickedDate;
                    document.getElementById('end-date').value = selectedEndDate;
                } else {
                    // Normal case - clicked date becomes end date
                    selectedEndDate = clickedDate;
                    document.getElementById('end-date').value = clickedDate;
                }
                
                // Check if range has blocked dates
                const selectedDates = getDatesInRange(selectedStartDate, selectedEndDate);
                const hasBlockedDate = selectedDates.some(date => blockedDates.includes(date));
                
                if (hasBlockedDate) {
                    alert('One or more dates in this range are already booked. Please choose different dates.');
                    // Reset selection
                    selectedStartDate = null;
                    selectedEndDate = null;
                    document.getElementById('start-date').value = '';
                    document.getElementById('end-date').value = '';
                    document.getElementById('calendar-note').textContent = 
                        'Click on the calendar to select your rental dates';
                    updateCalendarSelection();
                    updateSummary();
                    return;
                }
                
                document.getElementById('calendar-note').textContent = 
                    `Selected: ${formatDate(selectedStartDate)} to ${formatDate(selectedEndDate)}`;
                
                updateCalendarSelection();
                updateSummary();
            }
        },
        
        // Style dates
        dayCellDidMount: function(info) {
            const dateStr = info.date.toISOString().split('T')[0];
            
            // Mark blocked dates
            if (blockedDates.includes(dateStr)) {
                info.el.classList.add('blocked');
            }
            // Mark past dates
            else if (info.date < new Date().setHours(0, 0, 0, 0)) {
                info.el.classList.add('fc-day-past');
            }
            // Mark available future dates
            else {
                info.el.classList.add('available');
            }
        }
    });
    
    calendar.render();
    updateCalendarSelection();
}

// Update calendar visual selection
function updateCalendarSelection() {
    if (!calendar) return;
    
    // Remove all selected classes
    const allDayCells = document.querySelectorAll('#booking-calendar .fc-daygrid-day');
    allDayCells.forEach(cell => cell.classList.remove('selected'));
    
    // Add selected class to range
    if (selectedStartDate && selectedEndDate) {
        const selectedDates = getDatesInRange(selectedStartDate, selectedEndDate);
        
        allDayCells.forEach(cell => {
            const dateStr = cell.getAttribute('data-date');
            if (dateStr && selectedDates.includes(dateStr)) {
                cell.classList.add('selected');
            }
        });
    }
    // Highlight just start date if only start is selected
    else if (selectedStartDate) {
        allDayCells.forEach(cell => {
            const dateStr = cell.getAttribute('data-date');
            if (dateStr === selectedStartDate) {
                cell.classList.add('selected');
            }
        });
    }
}

function getDatesInRange(startDate, endDate) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
}

// Booking Modal Functions
function openBookingModal() {
    bookingModal.classList.add('show');
    bookingForm.reset();
    formError.classList.remove('show');
    document.getElementById('image-preview').innerHTML = '';
    
    // Reset calendar selection
    selectedStartDate = null;
    selectedEndDate = null;
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    document.getElementById('calendar-note').textContent = 'Click on the calendar to select your rental dates';
    
    // Initialize calendar AFTER modal is visible
    setTimeout(() => {
        initializeCalendar();
    }, 100);
    
    updateSummary();
}

function closeModals() {
    bookingModal.classList.remove('show');
    detailModal.classList.remove('show');
    
    // Destroy calendar when closing modal
    if (calendar) {
        calendar.destroy();
        calendar = null;
    }
}

function updateSummary() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const DAILY_RATE = 1399;
    
    // Calculate duration and total
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        
        const total = DAILY_RATE * days;
        const downPayment = total * 0.5; // 50% down payment
        
        document.getElementById('summary-duration').textContent = `${days} day${days > 1 ? 's' : ''}`;
        document.getElementById('summary-dates').textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
        document.getElementById('summary-total').textContent = `₱${total.toLocaleString('en-PH')}`;
        document.getElementById('summary-down-payment').textContent = `₱${downPayment.toLocaleString('en-PH')}`;
    } else {
        document.getElementById('summary-duration').textContent = '-';
        document.getElementById('summary-dates').textContent = '-';
        document.getElementById('summary-total').textContent = '₱0';
        document.getElementById('summary-down-payment').textContent = '₱0';
    }
}

// Booking Submission
async function handleBookingSubmit(e) {
    e.preventDefault();
    
    // Validate profile first
    if (!currentUser.profile || !currentUser.profile.name || !currentUser.profile.phone) {
        formError.textContent = 'Your profile is incomplete. Please contact support to complete your setup.';
        formError.classList.add('show');
        return;
    }
    
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const deliveryAddress = document.getElementById('delivery-address').value;
    const specialRequests = document.getElementById('special-requests').value;
    const payment = document.querySelector('input[name="payment"]:checked');
    const paymentProofFile = document.getElementById('payment-proof').files[0];
    const termsAccepted = document.getElementById('terms-checkbox').checked;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    formError.classList.remove('show');
    
    // Validation
    if (!startDate || !endDate || !deliveryAddress || !payment) {
        formError.textContent = 'Please fill in all required fields';
        formError.classList.add('show');
        return;
    }
    
    if (!termsAccepted) {
        formError.textContent = 'Please accept the Terms & Conditions';
        formError.classList.add('show');
        return;
    }
    
    if (payment.value === 'gcash' && !paymentProofFile) {
        formError.textContent = 'Please upload your GCash payment proof';
        formError.classList.add('show');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
        const DAILY_RATE = 1399;
        
        // Calculate total
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        const total = DAILY_RATE * days;
        const downPayment = total * 0.5;
        
        // Upload payment proof if GCash
        let paymentProofUrl = null;
        if (payment.value === 'gcash' && paymentProofFile) {
            paymentProofUrl = await uploadPaymentProof(paymentProofFile);
        }
        
        // Submit booking
        const response = await fetch('/api/bookings/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.access_token}`
            },
            body: JSON.stringify({
                plan_type: 'daily', // Fixed plan type
                start_date: startDate,
                end_date: endDate,
                delivery_address: deliveryAddress,
                special_requests: specialRequests,
                payment_method: payment.value,
                payment_proof_url: paymentProofUrl,
                total_price: total,
                down_payment: downPayment
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            if (data.code === 'PROFILE_NOT_FOUND' || data.code === 'PROFILE_INCOMPLETE') {
                throw new Error(data.error + ' Please contact support.');
            }
            throw new Error(data.error || 'Failed to create booking');
        }
        
        // Success
        closeModals();
        alert('Booking submitted successfully! We will review and confirm your booking shortly.\n\nReminder: Full payment, security deposit, and valid ID required upon pickup/delivery.');
        
        // Redirect to Facebook
        setTimeout(() => {
            window.open('https://facebook.com/YOUR_PAGE_HERE', '_blank');
        }, 1000);
        
        // Reload bookings
        loadBookings();
        
    } catch (error) {
        console.error('Booking error:', error);
        formError.textContent = error.message;
        formError.classList.add('show');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Booking';
    }
}

async function uploadPaymentProof(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const base64 = reader.result.split(',')[1];
                
                const response = await fetch('/api/upload/payment-proof', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentUser.access_token}`
                    },
                    body: JSON.stringify({
                        file: base64,
                        filename: file.name,
                        mimetype: file.type
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Upload failed');
                }
                
                resolve(data.url);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// View Booking Details
function showBookingDetail(bookingId) {
    const booking = userBookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    const detailHTML = `
        <div class="booking-info">
            <div class="info-row">
                <span class="info-label">Reference:</span>
                <span class="info-value"><strong>${booking.booking_reference}</strong></span>
            </div>
            <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value"><span class="status-badge ${booking.status}">${capitalizeFirst(booking.status)}</span></span>
            </div>
            <div class="info-row">
                <span class="info-label">Plan:</span>
                <span class="info-value">${capitalizeFirst(booking.plan_type)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Start Date:</span>
                <span class="info-value">${formatDate(booking.start_date)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">End Date:</span>
                <span class="info-value">${formatDate(booking.end_date)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Delivery Address:</span>
                <span class="info-value">${booking.delivery_address}</span>
            </div>
            ${booking.special_requests ? `
            <div class="info-row">
                <span class="info-label">Special Requests:</span>
                <span class="info-value">${booking.special_requests}</span>
            </div>
            ` : ''}
            <div class="info-row">
                <span class="info-label">Total:</span>
                <span class="info-value"><strong>₱${parseFloat(booking.total_price).toLocaleString('en-PH')}</strong></span>
            </div>
            <div class="info-row">
                <span class="info-label">Payment Method:</span>
                <span class="info-value">${booking.payment_method === 'gcash' ? 'GCash' : 'Direct Payment'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Booked On:</span>
                <span class="info-value">${formatDateTime(booking.created_at)}</span>
            </div>
        </div>
    `;
    
    document.getElementById('booking-detail-content').innerHTML = detailHTML;
    detailModal.classList.add('show');
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

// Make function available globally
window.showBookingDetail = showBookingDetail;