'use client'

export default function Pricing() {
  const plans = [
    {
      icon: '📅',
      title: 'Daily Rate',
      subtitle: 'Perfect for short trips',
      price: '1,500',
      period: '/day',
      features: [
        'Complete Starlink Kit',
        'Up to 150 Mbps Speed',
        'Unlimited Data',
        'Setup Instructions',
        'Technical Support'
      ],
      featured: false
    },
    {
      icon: '📆',
      title: 'Weekly Rate',
      subtitle: 'Ideal for events & getaways',
      price: '8,500',
      period: '/week',
      features: [
        'Complete Starlink Kit',
        'Up to 150 Mbps Speed',
        'Unlimited Data',
        'Free Delivery (Metro Manila)',
        'Setup Assistance',
        'Priority Support'
      ],
      featured: true,
      badge: 'Best Value'
    },
    {
      icon: '📋',
      title: 'Monthly Rate',
      subtitle: 'Long-term solution',
      price: '28,000',
      period: '/month',
      features: [
        'Complete Starlink Kit',
        'Up to 150 Mbps Speed',
        'Unlimited Data',
        'Free Delivery Nationwide',
        'Professional Installation',
        'Equipment Insurance',
        '24/7 Premium Support'
      ],
      featured: false
    }
  ]

  const handleBooking = (plan) => {
    alert(`Great choice! You've selected the ${plan.title} at ₱${plan.price}. Please scroll down to contact us and we'll help you get connected!`)
    const contactSection = document.getElementById('contact')
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="pricing" className="min-h-screen flex items-center py-24 bg-white relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-r from-[#4FA39A] to-[#5AB5B8] opacity-5" />

      <div className="container mx-auto px-6 max-w-[1400px] relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-[#2D5F5D] mb-4 text-center leading-tight">
          Rental Plans
        </h2>
        <p className="text-lg text-[#5A6B6C] text-center mb-16">
          Affordable connectivity for every need
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1200px] mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-3xl p-10 text-center transition-all hover:-translate-y-3 hover:shadow-2xl border-2 relative ${
                plan.featured 
                  ? 'border-[#4FA39A] border-[3px] shadow-xl' 
                  : 'border-[#D4BA8E] shadow-lg'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#4FA39A] to-[#5AB5B8] text-white px-6 py-2 rounded-full text-xs font-bold tracking-wider">
                  {plan.badge}
                </div>
              )}

              <div className="w-[70px] h-[70px] bg-gradient-to-r from-[#4FA39A] to-[#5AB5B8] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                {plan.icon}
              </div>

              <h3 className="text-2xl font-bold text-[#2D5F5D] mb-2">
                {plan.title}
              </h3>
              <p className="text-sm text-[#5A6B6C] mb-7">
                {plan.subtitle}
              </p>

              <div className="my-8 py-6 border-t-2 border-b-2 border-[#D4BA8E]">
                <span className="text-2xl text-[#5A6B6C]">₱</span>
                <span className="text-5xl font-extrabold text-[#2D5F5D]">{plan.price}</span>
                <span className="text-base text-[#5A6B6C] ml-1">{plan.period}</span>
              </div>

              <ul className="text-left mb-8 space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="text-sm text-[#1A2728] py-3 border-b border-gray-100 last:border-0">
                    ✓ {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleBooking(plan)}
                className="w-full px-6 py-4 rounded-full font-semibold text-white bg-gradient-to-r from-[#4FA39A] to-[#5AB5B8] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                Book {plan.title.split(' ')[0]}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center mt-10 text-[#5A6B6C] text-xs italic">
          *Security deposit required. Delivery charges may apply outside Metro Manila.
        </p>
      </div>
    </section>
  )
}