import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <button onClick={() => navigate('/')}><ArrowLeft size={22} /></button>
        <h1 className="text-base font-bold">Terms of Service</h1>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <p className="text-xs text-muted-foreground">Last updated: March 2026</p>
        <section className="space-y-2">
          <h2 className="text-base font-semibold">1. Acceptance of Terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">By accessing and using Qpixa, you agree to be bound by these Terms of Service.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold">2. User Accounts</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">You are responsible for maintaining the security of your account and providing accurate information.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold">3. Acceptable Use</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">You agree not to use Qpixa to generate, upload, or share content that is illegal, harmful, or objectionable. You must not generate NSFW, hateful, or violent content.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold">4. Intellectual Property</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">AI-generated images are subject to the terms of the underlying AI model providers. Prompts you list on the marketplace remain your intellectual property, but you grant Qpixa a license to display and facilitate their sale.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold">5. Credits & Payments</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Credits are used to generate images and purchase prompts. Credits are non-refundable.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold">6. Content Moderation</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Qpixa reserves the right to remove any content that violates these terms and suspend or terminate violating accounts.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold">7. Limitation of Liability</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Qpixa is provided "as is" without warranties of any kind.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold">8. Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">For questions about these Terms, contact us at <span className="text-primary">support@qpixa.com</span>.</p>
        </section>
      </div>
    </div>
  );
}