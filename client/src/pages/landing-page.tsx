import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
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
          <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">Services</a>
          <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">Process</a>
          <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">About Us</a>
          <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">Contact</a>
        </nav>
        <Button asChild variant="default" className="bg-[#0E2D4A] hover:bg-[#0c2339]">
          <Link href="/auth">Login</Link>
        </Button>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[#0E2D4A] leading-tight mb-6">
              Transforming Businesses Through{" "}
              <span className="text-[#4D95BC]">Innovative HR Solutions</span>
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Your trusted partner in manpower solutions, recruitment, and HR management.
              We help businesses grow with the right talent and efficient processes.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild className="bg-[#0E2D4A] hover:bg-[#0c2339] px-8 py-6 text-lg">
                <Link href="/auth">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <span className="text-[#4D95BC] font-medium">Our Services</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0E2D4A] mt-2">
              Comprehensive Solutions for Your Business
            </h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Discover our range of professional services designed to enhance your business 
              operations and streamline your workforce management.
            </p>
          </div>

          <div className="flex items-center">
            <button className="p-2 bg-gray-100 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex-1 mx-4">
              <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl shadow-sm overflow-hidden">
                <div className="grid md:grid-cols-2 gap-8 p-8">
                  <div className="relative">
                    <span className="absolute top-4 left-4 bg-amber-400 text-white p-2 rounded-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </span>
                    <img 
                      src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" 
                      alt="Manpower Supply" 
                      className="w-full h-72 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="text-2xl font-bold text-[#0E2D4A] mb-4">Manpower Supply</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">About This Service</h4>
                        <p className="text-gray-600 text-sm">
                          Our comprehensive manpower supply service connects businesses with top-tier talent across diverse industries. We handle everything from initial recruitment to onboarding, ensuring a perfect match between skilled professionals and your organizational needs.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Key Benefits</h4>
                        <ul className="space-y-2">
                          <li className="flex items-center text-sm text-gray-600">
                            <span className="mr-2 text-amber-400">•</span>
                            Access to pre-screened, qualified professionals
                          </li>
                          <li className="flex items-center text-sm text-gray-600">
                            <span className="mr-2 text-amber-400">•</span>
                            Reduced recruitment time and costs
                          </li>
                          <li className="flex items-center text-sm text-gray-600">
                            <span className="mr-2 text-amber-400">•</span>
                            Flexible staffing solutions
                          </li>
                          <li className="flex items-center text-sm text-gray-600">
                            <span className="mr-2 text-amber-400">•</span>
                            Industry-specific expertise
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button className="p-2 bg-gray-100 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <div className="w-8 h-2 bg-amber-400 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Human Capital */}
            <div className="bg-gray-50 p-8 rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-[#0E2D4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#0E2D4A] mb-2">Optimizing Human Capital</h3>
                  <p className="text-gray-600">Empower businesses with skilled, motivated workforce management solutions.</p>
                </div>
                <div className="ml-auto">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">95%</span>
                    </div>
                    <div className="text-sm text-center mt-28">Client Satisfaction</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payroll Management */}
            <div className="bg-gray-50 p-8 rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-[#0E2D4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#0E2D4A] mb-2">Ensuring Payroll Precision</h3>
                  <p className="text-gray-600">Deliver precise and efficient payroll services with modern solutions.</p>
                </div>
                <div className="ml-auto">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">99.9%</span>
                    </div>
                    <div className="text-sm text-center mt-28">Accuracy Rate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ethical Practices */}
            <div className="bg-gray-50 p-8 rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-[#0E2D4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#0E2D4A] mb-2">Ethical Business Practices</h3>
                  <p className="text-gray-600">Maintain highest standards of ethics and integrity in all operations.</p>
                </div>
                <div className="ml-auto">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">100%</span>
                    </div>
                    <div className="text-sm text-center mt-28">Compliance</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Infrastructure */}
            <div className="bg-gray-50 p-8 rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-[#0E2D4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#0E2D4A] mb-2">Holistic Infrastructure</h3>
                  <p className="text-gray-600">Provide integrated management solutions for seamless operations.</p>
                </div>
                <div className="ml-auto">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">24/7</span>
                    </div>
                    <div className="text-sm text-center mt-28">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}