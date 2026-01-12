import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Nomad Connect - Starlink Satellite Rental Philippines',
  description: 'Stay connected anywhere in the Philippines. Rent Starlink satellite internet for beaches, mountains, remote islands, and events. Flexible daily, weekly, and monthly plans.',
  keywords: 'Starlink rental Philippines, satellite internet rental, portable wifi Philippines, beach internet, remote connectivity, digital nomad Philippines',
  authors: [{ name: 'Nomad Connect' }],
  openGraph: {
    title: 'Nomad Connect - Starlink Satellite Rental Philippines',
    description: 'High-speed satellite internet rental across the Philippines. Perfect for digital nomads, events, and remote locations.',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}