// api/bookings/list.js
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get authorization token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.substring(7);

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

        // Verify user is admin
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        
        if (userError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (roleError || !roleData || roleData.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Fetch all bookings
        const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });

        if (bookingsError) {
            throw new Error(bookingsError.message);
        }

        return res.status(200).json({
            bookings: bookings || []
        });

    } catch (error) {
        console.error('Error fetching bookings:', error);
        return res.status(500).json({
            error: error.message || 'Failed to fetch bookings'
        });
    }
};