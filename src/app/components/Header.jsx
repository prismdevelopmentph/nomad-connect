'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsMenuOpen(false)
    }
  }

  return (
    <header 
      className={`sticky top-0 z-[1000] bg-[#F5F1E8]/95 backdrop-blur-[10px] border-b-2 border-[#D4BA8E] py-4 transition-shadow ${
        scrolled ? 'shadow-lg' : 'shadow-md'
      }`}
    >
      <div className="container mx-auto px-6 max-w-[1400px]">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="Nomad Connect" 
              width={50} 
              height={50}
              className="rounded-full"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold text-[#2D5F5D] tracking-wider">NOMAD CONNECT</span>
              <span className="text-xs text-[#5A6B6C] font-medium">Starlink Rentals</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex gap-8 items-center">
            {['home', 'about', 'pricing', 'coverage', 'contact'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className="text-[#1A2728] font-medium hover:text-[#4FA39A] transition-colors relative group"
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
                <span className="absolute bottom-[-4px] left-0 w-0 h-[2px] bg-[#4FA39A] group-hover:w-full transition-all duration-300" />
              </button>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex gap-3">
            <button
              onClick={() => scrollToSection('contact')}
              className="px-6 py-3 rounded-full font-semibold text-[#2D5F5D] border-2 border-[#2D5F5D] hover:bg-[#2D5F5D] hover:text-white transition-all"
            >
              Get in Touch
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[#4FA39A] to-[#5AB5B8] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              View Rates
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden flex flex-col gap-1 p-2"
            aria-label="Toggle menu"
          >
            <span className={`w-6 h-0.5 bg-[#2D5F5D] transition-all ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`w-6 h-0.5 bg-[#2D5F5D] transition-all ${isMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`w-6 h-0.5 bg-[#2D5F5D] transition-all ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="lg:hidden flex flex-col gap-4 mt-6 pb-6 border-t-2 border-[#D4BA8E] pt-6">
            {['home', 'about', 'pricing', 'coverage', 'contact'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className="text-[#1A2728] font-medium hover:text-[#4FA39A] transition-colors text-left"
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}