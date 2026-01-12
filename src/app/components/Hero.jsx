'use client'

export default function Hero() {
  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section 
      id="home"
      className="relative min-h-screen flex items-center bg-gradient-to-br from-[#2D5F5D] via-[#4FA39A] to-[#5AB5B8] pt-20 pb-16 overflow-hidden"
    >
      {/* Decorative Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.1)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
      
      {/* Animated Wave */}
      <div className="absolute inset-0 opacity-30">
        <svg className="absolute bottom-0 w-full h-24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path fill="rgba(245,241,232,0.1)" d="M0,0 C150,50 350,50 600,20 C850,50 1050,50 1200,0 L1200,120 L0,120 Z">
            <animate
              attributeName="d"
              dur="15s"
              repeatCount="indefinite"
              values="
                M0,0 C150,50 350,50 600,20 C850,50 1050,50 1200,0 L1200,120 L0,120 Z;
                M0,20 C150,0 350,0 600,50 C850,0 1050,0 1200,20 L1200,120 L0,120 Z;
                M0,0 C150,50 350,50 600,20 C850,50 1050,50 1200,0 L1200,120 L0,120 Z
              "
            />
          </path>
        </svg>
      </div>

      <div className="container mx-auto px-6 max-w-[1400px] relative z-10">
        <div className="text-center max-w-[900px] mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            Stay Connected Anywhere in the Philippines
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-[700px] mx-auto mb-10 leading-relaxed">
            From pristine beaches to remote mountains, experience high-speed satellite internet with Starlink rental services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => scrollToSection('pricing')}
              className="px-10 py-4 rounded-full font-semibold text-white bg-gradient-to-r from-[#4FA39A] to-[#5AB5B8] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-lg"
            >
              Explore Plans
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="px-10 py-4 rounded-full font-semibold text-white border-2 border-white hover:bg-white hover:text-[#2D5F5D] transition-all text-lg"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-white/70 text-sm">
        <span className="block mb-2">Scroll Down</span>
        <div className="w-0.5 h-8 bg-gradient-to-b from-white/70 to-transparent mx-auto animate-bounce" />
      </div>
    </section>
  )
}