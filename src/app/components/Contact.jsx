export default function Contact() {
  const contactMethods = [
    {
      icon: '📱',
      title: 'Call or Text',
      info: '+63 XXX XXX XXXX',
      subtext: 'Mon-Sun, 8AM-8PM'
    },
    {
      icon: '✉️',
      title: 'Email Us',
      info: 'hello@nomadconnect.ph',
      subtext: '24-hour response time'
    },
    {
      icon: '💬',
      title: 'Social Media',
      info: 'Facebook | Instagram',
      subtext: '@nomadconnectph'
    }
  ]

  return (
    <section id="contact" className="min-h-screen flex items-center py-24 bg-gradient-to-br from-[#2D5F5D] to-[#4FA39A] relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />

      <div className="container mx-auto px-6 max-w-[1400px] relative z-10">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Ready to Connect?
          </h2>
          <p className="text-lg text-white/90 mb-16">
            Get in touch for bookings and inquiries
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {contactMethods.map((method, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-3xl p-10 text-center transition-all hover:bg-white/15 hover:-translate-y-2 hover:border-white/40"
              >
                <div className="w-[70px] h-[70px] bg-white rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
                  {method.icon}
                </div>
                <h4 className="text-xl font-bold text-white mb-3">
                  {method.title}
                </h4>
                <p className="text-base text-white/90 mb-2">
                  {method.info}
                </p>
                <small className="text-sm text-white/70">
                  {method.subtext}
                </small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}