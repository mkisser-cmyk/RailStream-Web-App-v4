import './globals.css';
import CookieConsent from '@/components/CookieConsent';

export const metadata = {
  title: 'RailStream - Live Train Cameras',
  description: 'Watch live train cameras from across North America. Premium railfan streaming experience.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body className="min-h-screen bg-background antialiased">
        {/* Skip to main content link for keyboard/screen reader users */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-[#ff7a00] focus:text-white focus:rounded-lg focus:font-semibold focus:text-sm">
          Skip to main content
        </a>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
