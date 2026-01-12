export default function Coverage() {
  const coverageAreas = [
    {
      icon: '�️',
      title: 'Beach Resorts',
      locations: 'Palawan, Boracay, Siargao, Bohol, and more'
    },
    {
      icon: '⛰️',
      title: 'Mountain Retreats',
      locations: 'Baguio, Tagaytay, Sagada, Batanes'
    },
    {
      icon: '🏝️',
      title: 'Remote Islands',
      locations: 'Camiguin, Coron, Bantayan, Siquijor'
    },
    {
      icon: '🏢',
      title: 'Urban Events',
      locations: 'Manila, Cebu, Davao, Iloilo'
    }
  ]

  return (
    <section id="coverage" className="min-h-screen flex items-center py-24 bg-[#F5F1E8]">
      <div className="container mx-auto px-6 max-w-[1400px]">
        <h2 className="text-4xl md:text-5xl font-bold text-[#2D5F5D] mb-4 text-center leading-tight">
          Nationwide Coverage
        </h2>
        <p className="text-lg text-[#5A6B6C] text-center mb-16">
          Connecting the Philippines from shore to summit
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {coverageAreas.map((area, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl p-10 text-center transition-all hover:-translate-y-2 hover:shadow-lg border-2 border-transparent hover:border-[#4FA39A]"
            >
              <div className="text-6xl mb-5">
                {area.icon}
              </div>
              <h3 className="text-xl font-bold text-[#2D5F5D] mb-3">
                {area.title}
              </h3>
              <p className="text-sm text-[#5A6B6C] leading-relaxed">
                {area.locations}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}