// api/bookings/create.js
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get authorization token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.substring(7);
        const {
            plan_type,
            start_date,
            end_date,
            delivery_address,
            special_requests,
            payment_method,
            payment_proof_url,
            total_price
        } = req.body;

        // Validation
        if (!plan_type || !start_date || !end_date || !delivery_address || !payment_method || !total_price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Initialize Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            }
        );

        // Verify user
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        
        if (userError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (profileError) {
            return res.status(400).json({ error: 'User profile not found' });
        }

        // Check for date conflicts
        const { data: conflicts, error: conflictError } = await supabase
            .rpc('check_booking_conflict', {
                p_start_date: start_date,
                p_end_date: end_date
            });

        if (conflictError) {
            console.error('Conflict check error:', conflictError);
        }

        if (conflicts === true) {
            return res.status(400).json({ 
                error: 'Selected dates are not available. Please choose different dates.' 
            });
        }

        // Create booking
        const { data: newBooking, error: bookingError } = await supabase
            .from('bookings')
            .insert({
                user_id: user.id,
                customer_name: profile.name,
                customer_email: user.email,
                customer_phone: profile.phone,
                delivery_address: delivery_address,
                start_date: start_date,
                end_date: end_date,
                plan_type: plan_type,
                total_price: total_price,
                payment_method: payment_method,
                special_requests: special_requests,
                status: 'pending'
            })
            .select()
            .single();

        if (bookingError) {
            throw new Error(bookingError.message);
        }

        return res.status(201).json({
            success: true,
            booking: newBooking,
            message: 'Booking created successfully'
        });

    } catch (error) {
        console.error('Error creating booking:', error);
        return res.status(500).json({
            error: error.message || 'Failed to create booking'
        });
    }
};