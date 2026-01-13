// booking/dashboard.js

let currentUser = null;
let userBookings = [];
let blockedDates = [];
let calendar = null;
let selectedStartDate = null;
let selectedEndDate = null;
let isSelectingDates = false;

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

// Payment method - Both require payment proof now
document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const gcashSection = document.getElementById('gcash-upload-section');
        const bankSection = document.getElementById('bank-upload-section');
        const paymentProof = document.getElementById('payment-proof');
        const bankProof = document.getElementById('bank-payment-proof');
        
        if (e.target.value === 'gcash') {
            gcashSection.style.display = 'block';
            bankSection.style.display = 'none';
            paymentProof.required = true;
            bankProof.required = false;
        } else if (e.target.value === 'bank') {
            gcashSection.style.display = 'none';
            bankSection.style.display = 'block';
            paymentProof.required = false;
            bankProof.required = true;
        }
    });
});

// Payment proof preview for GCash
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

// Payment proof preview for Bank Transfer
document.getElementById('bank-payment-proof').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('bank-image-preview');
    
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

// Dashboard Functions
async function initializeDashboard() {
    const name = currentUser.profile?.name || currentUser.email.split('@')[0];
    welcomeName.textContent = name;
    userName.textContent = name;
    
    await loadBlockedDates();
    await loadBookings();
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
            console.log('✅ Loaded blocked dates:', blockedDates);
            console.log('📊 Total confirmed bookings:', data.total_confirmed_bookings);
        } else {
            console.error('❌ Failed to load blocked dates:', data);
        }
    } catch (error) {
        console.error('❌ Error loading blocked dates:', error);
    }
}

// Initialize FullCalendar
function initializeCalendar() {
    const calendarEl = document.getElementById('booking-calendar');
    if (!calendarEl) return;
    
    if (calendar) {
        calendar.destroy();
    }
    
    // Get today's date at midnight for accurate comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: ''
        },
        selectable: false,
        selectMirror: false,
        validRange: {
            start: today.toISOString().split('T')[0]
        },
        
        dateClick: function(info) {
            const clickedDate = info.dateStr;
            
            console.log('🖱️ Clicked date:', clickedDate);
            console.log('🚫 Blocked dates:', blockedDates);
            console.log('❓ Is blocked?', blockedDates.includes(clickedDate));
            
            // Check if date is in the past
            const clickedDateObj = new Date(clickedDate);
            clickedDateObj.setHours(0, 0, 0, 0);
            
            if (clickedDateObj < today) {
                alert('Cannot select past dates.');
                return;
            }
            
            // Check if date is blocked
            if (blockedDates.includes(clickedDate)) {
                alert('This date is already booked. Please choose another date.');
                return;
            }
            
            // Handle date selection logic
            if (!selectedStartDate) {
                // Select start date
                selectedStartDate = clickedDate;
                selectedEndDate = null;
                isSelectingDates = true;
                
                document.getElementById('start-date').value = clickedDate;
                document.getElementById('end-date').value = '';
                document.getElementById('calendar-note').textContent = 
                    `Start: ${formatDate(clickedDate)} - Now click your end date`;
                
                updateCalendarSelection();
                updateSummary();
                return;
            }
            
            if (selectedStartDate && !selectedEndDate && isSelectingDates) {
                // Select end date
                if (clickedDate < selectedStartDate) {
                    alert('End date must be on or after the start date. Please choose a later date.');
                    return;
                }
                
                // Check if any dates in range are blocked
                const selectedDates = getDatesInRange(selectedStartDate, clickedDate);
                const hasBlockedDate = selectedDates.some(date => blockedDates.includes(date));
                
                if (hasBlockedDate) {
                    alert('One or more dates in this range are already booked. Please choose different dates.');
                    selectedStartDate = null;
                    selectedEndDate = null;
                    isSelectingDates = false;
                    document.getElementById('start-date').value = '';
                    document.getElementById('end-date').value = '';
                    document.getElementById('calendar-note').textContent = 
                        'Click on the calendar to select your rental dates';
                    updateCalendarSelection();
                    updateSummary();
                    return;
                }
                
                selectedEndDate = clickedDate;
                isSelectingDates = false;
                
                document.getElementById('end-date').value = clickedDate;
                document.getElementById('calendar-note').textContent = 
                    `Selected: ${formatDate(selectedStartDate)} to ${formatDate(clickedDate)} (Click again to reselect)`;
                
                updateCalendarSelection();
                updateSummary();
                return;
            }
            
            // Reset selection
            if (selectedStartDate && selectedEndDate && !isSelectingDates) {
                selectedStartDate = clickedDate;
                selectedEndDate = null;
                isSelectingDates = true;
                
                document.getElementById('start-date').value = clickedDate;
                document.getElementById('end-date').value = '';
                document.getElementById('calendar-note').textContent = 
                    `Start: ${formatDate(clickedDate)} - Now click your end date`;
                
                updateCalendarSelection();
                updateSummary();
                return;
            }
        },
        
        dayCellDidMount: function(info) {
            // FIXED: Properly format date to match blocked dates format (YYYY-MM-DD)
            const cellDate = new Date(info.date);
            
            // Adjust for timezone to get accurate local date
            const localDate = new Date(cellDate.getTime() - cellDate.getTimezoneOffset() * 60000);
            const dateStr = localDate.toISOString().split('T')[0];
            
            console.log('📅 Rendering cell:', dateStr, 'Blocked?', blockedDates.includes(dateStr));
            
            // Remove any existing color classes first
            info.el.classList.remove('available', 'blocked', 'fc-day-past');
            
            // Get today at midnight for comparison
            const todayMidnight = new Date();
            todayMidnight.setHours(0, 0, 0, 0);
            
            const cellDateMidnight = new Date(cellDate);
            cellDateMidnight.setHours(0, 0, 0, 0);
            
            // Check if date is in the past
            if (cellDateMidnight < todayMidnight) {
                info.el.classList.add('fc-day-past');
                console.log('⏮️ Past date:', dateStr);
            }
            // Check if date is blocked
            else if (blockedDates.includes(dateStr)) {
                info.el.classList.add('blocked');
                console.log('🔴 Blocked date:', dateStr);
            }
            // Otherwise it's available
            else {
                info.el.classList.add('available');
                console.log('🟢 Available date:', dateStr);
            }
        }
    });
    
    calendar.render();
    updateCalendarSelection();
}

