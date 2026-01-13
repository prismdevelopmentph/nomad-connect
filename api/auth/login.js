// api/auth/login.js
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Initialize Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        // Sign in with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            throw new Error(authError.message);
        }

        if (!authData.session || !authData.user) {
            throw new Error('Authentication failed');
        }

        // Check if user is admin
        const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', authData.user.id)
            .single();

        if (roleError || !roleData || roleData.role !== 'admin') {
            throw new Error('Access denied. Admin privileges required.');
        }

        return res.status(200).json({
            access_token: authData.session.access_token,
            user_id: authData.user.id,
            email: authData.user.email,
            role: 'admin'
        });
        
    } catch (error) {
        console.error('Login error:', error);
        return res.status(401).json({ 
            error: error.message || 'Authentication failed' 
        });
    }
};