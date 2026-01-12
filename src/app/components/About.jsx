import Image from 'next/image'

export default function About() {
  return (
    <section id="about" className="min-h-screen flex items-center py-24 bg-white">
      <div className="container mx-auto px-6 max-w-[1400px]">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div className="relative">
            <Image
              src="/scenery.png"
              alt="Starlink satellite internet setup at a beach resort"
              width={600}
              height={600}
              className="rounded-3xl shadow-2xl object-cover w-full"
            />
          </div>

          {/* Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#2D5F5D] mb-6 leading-tight">
              Your Adventure Partner
            </h2>
            <p className="text-base text-[#5A6B6C] mb-5 leading-relaxed">
              Whether you're a digital nomad working from paradise, organizing an outdoor event, or need temporary connectivity in remote locations, Nomad Connect brings Starlink's revolutionary satellite internet to you.
            </p>
            <p className="text-base text-[#5A6B6C] mb-8 leading-relaxed">
              We understand the Filipino spirit of adventure and the need to stay connected wherever your journey takes you. That's why we offer flexible rental options perfect for island hopping, mountain retreats, beach resorts, or anywhere else life leads you.
            </p>

            {/* Features */}
            <div className="flex flex-col gap-4">
              {[
                'Nationwide Delivery',
                'Setup Assistance',
                '24/7 Support'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#4FA39A] flex items-center justify-center text-white text-sm font-bold">
                    ✓
                  </div>
                  <span className="font-medium text-[#2D5F5D]">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}