function updateCalendarSelection() {
    if (!calendar) return;
    
    const allDayCells = document.querySelectorAll('#booking-calendar .fc-daygrid-day');
    allDayCells.forEach(cell => cell.classList.remove('selected'));
    
    if (selectedStartDate && selectedEndDate) {
        const selectedDates = getDatesInRange(selectedStartDate, selectedEndDate);
        
        allDayCells.forEach(cell => {
            const dateStr = cell.getAttribute('data-date');
            if (dateStr && selectedDates.includes(dateStr)) {
                cell.classList.add('selected');
            }
        });
    }
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

async function openBookingModal() {
    bookingModal.classList.add('show');
    bookingForm.reset();
    formError.classList.remove('show');
    document.getElementById('image-preview').innerHTML = '';
    document.getElementById('bank-image-preview').innerHTML = '';
    
    selectedStartDate = null;
    selectedEndDate = null;
    isSelectingDates = false;
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    document.getElementById('calendar-note').textContent = 'Loading available dates...';
    
    // Reload blocked dates to get fresh data
    await loadBlockedDates();
    
    setTimeout(() => {
        initializeCalendar();
        document.getElementById('calendar-note').textContent = 'Click on the calendar to select your rental dates';
    }, 100);
    
    updateSummary();
}

function closeModals() {
    bookingModal.classList.remove('show');
    detailModal.classList.remove('show');
    
    if (calendar) {
        calendar.destroy();
        calendar = null;
    }
}

function updateSummary() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const DAILY_RATE = 1399; // ← UPDATED PRICE
    
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        
        const total = DAILY_RATE * days;
        const downPayment = total * 0.5;
        const balance = total - downPayment;
        
        document.getElementById('summary-duration').textContent = `${days} day${days > 1 ? 's' : ''}`;
        document.getElementById('summary-dates').textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
        document.getElementById('summary-total').textContent = `₱${total.toLocaleString('en-PH')}`;
        document.getElementById('summary-down-payment').textContent = `₱${downPayment.toLocaleString('en-PH')}`;
        document.getElementById('summary-balance').textContent = `₱${balance.toLocaleString('en-PH')}`;
    } else {
        document.getElementById('summary-duration').textContent = '-';
        document.getElementById('summary-dates').textContent = '-';
        document.getElementById('summary-total').textContent = '₱0';
        document.getElementById('summary-down-payment').textContent = '₱0';
        document.getElementById('summary-balance').textContent = '₱0';
    }
}

async function handleBookingSubmit(e) {
    e.preventDefault();
    
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
    const paymentProofFile = payment?.value === 'gcash' 
        ? document.getElementById('payment-proof').files[0]
        : document.getElementById('bank-payment-proof').files[0];
    const termsAccepted = document.getElementById('terms-checkbox').checked;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    formError.classList.remove('show');
    
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
    
    if (!paymentProofFile) {
        formError.textContent = 'Please upload your payment proof for the 50% reservation fee';
        formError.classList.add('show');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
        const DAILY_RATE = 1399;
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        const total = DAILY_RATE * days;
        const downPayment = total * 0.5;
        
        let paymentProofUrl = null;
        if (paymentProofFile) {
            paymentProofUrl = await uploadPaymentProof(paymentProofFile);
        }
        
        const response = await fetch('/api/bookings/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.access_token}`
            },
            body: JSON.stringify({
                plan_type: 'daily',
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
        
        closeModals();
        alert('Booking submitted successfully! We will review and confirm your booking shortly.\n\nReminder: Remaining balance, security deposit, and valid ID required upon pickup/delivery.');
        
        setTimeout(() => {
            window.open('https://facebook.com/YOUR_PAGE_HERE', '_blank');
        }, 1000);
        
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
                <span class="info-value">${booking.payment_method === 'gcash' ? 'GCash' : booking.payment_method === 'bank' ? 'Bank Transfer' : 'Direct Payment'}</span>
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

window.showBookingDetail = showBookingDetail;