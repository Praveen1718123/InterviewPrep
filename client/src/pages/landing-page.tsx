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

          <div className="space-y-8">
            {/* Manpower Supply Service */}
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
                    <Button className="mt-4">Learn More</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <button className="p-2 bg-gray-100 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

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

      {/* Founders Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <span className="text-[#4D95BC] font-medium">Our Leadership</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0E2D4A] mt-2">
              Meet Our Founders
            </h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Experienced leaders committed to transforming workforce management and business operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* First Founder */}
            <div className="flex flex-col items-center text-center">
              <div className="w-48 h-48 mb-6">
                <img 
                  src="/assets/founder1.jpg" 
                  alt="Mr. Arunraj Selavarajan" 
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-bold text-[#0E2D4A] mb-1">Mr. Arunraj Selavarajan</h3>
              <p className="text-[#4D95BC] text-sm mb-4">CEO & Co-Founder</p>
              <p className="text-gray-600 text-sm mb-4">
                Visionary leader with extensive experience in business strategy and workforce management. 
                Driving SwitchBee Solutions towards excellence in manpower and business solutions.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-600 hover:text-[#4D95BC]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-[#4D95BC]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Second Founder */}
            <div className="flex flex-col items-center text-center">
              <div className="w-48 h-48 mb-6">
                <img 
                  src="/assets/founder2.jpg" 
                  alt="Mr. Gokulakrishnan" 
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-bold text-[#0E2D4A] mb-1">Mr. Gokulakrishnan</h3>
              <p className="text-[#4D95BC] text-sm mb-4">COO & Co-Founder</p>
              <p className="text-gray-600 text-sm mb-4">
                Operations expert focused on delivering exceptional service quality and business 
                process optimization. Leading operational excellence at SwitchBee Solutions.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-600 hover:text-[#4D95BC]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-[#4D95BC]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <span className="text-[#4D95BC] font-medium">Contact Us</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0E2D4A] mt-2">
              Get in Touch
            </h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Have questions? We're here to help. Reach out to us through any of the channels below.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Contact Form */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4D95BC] focus:ring-[#4D95BC] p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4D95BC] focus:ring-[#4D95BC] p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <input
                    type="text"
                    placeholder="How can we help?"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4D95BC] focus:ring-[#4D95BC] p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    rows={4}
                    placeholder="Your message here..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4D95BC] focus:ring-[#4D95BC] p-2"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#0E2D4A] text-white py-2 px-4 rounded-md hover:bg-[#0c2339] transition duration-200"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-[#0E2D4A] mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      <svg className="w-5 h-5 text-[#4D95BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-[#0E2D4A]">Office Address</h4>
                      <p className="text-gray-600">
                        Near Happiest Mind Company,<br />
                        Near Happiest mind, No:118,<br />
                        Dr.Marigowda road, Madiwala,<br />
                        Bengaluru, Karnataka 560068
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      <svg className="w-5 h-5 text-[#4D95BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-[#0E2D4A]">Email</h4>
                      <p className="text-gray-600">info@switchbeesolution.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      <svg className="w-5 h-5 text-[#4D95BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-[#0E2D4A]">Business Hours</h4>
                      <p className="text-gray-600">
                        Monday - Friday: 9:00 AM - 6:00 PM<br />
                        Saturday: 9:00 AM - 1:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#0E2D4A] mb-4">Connect With Us</h3>
                <p className="text-gray-600 mb-4">
                  Follow us on social media to stay updated with our latest news and announcements.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-600 hover:text-[#4D95BC]">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-600 hover:text-[#4D95BC]">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-4.466 19.59c-.405.078-.534-.171-.534-.384v-2.195c0-.747-.262-1.233-.55-1.481 1.782-.198 3.654-.875 3.654-3.947 0-.874-.312-1.588-.823-2.147.082-.202.356-1.016-.079-2.117 0 0-.671-.215-2.198.82-.64-.18-1.324-.267-2.004-.271-.68.003-1.364.091-2.003.269-1.528-1.035-2.2-.82-2.2-.82-.434 1.102-.16 1.915-.077 2.118-.512.56-.824 1.273-.824 2.147 0 3.064 1.867 3.751 3.645 3.954-.229.2-.436.552-.508 1.07-.457.204-1.614.557-2.328-.666 0 0-.423-.768-1.227-.825 0 0-.78-.01-.055.487 0 0 .525.246.889 1.17 0 0 .463 1.428 2.688.944v1.489c0 .211-.129.459-.528.385-3.18-1.057-5.472-4.056-5.472-7.59 0-4.419 3.582-8 8-8s8 3.581 8 8c0 3.533-2.289 6.531-5.466 7.59z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-600 hover:text-[#4D95BC]">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0E2D4A] text-white py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Logo and Description */}
            <div>
              <img 
                src="/assets/switchbee-logo.svg" 
                alt="Switchbee Solutions LLP" 
                className="h-8 mb-4"
              />
              <p className="text-gray-300 max-w-md">
                Your trusted partner in manpower supply, vendorship, and payroll solutions. Empowering businesses with comprehensive HR solutions and exceptional service quality.
              </p>
              <div className="flex space-x-6 mt-6">
                <a href="/" className="text-gray-300 hover:text-white">Home</a>
                <a href="#features" className="text-gray-300 hover:text-white">Features</a>
                <a href="#about" className="text-gray-300 hover:text-white">About</a>
                <a href="#contact" className="text-gray-300 hover:text-white">Contact</a>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-[#F8B932] font-medium mb-4">Contact Info</h3>
              <div className="space-y-3">
                <p className="text-gray-300">Email: info@switchbeesolution.com</p>
                <p className="text-gray-300">Phone: +91 XXXXX XXXXX</p>
                <p className="text-gray-300">Hours: Mon-Fri 9:00 AM - 6:00 PM</p>
                <p className="text-gray-300">Saturday: 9:00 AM - 1:00 PM</p>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-700 pt-8">
            <p className="text-gray-400 text-sm">
              © 2025 Switchbee Solutions LLP. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}