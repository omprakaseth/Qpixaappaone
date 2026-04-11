import { ArrowLeft, Mail, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { SEO } from '@/components/SEO';

export default function ContactPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setSending(true);
    setTimeout(() => {
      toast.success('Message sent! We\'ll get back to you soon.');
      setName(''); setEmail(''); setMessage('');
      setSending(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO 
        title="Contact Us - Qpixa Support"
        description="Have questions or need help? Contact the Qpixa support team. We're here to help you with your AI prompt marketplace needs."
        canonical="/contact"
        noindex={true}
      />
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <button onClick={() => navigate('/')}><ArrowLeft size={22} /></button>
        <h1 className="text-base font-bold">Contact Us</h1>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-primary" />
            <span className="text-sm font-medium text-foreground">Email</span>
          </div>
          <p className="text-sm text-muted-foreground">support@qpixa.com</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">YOUR NAME</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">MESSAGE</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your message..." rows={5} className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none" />
          </div>
          <button type="submit" disabled={sending} className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            <Send size={16} /> {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}