export default function Features() {
  const features = [
    {
      icon: '🚀',
      title: 'Lightning Fast',
      description: 'Download speeds up to 150 Mbps with low latency. Stream, game, and work without interruption.'
    },
    {
      icon: '🌴',
      title: 'Island Coverage',
      description: 'Connect from Luzon to Mindanao. Beach resorts, mountains, or remote islands - we\'ve got you covered.'
    },
    {
      icon: '⚡',
      title: 'Quick Setup',
      description: 'Plug and play installation. Get online in minutes with our complete rental kit and guidance.'
    },
    {
      icon: '🎯',
      title: 'Flexible Terms',
      description: 'Daily, weekly, or monthly rentals. Choose what works best for your schedule and budget.'
    }
  ]

  return (
    <section className="min-h-screen flex items-center py-24 bg-[#F5F1E8]">
      <div className="container mx-auto px-6 max-w-[1400px]">
        <h2 className="text-4xl md:text-5xl font-bold text-[#2D5F5D] mb-4 text-center leading-tight">
          Why Choose Nomad Connect?
        </h2>
        <p className="text-lg text-[#5A6B6C] text-center mb-16">
          Reliable connectivity for every adventure
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl p-10 text-center transition-all hover:-translate-y-2 hover:shadow-xl border-2 border-transparent hover:border-[#4FA39A]"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#4FA39A] to-[#5AB5B8] rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-[#2D5F5D] mb-3">
                {feature.title}
              </h3>
              <p className="text-sm text-[#5A6B6C] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}