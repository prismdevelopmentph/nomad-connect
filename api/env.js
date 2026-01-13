// Vercel Serverless Function to inject environment variables
// This allows us to keep API keys secure while making them available to the frontend

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/javascript');

  // Return environment variables as JavaScript
  const envScript = `
    window.ENV = {
      SUPABASE_URL: '${process.env.SUPABASE_URL || ''}',
      SUPABASE_ANON_KEY: '${process.env.SUPABASE_ANON_KEY || ''}',
      EMAILJS_PUBLIC_KEY: '${process.env.EMAILJS_PUBLIC_KEY || ''}',
      EMAILJS_SERVICE_ID: '${process.env.EMAILJS_SERVICE_ID || ''}',
      EMAILJS_TEMPLATE_USER: '${process.env.EMAILJS_TEMPLATE_USER || ''}',
      EMAILJS_TEMPLATE_ADMIN: '${process.env.EMAILJS_TEMPLATE_ADMIN || ''}',
      EMAILJS_TEMPLATE_APPROVED: '${process.env.EMAILJS_TEMPLATE_APPROVED || ''}',
      EMAILJS_TEMPLATE_REJECTED: '${process.env.EMAILJS_TEMPLATE_REJECTED || ''}'
    };
  `;

  res.status(200).send(envScript);
}