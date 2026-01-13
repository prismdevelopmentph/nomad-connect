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
            .select('start_date, end_date')
            .eq('status', 'confirmed');

        if (bookingsError) {
            throw new Error(bookingsError.message);
        }

        // Convert booking date ranges to array of blocked dates
        const blockedDates = [];
        
        bookings.forEach(booking => {
            const start = new Date(booking.start_date);
            const end = new Date(booking.end_date);
            
            // Add all dates in the range
            for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
                const dateStr = date.toISOString().split('T')[0];
                if (!blockedDates.includes(dateStr)) {
                    blockedDates.push(dateStr);
                }
            }
        });

        return res.status(200).json({
            blocked_dates: blockedDates
        });

    } catch (error) {
        console.error('Error fetching blocked dates:', error);
        return res.status(500).json({
            error: error.message || 'Failed to fetch blocked dates',
            blocked_dates: []
        });
    }
};