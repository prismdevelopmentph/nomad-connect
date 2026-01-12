'use client'

import Image from 'next/image'

export default function Footer() {
  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="bg-[#2C3E3F] text-white/80 py-16">
      <div className="container mx-auto px-6 max-w-[1400px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-10">
          {/* Brand */}
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-5">
              <Image 
                src="/logo.png" 
                alt="Nomad Connect" 
                width={50} 
                height={50}
                className="rounded-full"
              />
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-bold text-white tracking-wider">NOMAD CONNECT</span>
                <span className="text-xs text-white/70 font-medium">Starlink Rentals</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/70">
              Bringing satellite internet connectivity to every corner of the Philippines. Adventure awaits, stay connected.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">Quick Links</h4>
            <div className="flex flex-col gap-3">
              {['home', 'about', 'pricing', 'coverage', 'contact'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item)}
                  className="text-sm text-white/70 hover:text-[#4FA39A] transition-colors text-left"
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">Get in Touch</h4>
            <div className="flex flex-col gap-3 text-sm text-white/70">
              <p>📧 hello@nomadconnect.ph</p>
              <p>📱 +63 XXX XXX XXXX</p>
              <p>📍 Metro Manila, Philippines</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 text-center">
          <p className="text-sm text-white/60">
            &copy; 2024 Nomad Connect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}