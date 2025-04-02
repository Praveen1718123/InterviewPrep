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
    </div>
  );
}