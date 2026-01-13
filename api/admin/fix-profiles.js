const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    // Only allow from localhost or with admin key
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_FIX_KEY) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Get all users without profiles
        const { data: users } = await supabase.auth.admin.listUsers();
        const { data: profiles } = await supabase.from('user_profiles').select('user_id');
        
        const profileUserIds = new Set(profiles.map(p => p.user_id));
        const usersWithoutProfiles = users.users.filter(u => !profileUserIds.has(u.id));

        // Create missing profiles
        const fixes = [];
        for (const user of usersWithoutProfiles) {
            const { data, error } = await supabase
                .from('user_profiles')
                .insert({
                    user_id: user.id,
                    name: user.user_metadata?.name || user.email.split('@')[0],
                    phone: '',
                    address: ''
                })
                .select()
                .single();

            fixes.push({ user_id: user.id, success: !error, error: error?.message });
        }

        return res.status(200).json({ fixed: fixes });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};