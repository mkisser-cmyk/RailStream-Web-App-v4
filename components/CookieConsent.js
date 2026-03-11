'use client';

import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,     // Always on
    functional: true,    // Player preferences, layouts
    analytics: false,    // Usage analytics
  });

  useEffect(() => {
    const consent = localStorage.getItem('railstream_cookie_consent');
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    const allConsent = { essential: true, functional: true, analytics: true, timestamp: new Date().toISOString() };
    localStorage.setItem('railstream_cookie_consent', JSON.stringify(allConsent));
    setVisible(false);
  };

  const acceptSelected = () => {
    const consent = { ...preferences, essential: true, timestamp: new Date().toISOString() };
    localStorage.setItem('railstream_cookie_consent', JSON.stringify(consent));
    setVisible(false);
  };

  const rejectNonEssential = () => {
    const consent = { essential: true, functional: false, analytics: false, timestamp: new Date().toISOString() };
    localStorage.setItem('railstream_cookie_consent', JSON.stringify(consent));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 pointer-events-none">
      <div className="max-w-2xl mx-auto pointer-events-auto">
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Main banner */}
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#ff7a00]/10 border border-[#ff7a00]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-[#ff7a00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm mb-1">Cookie Preferences</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  We use cookies to save your player preferences, layouts, and login sessions. No tracking cookies are used without your consent.
                </p>
              </div>
            </div>

            {/* Options panel */}
            {showOptions && (
              <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                <label className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div>
                    <p className="text-white text-sm font-medium">Essential Cookies</p>
                    <p className="text-white/40 text-xs">Login sessions, security (required)</p>
                  </div>
                  <div className="w-10 h-6 rounded-full bg-[#ff7a00] flex items-center justify-end px-0.5 cursor-not-allowed">
                    <div className="w-5 h-5 rounded-full bg-white" />
                  </div>
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 cursor-pointer hover:bg-white/[0.07] transition" onClick={() => setPreferences(p => ({ ...p, functional: !p.functional }))}>
                  <div>
                    <p className="text-white text-sm font-medium">Functional Cookies</p>
                    <p className="text-white/40 text-xs">Player settings, saved layouts, favorites</p>
                  </div>
                  <div className={`w-10 h-6 rounded-full flex items-center px-0.5 transition ${preferences.functional ? 'bg-[#ff7a00] justify-end' : 'bg-zinc-700 justify-start'}`}>
                    <div className="w-5 h-5 rounded-full bg-white transition" />
                  </div>
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 cursor-pointer hover:bg-white/[0.07] transition" onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}>
                  <div>
                    <p className="text-white text-sm font-medium">Analytics Cookies</p>
                    <p className="text-white/40 text-xs">Help us improve RailStream (anonymous)</p>
                  </div>
                  <div className={`w-10 h-6 rounded-full flex items-center px-0.5 transition ${preferences.analytics ? 'bg-[#ff7a00] justify-end' : 'bg-zinc-700 justify-start'}`}>
                    <div className="w-5 h-5 rounded-full bg-white transition" />
                  </div>
                </label>
              </div>
            )}

            {/* Buttons */}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={acceptAll}
                className="flex-1 px-4 py-2.5 bg-[#ff7a00] hover:bg-[#ff8c20] text-white font-semibold text-sm rounded-xl transition"
              >
                Accept All
              </button>
              {!showOptions ? (
                <button
                  onClick={() => setShowOptions(true)}
                  className="px-4 py-2.5 border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-sm font-medium rounded-xl transition"
                >
                  Customize
                </button>
              ) : (
                <button
                  onClick={acceptSelected}
                  className="px-4 py-2.5 border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-sm font-medium rounded-xl transition"
                >
                  Save Preferences
                </button>
              )}
              <button
                onClick={rejectNonEssential}
                className="px-4 py-2.5 text-white/40 hover:text-white/70 text-sm font-medium rounded-xl transition"
              >
                Reject All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
