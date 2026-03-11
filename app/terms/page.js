'use client';

import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader currentPage="terms" />

      <div className="max-w-4xl mx-auto px-6 pt-24 pb-20 md:pt-32">
        <h1 className="text-4xl md:text-5xl font-black mb-2">
          Terms of
          <span className="text-[#ff7a00]"> Service</span>
        </h1>
        <p className="text-white/40 text-sm mb-12">Last Updated: March 2025</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8">
          
          <section>
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-3 mb-4">1. Acceptance of Terms</h2>
            <p className="text-white/60 leading-relaxed">
              By accessing or using RailStream ("the Service"), operated by RailStream, LLC ("we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.
            </p>
            <p className="text-white/60 leading-relaxed mt-3">
              We reserve the right to update or modify these Terms at any time. Your continued use of the Service after changes are posted constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-3 mb-4">2. Description of Service</h2>
            <p className="text-white/60 leading-relaxed">
              RailStream provides live video streaming of railroad locations through web browsers, mobile applications, and connected TV platforms. The Service includes live camera feeds, DVR/time-shift functionality, multi-view capability, community features (chat, train logging), and related services.
            </p>
            <p className="text-white/60 leading-relaxed mt-3">
              Camera availability, video quality, and features may vary based on your subscription tier. We reserve the right to add, modify, or remove cameras and features at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-3 mb-4">3. Account Registration</h2>
            <p className="text-white/60 leading-relaxed">
              To access certain features, you must create an account. You agree to provide accurate, current, and complete information during registration and to keep your account information updated. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
            <p className="text-white/60 leading-relaxed mt-3">
              Each account is intended for use by a single individual. Sharing account credentials or simultaneous use from multiple locations may result in account suspension. You may register up to 5 devices per account. Device management is available through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-3 mb-4">4. Subscription Plans & Payment</h2>
            <p className="text-white/60 leading-relaxed">
              RailStream offers multiple subscription tiers with varying levels of access. Current plans and pricing are available on our <Link href="/pricing" className="text-[#ff7a00] hover:underline">Pricing page</Link>.
            </p>
            <ul className="list-disc list-inside text-white/60 leading-relaxed mt-3 space-y-2">
              <li><strong className="text-white/80">Free Tier (Fireman):</strong> Limited camera access with ad-supported viewing. No payment required.</li>
              <li><strong className="text-white/80">Paid Subscriptions:</strong> Monthly or annual billing. Payments are processed securely through PayPal or credit card.</li>
              <li><strong className="text-white/80">Auto-Renewal:</strong> Subscriptions with auto-renewal will automatically renew at the end of each billing period unless cancelled.</li>
              <li><strong className="text-white/80">Short-Term Passes:</strong> Some passes (e.g., 72-hour RailFan Holiday) provide temporary access and do not auto-renew.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-3 mb-4">5. Cancellation & Refunds</h2>
            <p className="text-white/60 leading-relaxed">
              You may cancel your subscription at any time through your account settings or by contacting us at <a href="mailto:support@railstream.net" className="text-[#ff7a00] hover:underline">support@railstream.net</a>. Upon cancellation, you will retain access to your subscription tier until the end of your current billing period.
            </p>
            <p className="text-white/60 leading-relaxed mt-3">
              Refunds are handled on a case-by-case basis. If you believe you are entitled to a refund, please contact our support team within 30 days of the charge.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-3 mb-4">6. Acceptable Use</h2>
            <p className="text-white/60 leading-relaxed">You agree NOT to:</p>
            <ul className="list-disc list-inside text-white/60 leading-relaxed mt-3 space-y-2">
              <li>Redistribute, restream, or publicly display RailStream content without written permission</li>
              <li>Record, download, or capture video streams for commercial purposes</li>
              <li>Use automated tools, bots, or scripts to access the Service</li>
              <li>Attempt to circumvent access restrictions, DRM, or subscription tier limitations</li>
              <li>Use the chat or community features to post harmful, abusive, or illegal content</li>
              <li>Interfere with or disrupt the Service, servers, or networks</li>
              <li>Share your account credentials with others or use multiple accounts to circumvent limits</li>
            </ul>
            <p className="text-white/60 leading-relaxed mt-3">
              Violation of these terms may result in immediate suspension or termination of your account without refund.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-3 mb-4">7. Content & Intellectual Property</h2>
            <p className="text-white/60 leading-relaxed">
              All video streams, images, logos, software, and content provided through the Service are the property of RailStream, LLC or its content partners and are protected by copyright and other intellectual property laws.
            </p>
            <p className="text-white/60 leading-relaxed mt-3">
              <strong className="text-white/80">Personal Use Snapshots:</strong> Screenshots captured through the player's built-in snapshot feature are provided with a RailStream watermark and may be shared for personal, non-commercial use with attribution to RailStream.
            </p>
            <p className="text-white/60 leading-relaxed mt-3">
              <strong className="text-white/80">Train Sighting Logs:</strong> By submitting train sighting logs through the Service, you grant RailStream a non-exclusive, royalty-free license to display and use the data publicly within the community sighting feed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-3 mb-4">8. Advertising</h2>
            <p className="text-white/60 leading-relaxed">
              Free-tier users may see advertisements including pre-roll video ads, mid-roll ads, and companion display ads during their viewing session. Paid subscribers are exempt from all advertising.
            </p>
            <p className="text-white/60 leading-relaxed mt-3">
              Ad content is provided by third-party advertisers and RailStream does not endorse or guarantee the products or services advertised.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-3 mb-4">9. Privacy & Cookies</h2>
            <p className="text-white/60 leading-relaxed">
              We collect and use personal information as described in our privacy practices. By using the Service, you consent to the collection and use of information in accordance with these practices.
            </p>
            <ul className="list-disc list-inside text-white/60 leading-relaxed mt-3 space-y-2">
              <li><strong className="text-white/80">Essential Cookies:</strong> Required for the Service to function (authentication, preferences, layouts). Always active.</li>
              <li><strong className="text-white/80">Functional Cookies:</strong> Enhance your experience (player settings, favorites). Can be managed via cookie preferences.</li>
              <li><strong className="text-white/80">Analytics:</strong> Help us understand usage patterns to improve the Service. Can be opted out via cookie preferences.</li>
            </ul>
            <p className="text-white/60 leading-relaxed mt-3">
              We do not sell your personal information to third parties. Account data is stored securely and used only to provide and improve the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-3 mb-4">10. Service Availability</h2>
            <p className="text-white/60 leading-relaxed">
              While we strive for 24/7 uptime with redundant infrastructure, the Service is provided "as is" and we cannot guarantee uninterrupted access. Cameras may go offline due to maintenance, weather, site conditions, or technical issues.
            </p>
            <p className="text-white/60 leading-relaxed mt-3">
              We will make reasonable efforts to notify users of planned maintenance. Check our <Link href="/network-status" className="text-[#ff7a00] hover:underline">Network Status</Link> page for real-time system health information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-3 mb-4">11. Limitation of Liability</h2>
            <p className="text-white/60 leading-relaxed">
              To the maximum extent permitted by law, RailStream, LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service. Our total liability for any claim arising from the Service shall not exceed the amount you paid for the Service in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-3 mb-4">12. Termination</h2>
            <p className="text-white/60 leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violation of these Terms, fraudulent activity, or any other reason at our sole discretion. You may also terminate your account at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-3 mb-4">13. Governing Law</h2>
            <p className="text-white/60 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the United States. Any disputes arising from these Terms or the Service shall be resolved through binding arbitration or in the courts of competent jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white border-b border-white/10 pb-3 mb-4">14. Contact</h2>
            <p className="text-white/60 leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="mt-3 p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-white font-medium">RailStream, LLC</p>
              <p className="text-white/50 text-sm">Email: <a href="mailto:support@railstream.net" className="text-[#ff7a00] hover:underline">support@railstream.net</a></p>
              <p className="text-white/50 text-sm">Web: <a href="https://railstream.net" className="text-[#ff7a00] hover:underline">railstream.net</a></p>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="text-[#ff7a00] font-bold text-xl">RailStream</Link>
          <div className="flex gap-6 text-white/30 text-sm">
            <Link href="/contact" className="hover:text-white/60 transition-colors">Contact</Link>
            <Link href="/pricing" className="hover:text-white/60 transition-colors">Pricing</Link>
            <Link href="/features" className="hover:text-white/60 transition-colors">Features</Link>
          </div>
          <p className="text-white/30 text-sm">© 2010-2025 RailStream, LLC.</p>
        </div>
      </footer>
    </main>
  );
}
