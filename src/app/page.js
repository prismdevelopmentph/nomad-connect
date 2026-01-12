import Header from './components/Header'
import Hero from './components/Hero'
import About from './components/About'
import Features from './components/Features'
import Pricing from './components/Pricing'
import Coverage from './components/Coverage'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Features />
        <Pricing />
        <Coverage />
        <Contact />
      </main>
      <Footer />
    </>
  )
}