// api/env.js
// Vercel Serverless Function to inject environment variables

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/javascript');

  // Return environment variables as JavaScript
  const envScript = `
    window.ENV = window.ENV || {};
    window.ENV.SUPABASE_URL = '${process.env.SUPABASE_URL || ''}';
    window.ENV.SUPABASE_ANON_KEY = '${process.env.SUPABASE_ANON_KEY || ''}';
    window.ENV.EMAILJS_PUBLIC_KEY = '${process.env.EMAILJS_PUBLIC_KEY || ''}';
    window.ENV.EMAILJS_SERVICE_ID = '${process.env.EMAILJS_SERVICE_ID || ''}';
    window.ENV.EMAILJS_TEMPLATE_USER = '${process.env.EMAILJS_TEMPLATE_USER || ''}';
    window.ENV.EMAILJS_TEMPLATE_ADMIN = '${process.env.EMAILJS_TEMPLATE_ADMIN || ''}';
    window.ENV.EMAILJS_TEMPLATE_APPROVED = '${process.env.EMAILJS_TEMPLATE_APPROVED || ''}';
    window.ENV.EMAILJS_TEMPLATE_REJECTED = '${process.env.EMAILJS_TEMPLATE_REJECTED || ''}';
  `;

  res.status(200).send(envScript);
};