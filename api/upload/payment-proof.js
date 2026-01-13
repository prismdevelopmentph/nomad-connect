// api/upload/payment-proof.js
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
        const { file, filename, mimetype } = req.body;

        if (!file || !filename) {
            return res.status(400).json({ error: 'File data and filename required' });
        }

        // Initialize Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for storage
        );

        // Verify user
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        
        if (userError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Convert base64 to buffer
        const fileBuffer = Buffer.from(file, 'base64');

        // Generate unique filename
        const timestamp = Date.now();
        const uniqueFilename = `${user.id}_${timestamp}_${filename}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('payment-proofs')
            .upload(uniqueFilename, fileBuffer, {
                contentType: mimetype,
                upsert: false
            });

        if (uploadError) {
            throw new Error(uploadError.message);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('payment-proofs')
            .getPublicUrl(uniqueFilename);

        return res.status(200).json({
            success: true,
            url: urlData.publicUrl,
            filename: uniqueFilename
        });

    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            error: error.message || 'Failed to upload file'
        });
    }
};