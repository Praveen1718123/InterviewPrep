import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header/Navigation */}
      <header className="container mx-auto py-4 px-4 md:px-6 flex justify-between items-center">
        <div className="flex items-center">
          <img 
            src="/assets/switchbee-logo.svg" 
            alt="Switchbee Solutions LLP Logo" 
            className="h-16" 
          />
        </div>
        <nav className="hidden md:flex space-x-8">
          <a href="#" className="text-gray-700 hover:text-gray-900">Home</a>
          <a href="#" className="text-gray-700 hover:text-gray-900">Features</a>
          <a href="#" className="text-gray-700 hover:text-gray-900">About</a>
          <a href="#" className="text-gray-700 hover:text-gray-900">Contact</a>
        </nav>
        <Button asChild variant="default" className="bg-[#0E2D4A] hover:bg-[#0c2339]">
          <Link href="/auth">Login</Link>
        </Button>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 md:px-6 py-12 md:py-24 flex flex-col md:flex-row md:items-center">
        <div className="md:w-1/2 mb-8 md:mb-0 pr-0 md:pr-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0E2D4A] leading-tight mb-6">
            Your Trusted Partner<br />
            in Manpower Supply,<br />
            Vendorship, and<br />
            Payrolls
          </h1>
          <p className="text-gray-600 mb-6">
            Discover a world of seamless human resource solutions with Switchbee 
            Solution LLP. We are your dedicated partner, committed to providing 
            top-notch services in Manpower Supply, Vendorship, and Payrolls.
          </p>
          <p className="text-amber-500 font-medium italic mb-8">
            "Unlock the full potential of your workforce with SwitchBee Solution 
            LLP—where manpower meets excellence."
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild className="bg-[#0E2D4A] hover:bg-[#0c2339] px-6">
              <Link href="/auth">
                Get started <span className="ml-2">→</span>
              </Link>
            </Button>
            <Button variant="outline" className="border-[#0E2D4A] text-[#0E2D4A]">
              Learn more <span className="ml-2">→</span>
            </Button>
          </div>
        </div>
        <div className="md:w-1/2 relative">
          <div className="rounded-xl overflow-hidden shadow-xl">
            <img 
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
              alt="Business professionals handshake" 
              className="w-full h-auto object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E2D4A]/60 to-transparent flex flex-col justify-end p-6 text-white">
              <p className="text-xl font-medium mb-2">"Empowering growth, one solution at a time."</p>
              <p className="text-sm">Where your success is our mission</p>
            </div>
          </div>
        </div>
      </section>

      {/* Goals Section */}
      <section className="container mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <h3 className="text-amber-500 font-medium mb-4">Our Goals</h3>
          <h2 className="text-3xl md:text-4xl font-bold text-[#0E2D4A] mb-4">
            Empowering Your Business Success
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover how our comprehensive solutions drive excellence in workforce
            management and business operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Human Capital */}
          <div className="flex items-start space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-[#0E2D4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#0E2D4A] mb-2">Optimizing Human Capital</h3>
              <p className="text-gray-600">Empower businesses with skilled, motivated workforce management solutions.</p>
            </div>
            <div className="hidden md:block ml-auto">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-[#0E2D4A] rounded-full" style={{ clipPath: 'inset(0 5% 0 0)' }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold">95%</span>
                  </div>
                </div>
                <div className="text-sm text-center mt-6">Client Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Payroll Precision */}
          <div className="flex items-start space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-[#0E2D4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#0E2D4A] mb-2">Ensuring Payroll Precision</h3>
              <p className="text-gray-600">Deliver precise and efficient payroll services with modern solutions.</p>
            </div>
            <div className="hidden md:block ml-auto">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-[#0E2D4A] rounded-full" style={{ clipPath: 'inset(0 0.1% 0 0)' }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold">99.9%</span>
                  </div>
                </div>
                <div className="text-sm text-center mt-6">Accuracy Rate</div>
              </div>
            </div>
          </div>

          {/* Ethical Practices */}
          <div className="flex items-start space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-[#0E2D4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#0E2D4A] mb-2">Ethical Business Practices</h3>
              <p className="text-gray-600">Maintain highest standards of ethics and integrity in all operations.</p>
            </div>
            <div className="hidden md:block ml-auto">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-[#0E2D4A] rounded-full">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold">100%</span>
                  </div>
                </div>
                <div className="text-sm text-center mt-6">Compliance</div>
              </div>
            </div>
          </div>

          {/* Infrastructure */}
          <div className="flex items-start space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-[#0E2D4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#0E2D4A] mb-2">Holistic Infrastructure</h3>
              <p className="text-gray-600">Provide integrated management solutions for seamless operations.</p>
            </div>
            <div className="hidden md:block">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">24/7</span>
                </div>
                <div className="text-sm text-center mt-28">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}