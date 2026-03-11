'use client';

import Link from 'next/link';
import { Mail, MapPin, Facebook, Globe, MessageSquare, Clock, Shield } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader currentPage="contact" />

      {/* Hero */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-16 text-center px-6">
        <h1 className="text-4xl md:text-5xl font-black mb-4">
          Get in
          <span className="text-[#ff7a00]"> Touch.</span>
        </h1>
        <p className="text-lg text-white/50 max-w-xl mx-auto">
          Have a question, want to partner with us, or just want to say hi? We'd love to hear from you.
        </p>
      </section>

      {/* Contact Cards */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Email */}
          <a 
            href="mailto:support@railstream.net" 
            className="group rounded-2xl border border-white/10 bg-white/[0.02] hover:border-[#ff7a00]/30 hover:bg-[#ff7a00]/5 p-8 text-center transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-[#ff7a00]/10 border border-[#ff7a00]/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-[#ff7a00]" />
            </div>
            <h3 className="text-white font-bold mb-1">Email Us</h3>
            <p className="text-[#ff7a00] text-sm font-medium">support@railstream.net</p>
            <p className="text-white/30 text-xs mt-2">We typically respond within 24 hours</p>
          </a>

          {/* Facebook */}
          <a 
            href="https://www.facebook.com/RailstreamLLC" 
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-white/10 bg-white/[0.02] hover:border-[#1877F2]/30 hover:bg-[#1877F2]/5 p-8 text-center transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/20 flex items-center justify-center mx-auto mb-4">
              <Facebook className="w-7 h-7 text-[#1877F2]" />
            </div>
            <h3 className="text-white font-bold mb-1">Facebook</h3>
            <p className="text-[#1877F2] text-sm font-medium">@RailstreamLLC</p>
            <p className="text-white/30 text-xs mt-2">Follow for updates & community</p>
          </a>

          {/* Website */}
          <a 
            href="https://railstream.net" 
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-white/10 bg-white/[0.02] hover:border-green-500/30 hover:bg-green-500/5 p-8 text-center transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Globe className="w-7 h-7 text-green-400" />
            </div>
            <h3 className="text-white font-bold mb-1">Website</h3>
            <p className="text-green-400 text-sm font-medium">railstream.net</p>
            <p className="text-white/30 text-xs mt-2">Main website & member portal</p>
          </a>
        </div>
      </section>

      {/* Info Cards */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Common Questions */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-6 h-6 text-[#ff7a00]" />
              <h3 className="text-xl font-bold">Common Topics</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Account & Billing', desc: 'Subscription questions, payment issues, plan changes' },
                { label: 'Technical Support', desc: 'Stream quality, player issues, device compatibility' },
                { label: 'Camera Requests', desc: 'Suggest a new camera location or report an issue' },
                { label: 'Host a Camera', desc: 'Partner with us to host a camera at your location' },
                { label: 'Business & Media', desc: 'Press inquiries, partnerships, licensing' },
              ].map((item, i) => (
                <div key={i} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <p className="text-white font-medium text-sm">{item.label}</p>
                  <p className="text-white/40 text-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What to Expect */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-[#ff7a00]" />
              <h3 className="text-xl font-bold">What to Expect</h3>
            </div>
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  <p className="text-white font-medium text-sm">Response Time</p>
                </div>
                <p className="text-white/40 text-xs ml-4">We aim to respond to all inquiries within 24 hours during business days.</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full" />
                  <p className="text-white font-medium text-sm">Best Way to Reach Us</p>
                </div>
                <p className="text-white/40 text-xs ml-4">Email is the fastest way to get support. Include your username and a description of the issue.</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 bg-purple-400 rounded-full" />
                  <p className="text-white font-medium text-sm">Community</p>
                </div>
                <p className="text-white/40 text-xs ml-4">Join our Facebook community for tips, updates, and to connect with fellow railfans.</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 bg-[#ff7a00] rounded-full" />
                  <p className="text-white font-medium text-sm">Network Status</p>
                </div>
                <p className="text-white/40 text-xs ml-4">Check our <Link href="/network-status" className="text-[#ff7a00] hover:underline">Network Status</Link> page for real-time system health before contacting support.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Info */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-[#ff7a00]" />
            <span className="text-white/30 text-sm font-medium uppercase tracking-wider">RailStream, LLC</span>
          </div>
          <p className="text-white/40 text-sm max-w-xl mx-auto">
            Celebrating 15 years of live train streaming since 2010. Built by railfans, for railfans.
          </p>
          <div className="flex justify-center gap-6 mt-6 text-white/30 text-sm">
            <Link href="/terms" className="hover:text-white/60 transition-colors">Terms of Service</Link>
            <Link href="/pricing" className="hover:text-white/60 transition-colors">Pricing</Link>
            <Link href="/features" className="hover:text-white/60 transition-colors">Features</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="text-[#ff7a00] font-bold text-xl">RailStream</Link>
          <p className="text-white/30 text-sm">© 2010-2025 RailStream, LLC. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
