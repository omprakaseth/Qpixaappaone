"use client";

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SEO } from '@/components/SEO';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO 
        title="Privacy Policy - Qpixa"
        description="Read Qpixa's privacy policy to understand how we collect, use, and protect your personal information."
        canonical="/privacy"
        noindex={true}
      />
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <button onClick={() => router.push('/')}><ArrowLeft size={22} /></button>
        <h1 className="text-base font-bold">Privacy Policy</h1>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <p className="text-xs text-muted-foreground">Last updated: March 2026</p>
        <section className="space-y-2">
          <h2 className="text-base font-semibold">1. Introduction</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Welcome to Qpixa. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold">2. Information We Collect</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">We collect information you provide directly, including your email address, username, profile information, and content you create. We also collect usage data, device information, and analytics to improve our services.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold">3. Cookies & Tracking</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">We use cookies and similar technologies for authentication, preferences, and analytics. Third-party services like Google AdSense may also use cookies to serve personalized ads.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold">4. Google AdSense</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Qpixa uses Google AdSense to display advertisements. Google may use cookies to serve ads based on your prior visits. You can opt out of personalized advertising by visiting Google&apos;s Ads Settings. Pro users enjoy an ad-free experience.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold">5. Data Security</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet is 100% secure.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold">6. Your Rights</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">You can access, update, or delete your personal data at any time through your profile settings.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold">7. Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">For privacy concerns, contact us at <span className="text-primary">support@qpixa.com</span>.</p>
        </section>
      </div>
    </div>
  );
}
