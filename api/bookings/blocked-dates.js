// api/bookings/blocked-dates.js
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Initialize Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        // Fetch all confirmed bookings
        const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('start_date, end_date, booking_reference')
            .eq('status', 'confirmed');

        if (bookingsError) {
            throw new Error(bookingsError.message);
        }

        console.log('Confirmed bookings:', bookings); // Debug log

        // Convert booking date ranges to array of blocked dates
        const blockedDatesSet = new Set();
        
        bookings.forEach(booking => {
            const start = new Date(booking.start_date + 'T00:00:00');
            const end = new Date(booking.end_date + 'T00:00:00');
            
            console.log(`Processing booking ${booking.booking_reference}: ${booking.start_date} to ${booking.end_date}`); // Debug log
            
            // Add all dates in the range (inclusive)
            const currentDate = new Date(start);
            while (currentDate <= end) {
                const dateStr = currentDate.toISOString().split('T')[0];
                blockedDatesSet.add(dateStr);
                console.log(`  Blocking date: ${dateStr}`); // Debug log
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });

        const blockedDates = Array.from(blockedDatesSet).sort();
        
        console.log('Total blocked dates:', blockedDates.length); // Debug log
        console.log('Blocked dates array:', blockedDates); // Debug log

        return res.status(200).json({
            blocked_dates: blockedDates,
            total_confirmed_bookings: bookings.length
        });

    } catch (error) {
        console.error('Error fetching blocked dates:', error);
        return res.status(500).json({
            error: error.message || 'Failed to fetch blocked dates',
            blocked_dates: []
        });
    }
};