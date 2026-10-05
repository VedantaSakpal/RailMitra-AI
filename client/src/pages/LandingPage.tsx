import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Train, Menu, X, ArrowRight, MapPin, Search, 
  Bot, Ticket, Info, Wallet, Navigation, Sparkles, User, GitMerge
} from 'lucide-react';

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200">
      
      {/* 1. Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-blue-600 rounded-xl">
                <Train className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-slate-900">RailMitra <span className="text-blue-600">AI</span></span>
            </div>

            {/* Desktop Center Links */}
            <div className="hidden md:flex space-x-8">
              <a href="#" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Home</a>
              <a href="#features" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Features</a>
              <a href="#routes" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Routes</a>
              <a href="#about" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">About</a>
            </div>

            {/* Desktop Right Links */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Login</Link>
              <Link to="/register" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg">
                Sign Up
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-600 hover:text-slate-900 p-2"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2 shadow-lg">
            <a href="#" className="block px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-md font-medium">Home</a>
            <a href="#features" className="block px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-md font-medium">Features</a>
            <a href="#routes" className="block px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-md font-medium">Routes</a>
            <a href="#about" className="block px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-md font-medium">About</a>
            <div className="pt-4 flex flex-col gap-3">
              <Link to="/login" className="w-full text-center px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50">Login</Link>
              <Link to="/register" className="w-full text-center px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">Sign Up</Link>
            </div>
          </div>
        )}
      </nav>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden bg-white py-16 lg:py-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight">
                Your Smarter Way to Travel <span className="text-blue-600">Mumbai Local</span>
              </h1>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Plan your journey, explore routes, calculate fares and travel smarter with RailMitra AI.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link to="/register" className="inline-flex justify-center items-center px-8 py-4 bg-blue-600 text-white rounded-2xl font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5">
                  Get Started <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link to="/search" className="inline-flex justify-center items-center px-8 py-4 bg-white text-slate-700 border-2 border-slate-200 rounded-2xl font-semibold text-lg hover:border-slate-300 hover:bg-slate-50 transition-all">
                  Explore Routes
                </Link>
              </div>

              {/* 3. Journey Preview Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 relative z-10 overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Plan Your Journey</h3>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input type="text" readOnly value="CSMT" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none cursor-default" />
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center justify-center h-12 w-12 text-slate-300">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input type="text" readOnly value="Dombivli" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none cursor-default" />
                    </div>
                  </div>
                  <Link to="/search" className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors flex items-center justify-center">
                    Find Route
                  </Link>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl group">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10"></div>
              <img 
                src="/hero.jpg" 
                alt="Mumbai local train with AI tracking" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute bottom-6 left-6 right-6 z-20">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4">
                  <div className="p-3 bg-blue-500 rounded-xl">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">AI-Powered Navigation</p>
                    <p className="text-white/80 text-sm">Real-time optimization for your route.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything You Need for Your Journey</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Smart Route Planning", desc: "Find routes between Mumbai local stations.", icon: <Search className="w-6 h-6"/>, color: "bg-blue-100 text-blue-600" },
              { title: "Fare Calculator", desc: "Understand your journey fare easily.", icon: <Wallet className="w-6 h-6"/>, color: "bg-emerald-100 text-emerald-600" },
              { title: "Digital Tickets", desc: "Access and manage your travel tickets.", icon: <Ticket className="w-6 h-6"/>, color: "bg-purple-100 text-purple-600" },
              { title: "AI Assistant", desc: "Get instant railway assistance.", icon: <Bot className="w-6 h-6"/>, color: "bg-orange-100 text-orange-600" },
              { title: "Railway Network", desc: "Explore Mumbai's major railway lines.", icon: <GitMerge className="w-6 h-6"/>, color: "bg-pink-100 text-pink-600" },
              { title: "Station Information", desc: "Discover useful station information.", icon: <Info className="w-6 h-6"/>, color: "bg-cyan-100 text-cyan-600" }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Railway Lines Section */}
      <section id="routes" className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Explore Mumbai's Railway Network</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Central Line", desc: "CSMT to Kalyan & beyond", color: "bg-red-500", light: "bg-red-50 text-red-600" },
              { name: "Western Line", desc: "Churchgate to Dahanu Road", color: "bg-blue-500", light: "bg-blue-50 text-blue-600" },
              { name: "Harbour Line", desc: "CSMT to Panvel / Goregaon", color: "bg-green-500", light: "bg-green-50 text-green-600" },
              { name: "Trans-Harbour", desc: "Thane to Vashi / Panvel", color: "bg-orange-500", light: "bg-orange-50 text-orange-600" }
            ].map((line, i) => (
              <div key={i} className="group relative bg-slate-50 border border-slate-200 rounded-3xl p-6 hover:bg-white hover:shadow-xl hover:border-slate-300 transition-all duration-300 overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1.5 ${line.color}`}></div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${line.light}`}>
                  <Train className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{line.name}</h3>
                <p className="text-slate-600 mb-6">{line.desc}</p>
                <Link to="/search" className="inline-flex w-full justify-center items-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-colors">
                  Explore Route
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. AI Assistant Preview */}
      <section className="py-24 bg-slate-900 overflow-hidden relative">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-semibold tracking-wide mb-6">
                <Sparkles className="w-4 h-4" /> AI Powered
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                Your Railway Journey, <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Powered by AI</span>
              </h2>
              <p className="text-lg text-slate-300 mb-10 leading-relaxed">
                Ask questions, discover routes, understand fares and get helpful railway information with RailMitra AI. 
              </p>
              <Link to="/ai" className="inline-flex items-center px-8 py-4 bg-white text-slate-900 rounded-2xl font-semibold text-lg hover:bg-slate-100 transition-colors shadow-lg">
                Try RailMitra AI <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-slate-700 pb-4 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-2 text-sm font-medium text-slate-400">RailMitra Assistant</span>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-slate-300" />
                  </div>
                  <div className="bg-slate-700 text-white p-4 rounded-2xl rounded-tl-sm text-sm md:text-base leading-relaxed">
                    How do I travel from CSMT to Dombivli?
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-blue-600/20 border border-blue-500/30 text-white p-4 rounded-2xl rounded-tl-sm text-sm md:text-base leading-relaxed">
                    RailMitra AI can help you find the route, distance and fare for your journey.
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-700 flex gap-3">
                <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-400 text-sm">
                  Type a message...
                </div>
                <div className="w-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-white transform rotate-90" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. How It Works */}
      <section className="py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-slate-200 z-0"></div>
            
            {[
              { step: "01", title: "Choose Your Journey", desc: "Select your source and destination." },
              { step: "02", title: "Get Smart Information", desc: "Check route, distance and fare." },
              { step: "03", title: "Travel Smarter", desc: "Manage your journey and tickets." }
            ].map((item, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-white border-4 border-blue-50 rounded-full flex items-center justify-center text-2xl font-black text-blue-600 shadow-xl mb-6">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed max-w-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Final CTA */}
      <section className="py-24 bg-blue-600 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Make Every Mumbai Local Journey Smarter</h2>
          <p className="text-xl text-blue-100 mb-10">Plan. Explore. Travel with RailMitra AI.</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-colors shadow-xl">
              Create Account
            </Link>
            <Link to="/login" className="px-8 py-4 bg-blue-700 text-white rounded-2xl font-bold text-lg hover:bg-blue-800 border border-blue-500 transition-colors">
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer id="about" className="bg-slate-900 pt-16 pb-8 border-t border-slate-800 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Train className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">RailMitra <span className="text-blue-500">AI</span></span>
              </div>
              <p className="text-slate-400 max-w-sm leading-relaxed">
                Smart travel assistance for Mumbai Local Railway passengers.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-8 md:justify-items-end">
              <div>
                <h4 className="text-white font-semibold mb-4">Platform</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="hover:text-blue-400 transition-colors">Home</a></li>
                  <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
                  <li><a href="#routes" className="hover:text-blue-400 transition-colors">Routes</a></li>
                  <li><a href="#about" className="hover:text-blue-400 transition-colors">About</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Account</h4>
                <ul className="space-y-3">
                  <li><Link to="/login" className="hover:text-blue-400 transition-colors">Login</Link></li>
                  <li><Link to="/register" className="hover:text-blue-400 transition-colors">Sign Up</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© {new Date().getFullYear()} RailMitra AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
