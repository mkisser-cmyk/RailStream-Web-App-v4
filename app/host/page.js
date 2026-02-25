'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Camera, MapPin, Wifi, Shield, Users, DollarSign, Clock, 
  CheckCircle, ArrowRight, Train, Radio, Zap, Globe, 
  Heart, Star, ChevronRight, Mail, Phone
} from 'lucide-react';

const BENEFITS = [
  {
    icon: Globe,
    title: "Global Audience",
    description: "Share your view with thousands of railfans from around the world, 24/7."
  },
  {
    icon: Users,
    title: "Join the Community",
    description: "Become part of the RailStream family - a tight-knit community of enthusiasts."
  },
  {
    icon: Shield,
    title: "Full Support",
    description: "We handle all the technical details. You just provide the view."
  },
  {
    icon: DollarSign,
    title: "No Cost to You",
    description: "RailStream covers all equipment and bandwidth costs. Zero investment required."
  },
  {
    icon: Clock,
    title: "7-Day DVR",
    description: "Your stream is archived for 7 days, so viewers never miss the action."
  },
  {
    icon: Radio,
    title: "Scanner Integration",
    description: "We can integrate railroad radio audio to enhance the viewing experience."
  }
];

const REQUIREMENTS = [
  {
    title: "Great Location",
    description: "A view of an active rail line with regular train traffic",
    required: true
  },
  {
    title: "Internet Connection",
    description: "Reliable broadband internet (10+ Mbps upload recommended)",
    required: true
  },
  {
    title: "Power Outlet",
    description: "Access to a standard electrical outlet near camera location",
    required: true
  },
  {
    title: "Weather Protection",
    description: "Indoor mounting or covered outdoor area for camera",
    required: true
  },
  {
    title: "PTZ Capability",
    description: "Optional: Space for a pan-tilt-zoom camera for enhanced coverage",
    required: false
  },
  {
    title: "Railroad Radio",
    description: "Optional: Ability to install a scanner for audio feeds",
    required: false
  }
];

const PROCESS_STEPS = [
  {
    step: 1,
    title: "Contact Us",
    description: "Reach out with details about your location and view of the tracks."
  },
  {
    step: 2,
    title: "Site Survey",
    description: "We'll evaluate your location for camera placement and connectivity."
  },
  {
    step: 3,
    title: "Equipment Setup",
    description: "Our team ships and helps configure all necessary equipment."
  },
  {
    step: 4,
    title: "Go Live!",
    description: "Your stream goes live and joins the RailStream network."
  }
];

const TESTIMONIALS = [
  {
    quote: "Hosting a RailStream camera has connected me with fellow railfans I never would have met otherwise. It's like having friends watching trains with you 24/7.",
    author: "Camera Host",
    location: "Indiana"
  },
  {
    quote: "The RailStream team made setup incredibly easy. They handled everything technical - I just had to point to where the trains run.",
    author: "Camera Host",
    location: "Ohio"
  }
];

export default function HostPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    description: '',
    railroad: '',
    traffic: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Integrate with backend
    alert('Thank you for your interest! We will contact you soon.');
  };

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-900/20 via-black to-black" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/30 mb-6">
              <Camera className="w-4 h-4 text-orange-400" />
              <span className="text-orange-300 text-sm font-medium">Become a Host</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6">
              Share Your <span className="text-orange-400">View</span>
              <br />With The World
            </h1>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Have a great view of the tracks? Join our network of camera hosts and help 
              railfans around the world experience the excitement of railroading.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#apply"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 shadow-lg shadow-orange-500/25"
              >
                Apply to Host
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#requirements"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all border border-white/20"
              >
                View Requirements
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {[
              { number: "45+", label: "Active Cameras" },
              { number: "15", label: "Years Running" },
              { number: "10K+", label: "Daily Viewers" },
              { number: "24/7", label: "Live Coverage" }
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-xl bg-gray-900/50 border border-gray-800">
                <div className="text-3xl md:text-4xl font-black text-orange-400 mb-1">{stat.number}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-black via-gray-900/30 to-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Host a <span className="text-orange-400">Camera</span>?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Joining the RailStream network comes with benefits for you and the community.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((benefit, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl bg-gradient-to-b from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-orange-500/50 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <benefit.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                <p className="text-gray-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section id="requirements" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What You <span className="text-orange-400">Need</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Here's what we look for in a potential camera location.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REQUIREMENTS.map((req, i) => (
              <div
                key={i}
                className={`p-6 rounded-2xl border ${
                  req.required 
                    ? 'bg-gray-800/50 border-gray-700/50' 
                    : 'bg-gray-900/30 border-gray-800/50'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <CheckCircle className={`w-6 h-6 flex-shrink-0 ${
                    req.required ? 'text-orange-400' : 'text-gray-500'
                  }`} />
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {req.title}
                      {!req.required && (
                        <span className="ml-2 text-xs text-gray-500 font-normal">(Optional)</span>
                      )}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">{req.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-black via-orange-950/10 to-black">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It <span className="text-orange-400">Works</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Getting started is easier than you think.
            </p>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500 via-orange-400 to-orange-500 hidden md:block" />

            <div className="space-y-8">
              {PROCESS_STEPS.map((step, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-2xl font-black text-white z-10">
                    {step.step}
                  </div>
                  <div className="flex-1 pt-3">
                    <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-gray-400 text-lg">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              From Our <span className="text-orange-400">Hosts</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((testimonial, i) => (
              <div
                key={i}
                className="p-8 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-orange-400 fill-orange-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-lg italic mb-4">"{testimonial.quote}"</p>
                <div className="text-sm">
                  <span className="text-white font-medium">{testimonial.author}</span>
                  <span className="text-gray-500"> · {testimonial.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="py-20 px-6 bg-gradient-to-t from-orange-950/20 to-black">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Apply to <span className="text-orange-400">Host</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Tell us about your location and we'll be in touch.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Your Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Location (City, State) *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                placeholder="Fostoria, Ohio"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Which Railroad(s)?</label>
              <input
                type="text"
                value={formData.railroad}
                onChange={(e) => setFormData({ ...formData, railroad: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                placeholder="CSX, NS, BNSF, UP, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Estimated Daily Train Traffic</label>
              <select
                value={formData.traffic}
                onChange={(e) => setFormData({ ...formData, traffic: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              >
                <option value="">Select...</option>
                <option value="1-10">1-10 trains/day</option>
                <option value="10-30">10-30 trains/day</option>
                <option value="30-50">30-50 trains/day</option>
                <option value="50+">50+ trains/day</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tell Us About Your Location *</label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors resize-none"
                placeholder="Describe your view of the tracks, any notable features (crossings, signals, junctions), and your internet situation..."
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-[1.02] shadow-lg shadow-orange-500/25"
            >
              Submit Application
            </button>

            <p className="text-center text-gray-500 text-sm">
              We'll review your application and get back to you within 48 hours.
            </p>
          </form>
        </div>
      </section>

      {/* Contact Alternative */}
      <section className="py-12 px-6 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400 mb-4">Prefer to reach out directly?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:hosts@railstream.net"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors"
            >
              <Mail className="w-5 h-5 text-orange-400" />
              <span>hosts@railstream.net</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="text-orange-400 font-bold text-xl">RailStream</Link>
          <p className="text-gray-500 text-sm">© 2010-2025 RailStream. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
