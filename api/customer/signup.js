// api/customer/signup.js
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, phone, address, password } = req.body;

    if (!name || !email || !phone || !address || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name
                }
            }
        });

        if (authError) {
            throw new Error(authError.message);
        }

        if (!authData.user) {
            throw new Error('Failed to create account');
        }

        // Create user profile
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .insert({
                user_id: authData.user.id,
                name,
                phone,
                address
            })
            .select()
            .single();

        if (profileError) {
            console.error('Profile creation error:', profileError);
            // If profile creation fails, we need to clean up the auth user
            // Note: This requires service role key, so we'll just throw an error
            throw new Error('Failed to create user profile. Please contact support or try again.');
        }

        // Create user role (customer)
        const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
                user_id: authData.user.id,
                role: 'customer'
            });

        if (roleError) {
            console.error('Role creation error:', roleError);
        }

        // Sign in the user immediately after signup
        const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (signInError || !sessionData.session) {
            throw new Error('Account created but login failed. Please try logging in.');
        }

        return res.status(201).json({
            access_token: sessionData.session.access_token,
            user_id: authData.user.id,
            email: authData.user.email,
            profile: profile || { name, phone, address }
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(400).json({ 
            error: error.message || 'Failed to create account'
        });
    }
};