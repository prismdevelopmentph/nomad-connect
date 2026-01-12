# Nomad Connect - Starlink Rental Service

A modern, responsive Next.js website for Starlink satellite internet rental services in the Philippines.

## Features

- 🚀 Built with Next.js 14 (App Router)
- 🎨 Styled with Tailwind CSS
- 📱 Fully responsive design
- ⚡ Optimized performance
- 🔍 SEO-friendly
- 🖼️ Image optimization with next/image

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/nomad-connect.git
cd nomad-connect
```

2. Install dependencies:
```bash
npm install
```

3. Add your images to the `public` folder:
   - `logo.png` - Company logo
   - `scenery.png` - About section image

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
nomad-connect/
├── public/              # Static files
├── src/
│   └── app/
│       ├── components/  # React components
│       ├── globals.css  # Global styles
│       ├── layout.jsx   # Root layout
│       └── page.jsx     # Home page
├── next.config.js       # Next.js configuration
└── package.json         # Dependencies
```

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Import your repository
4. Vercel will auto-detect Next.js and deploy

### Manual Deployment

```bash
npm run build
npm run start
```

## Customization

### Update Contact Information

Edit the contact details in:
- `src/app/components/Contact.jsx`
- `src/app/components/Footer.jsx`

### Modify Pricing

Update pricing plans in:
- `src/app/components/Pricing.jsx`

### Change Colors

The color scheme is defined using Tailwind classes. Main colors:
- Primary Teal: `#4FA39A`
- Dark Teal: `#2D5F5D`
- Sand: `#D4BA8E`
- Cream: `#F5F1E8`

## Built With

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## License

Copyright © 2024 Nomad Connect. All rights reserved.

## Support

For issues or questions, please contact hello@nomadconnect.ph