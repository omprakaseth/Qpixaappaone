import { ArrowLeft, Sparkles, Store, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Image } from 'lucide-react';

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <button onClick={() => navigate('/')}><ArrowLeft size={22} /></button>
        <h1 className="text-base font-bold">About Qpixa</h1>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-primary">Q</span>
          </div>
          <h2 className="text-xl font-bold">Qpixa</h2>
          <p className="text-sm text-muted-foreground mt-1">AI-Powered Creative Platform</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Qpixa is an AI prompt marketplace where users can explore, create, and share prompts for AI image, video, and creative generation.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Sparkles size={24} className="text-primary mx-auto mb-2" />
            <h3 className="text-sm font-semibold">AI Generation</h3>
            <p className="text-[11px] text-muted-foreground mt-1">Create stunning images with AI</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Store size={24} className="text-primary mx-auto mb-2" />
            <h3 className="text-sm font-semibold">Marketplace</h3>
            <p className="text-[11px] text-muted-foreground mt-1">Buy & sell creative prompts</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Image size={24} className="text-primary mx-auto mb-2" />
            <h3 className="text-sm font-semibold">Gallery</h3>
            <p className="text-[11px] text-muted-foreground mt-1">Discover amazing AI art</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Users size={24} className="text-primary mx-auto mb-2" />
            <h3 className="text-sm font-semibold">Community</h3>
            <p className="text-[11px] text-muted-foreground mt-1">Connect with creators</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-bold mb-2">Developer</h3>
          <p className="text-xs text-muted-foreground">Om Prakash Seth</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Full-stack developer passionate about AI and creative tools.</p>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">© 2026 Qpixa. All rights reserved.</p>
      </div>
    </div>
  );
}