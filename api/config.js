// api/config.js
// Serverless function to provide all configuration from environment variables

export default function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', 'application/json');
    
    // Return all configuration from environment variables
    return res.status(200).json({
        supabase: {
            url: process.env.SUPABASE_URL || '',
            anonKey: process.env.SUPABASE_ANON_KEY || ''
        },
        emailjs: {
            publicKey: process.env.EMAILJS_PUBLIC_KEY || '',
            serviceId: process.env.EMAILJS_SERVICE_ID || '',
            templates: {
                user: process.env.EMAILJS_TEMPLATE_USER || '',
                admin: process.env.EMAILJS_TEMPLATE_ADMIN || '',
                approved: process.env.EMAILJS_TEMPLATE_APPROVED || '',
                rejected: process.env.EMAILJS_TEMPLATE_REJECTED || ''
            }
        }
    });
}