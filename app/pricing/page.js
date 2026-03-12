'use client';

import Link from 'next/link';
import { 
  Check, X, Crown, Shield, Train, Tv, Smartphone, 
  Monitor, ChevronDown, Sparkles, Zap, Star
} from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import { useState } from 'react';

const TIERS = [
  {
    id: 'fireman',
    name: 'Fireman',
    tagline: 'Start watching for free',
    price: 'Free',
    period: '',
    color: '#22c55e',
    icon: Train,
    popular: false,
    features: [
      { text: '14 live cameras', included: true },
      { text: 'Standard quality streams', included: true },
      { text: 'DVR / up to 7-day rewind', included: true },
      { text: 'Train sighting logging', included: true },
      { text: 'Community chat', included: true },
      { text: 'Ad-supported viewing', included: true, note: 'Includes ads' },
      { text: 'Multi-view layouts', included: false },
      { text: 'The Roundhouse photo archive', included: false },
      { text: 'Mobile & TV apps', included: false },
      { text: 'Premium camera locations', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Start Watching Free',
    ctaStyle: 'border border-white/20 hover:bg-white/5',
  },
  {
    id: 'conductor',
    name: 'Conductor',
    tagline: 'More cameras, no ads',
    price: '$8.95',
    period: '/month',
    yearlyPrice: '$100',
    yearlyPeriod: '/year',
    yearlySavings: 'Save $7.40',
    color: '#3b82f6',
    icon: Shield,
    popular: false,
    features: [
      { text: '18 live cameras', included: true },
      { text: 'HD quality streams', included: true },
      { text: 'DVR / up to 7-day rewind', included: true },
      { text: 'Train sighting logging', included: true },
      { text: 'Community chat', included: true },
      { text: 'Ad-free viewing', included: true },
      { text: 'Multi-view (up to 4)', included: true },
      { text: 'The Roundhouse photo archive', included: true },
      { text: 'Mobile & TV apps', included: false },
      { text: 'All camera locations', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Choose Conductor',
    ctaStyle: 'bg-[#3b82f6] hover:bg-[#2563eb]',
  },
  {
    id: 'engineer',
    name: 'Engineer',
    tagline: 'The ultimate experience',
    price: '$12.95',
    period: '/month',
    yearlyPrice: '$144',
    yearlyPeriod: '/year',
    yearlySavings: 'Save $11.40',
    color: '#ff7a00',
    icon: Crown,
    popular: true,
    features: [
      { text: 'All 45+ cameras', included: true },
      { text: 'Up to 4K HDR quality', included: true },
      { text: 'DVR / up to 7-day rewind', included: true },
      { text: 'Train sighting logging', included: true },
      { text: 'Community chat', included: true },
      { text: 'Ad-free viewing', included: true },
      { text: 'Multi-view (up to 16)', included: true },
      { text: 'The Roundhouse photo archive', included: true },
      { text: 'iOS, Android, Apple TV, Roku, Fire TV', included: true },
      { text: 'All premium locations', included: true },
      { text: 'Priority support', included: true },
    ],
    cta: 'Choose Engineer',
    ctaStyle: 'bg-[#ff7a00] hover:bg-[#ff8c1a] shadow-lg shadow-[#ff7a00]/25',
  },
];

const FAQS = [
  {
    q: 'Can I try before I subscribe?',
    a: 'Absolutely! The Fireman tier is completely free. You get access to 14 live cameras with up to 7-day DVR rewind and all core player features. No credit card required.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept PayPal and all major credit cards (Visa, Mastercard, American Express, Discover) through our secure payment processor.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes! You can cancel your subscription at any time. Your access will continue until the end of your current billing period.',
  },
  {
    q: 'What\'s the difference between monthly and yearly?',
    a: 'Yearly plans save you money — roughly one month free per year. Both give you the exact same features and camera access.',
  },
  {
    q: 'Do you offer a short-term pass?',
    a: 'Yes! We offer a 72-hour RailFan Holiday pass for $5.95 — perfect for weekend railfanning or testing out the premium experience.',
  },
  {
    q: 'Which cameras are available at each tier?',
    a: 'Fireman gets 14 cameras (our most popular locations). Conductor adds 4 more exclusive cameras. Engineer gets everything — all 45+ cameras including premium and new locations as they launch.',
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState('monthly');
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <main id="main-content" className="min-h-screen bg-black text-white" role="main">
      <SiteHeader currentPage="pricing" />

      {/* Hero */}
      <section className="pt-24 pb-8 md:pt-32 md:pb-12 text-center px-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff7a00]/10 border border-[#ff7a00]/20 rounded-full mb-6">
          <Sparkles className="w-4 h-4 text-[#ff7a00]" />
          <span className="text-[#ff7a00] text-sm font-semibold">Simple, Transparent Pricing</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-4">
          Choose Your
          <span className="text-[#ff7a00]"> View.</span>
        </h1>
        <p className="text-lg text-white/50 max-w-2xl mx-auto mb-8">
          Start free, upgrade anytime. Every plan includes up to 7-day DVR, train logging, and our custom player.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-white/5 border border-white/10 rounded-full p-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              billing === 'monthly' ? 'bg-[#ff7a00] text-white shadow' : 'text-white/50 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              billing === 'yearly' ? 'bg-[#ff7a00] text-white shadow' : 'text-white/50 hover:text-white'
            }`}
          >
            Yearly
            <span className="ml-1.5 text-xs text-[#22c55e] font-bold">Save</span>
          </button>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-6" aria-label="Pricing plans">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6" role="list">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            const displayPrice = billing === 'yearly' && tier.yearlyPrice ? tier.yearlyPrice : tier.price;
            const displayPeriod = billing === 'yearly' && tier.yearlyPeriod ? tier.yearlyPeriod : tier.period;
            
            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl border ${
                  tier.popular 
                    ? 'border-[#ff7a00]/50 bg-gradient-to-b from-[#ff7a00]/10 to-transparent' 
                    : 'border-white/10 bg-white/[0.02]'
                } p-8 flex flex-col`}
                role="listitem"
                aria-label={`${tier.name} plan - ${tier.price}${tier.period}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 bg-[#ff7a00] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg shadow-[#ff7a00]/30">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${tier.color}20` }}>
                      <Icon className="w-5 h-5" style={{ color: tier.color }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                      <p className="text-white/40 text-xs">{tier.tagline}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="text-4xl font-black text-white">{displayPrice}</span>
                    {displayPeriod && <span className="text-white/40 text-sm">{displayPeriod}</span>}
                  </div>
                  {billing === 'yearly' && tier.yearlySavings && (
                    <p className="text-[#22c55e] text-sm font-medium mt-1">{tier.yearlySavings}</p>
                  )}
                </div>

                {/* Features */}
                <div className="flex-1 space-y-3 mb-8">
                  {tier.features.map((feature, fi) => (
                    <div key={fi} className="flex items-start gap-2.5">
                      {feature.included ? (
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: tier.color }} />
                      ) : (
                        <X className="w-4 h-4 mt-0.5 flex-shrink-0 text-white/15" />
                      )}
                      <span className={feature.included ? 'text-white/70 text-sm' : 'text-white/25 text-sm'}>
                        {feature.text}
                        {feature.note && <span className="text-white/30 text-xs ml-1">({feature.note})</span>}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button className={`w-full py-3.5 rounded-xl font-bold text-white transition-all ${tier.ctaStyle}`}>
                  {tier.cta}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 72-Hour Pass Callout */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-white mb-1">RailFan Holiday Pass</h3>
              <p className="text-white/50 text-sm">72 hours of full Engineer access for just <span className="text-white font-bold">$5.95</span>. Perfect for a weekend of railfanning or trying out the premium experience.</p>
            </div>
            <button className="px-6 py-3 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl transition-colors flex-shrink-0 shadow-lg shadow-purple-500/25">
              Get 72hr Pass
            </button>
          </div>
        </div>
      </section>

      {/* Platform Support */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">Watch on Any Device</h2>
          <p className="text-white/40 mb-8 text-sm">Engineer members get access on all platforms</p>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { icon: Monitor, label: 'Web Browser' },
              { icon: Smartphone, label: 'iOS & Android' },
              { icon: Tv, label: 'Apple TV' },
              { icon: Tv, label: 'Roku' },
              { icon: Tv, label: 'Fire TV' },
            ].map((platform, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <platform.icon className="w-8 h-8 text-white/30" />
                <span className="text-white/50 text-xs">{platform.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">
            Frequently Asked
            <span className="text-[#ff7a00]"> Questions</span>
          </h2>

          <div className="space-y-3" role="list" aria-label="Frequently asked questions">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-white/5 rounded-xl overflow-hidden" role="listitem">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/50 focus:ring-inset"
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span className="text-white font-medium pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-white/30 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {openFaq === i && (
                  <div id={`faq-answer-${i}`} className="px-5 pb-5" role="region" aria-label={faq.q}>
                    <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center px-6">
        <h2 className="text-3xl font-black mb-4">
          Start Watching
          <span className="text-[#ff7a00]"> Today.</span>
        </h2>
        <p className="text-white/40 mb-8">No credit card required for the free tier.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#ff7a00] hover:bg-[#ff8c1a] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#ff7a00]/25"
        >
          <Star className="w-5 h-5" />
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="text-[#ff7a00] font-bold text-xl">RailStream</Link>
          <div className="flex gap-6 text-white/30 text-sm">
            <Link href="/terms" className="hover:text-white/60 transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-white/60 transition-colors">Contact</Link>
          </div>
          <p className="text-white/30 text-sm">© 2011-2026 RailStream, LLC.</p>
        </div>
      </footer>
    </main>
  );
}
