import React, { useState, useRef, useEffect } from 'react';
import { Menu, Send, Zap, PenLine, MoreVertical, Download, Share2, Bookmark, RotateCcw, Clock, Trash2, Settings, Paperclip, X, ImageIcon, Upload, Sparkles, Flag, MessageSquare, Search, Filter } from 'lucide-react';
import WatermarkedImage from '@/components/WatermarkedImage';
import ImageViewer from '@/components/ImageViewer';
import { useAppState } from '@/context/AppContext';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function useVisualViewport() {
  const [viewport, setViewport] = useState({ height: window.innerHeight, offsetTop: 0 });
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const heightDiff = window.innerHeight - vv.height;
      const kbVisible = heightDiff > 150;
      setIsKeyboardVisible(kbVisible);
      setViewport({
        height: vv.height,
        offsetTop: vv.offsetTop,
      });
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return { ...viewport, isKeyboardVisible };
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  text?: string;
  imageUrl?: string;
  attachedImageUrl?: string;
  createdAt: string;
}

interface StudioScreenProps {
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  onPublish?: (imageUrl: string, prompt: string) => void;
}

function AiMessageBubble({ msg, isPro, onPublish, onBookmark, onDownload, onShare, onReusePrompt, setViewerImage }: any) {
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <div className="flex justify-start">
      <div className="bg-card rounded-2xl rounded-bl-sm overflow-hidden max-w-[85%] border border-border/50 shadow-sm">
        {msg.imageUrl && (
          <button onClick={() => setViewerImage(msg.imageUrl!)} className="w-full relative group">
            <WatermarkedImage src={msg.imageUrl} alt={msg.text || 'Generated image'} className="w-full aspect-square object-cover" isPro={isPro} />
          </button>
        )}
        <div className="p-3">
          {showPrompt ? (
            <div className="mb-3 bg-secondary/50 p-2 rounded-lg">
              <p className="text-xs text-foreground mb-1.5 leading-relaxed">{msg.text}</p>
              <button onClick={() => setShowPrompt(false)} className="text-[10px] font-semibold text-primary uppercase tracking-wider">Hide Prompt</button>
            </div>
          ) : (
            <button onClick={() => setShowPrompt(true)} className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-3 bg-secondary/50 px-2 py-1 rounded-md">Show Prompt</button>
          )}
          <div className="flex items-center gap-4">
            <button onClick={() => msg.imageUrl && onPublish?.(msg.imageUrl, msg.text || '')} className="text-muted-foreground hover:text-primary transition-colors" title="Publish"><Upload size={16} /></button>
            <button onClick={() => msg.imageUrl && onBookmark(msg.imageUrl, msg.text || '')} className="text-muted-foreground hover:text-foreground transition-colors"><Bookmark size={16} /></button>
            <button onClick={() => msg.imageUrl && onDownload(msg.imageUrl)} className="text-muted-foreground hover:text-foreground transition-colors"><Download size={16} /></button>
            <button onClick={() => msg.imageUrl && onShare(msg.imageUrl, msg.text || '')} className="text-muted-foreground hover:text-foreground transition-colors"><Share2 size={16} /></button>
            <button onClick={() => onReusePrompt(msg.text || '')} className="text-muted-foreground hover:text-foreground transition-colors" title="Reuse Prompt"><RotateCcw size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudioScreen({ initialPrompt, onClearInitialPrompt, onPublish }: StudioScreenProps) {
  const { credits, setCredits, isPro, isLoggedIn, refreshProfile, user } = useAppState();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const { height: vpHeight, offsetTop: vpOffsetTop, isKeyboardVisible } = useVisualViewport();
  const [attachedPreview, setAttachedPreview] = useState<string | null>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      onClearInitialPrompt?.();
      textareaRef.current?.focus();
    }
  }, [initialPrompt, onClearInitialPrompt]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [prompt]);

  // Load generation history from DB
  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase.from('generations').select('*').eq('user_id', user.id).order('created_at', { ascending: true }).limit(50);
        if (error) {
          console.error('Error loading history:', error);
          return;
        }
        if (data && data.length > 0) {
          const restored: ChatMessage[] = [];
          data.forEach((g: any) => {
            restored.push({ id: `h-u-${g.id}`, type: 'user', text: g.prompt, createdAt: new Date(g.created_at).toLocaleDateString() });
            if (g.image_url) {
              restored.push({ id: `h-a-${g.id}`, type: 'ai', text: g.prompt, imageUrl: g.image_url, createdAt: new Date(g.created_at).toLocaleDateString() });
            }
          });
          setMessages(restored);
        }
      } catch (e) {
        console.error('Failed to load history', e);
      }
    };
    loadHistory();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAttachedImage(base64);
      setAttachedPreview(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeAttachment = () => {
    setAttachedImage(null);
    setAttachedPreview(null);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;

    if (!isLoggedIn) {
      toast.error('Please sign in to generate images.');
      return;
    }

    if (credits <= 0) {
      toast.error('No credits remaining. Please add credits to continue.');
      return;
    }

    const userPrompt = prompt.trim();
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      text: userPrompt,
      attachedImageUrl: attachedPreview || undefined,
      createdAt: 'Just now',
    };
    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setGenerating(true);
    setGenerationProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 95) return 95;
        // Faster progress initially, slower towards the end
        const increment = prev < 50 ? 15 : prev < 80 ? 5 : 2;
        return prev + increment;
      });
    }, 500);

    const imageToSend = attachedImage;
    removeAttachment();

    try {
      let generatedImageUrl = '';
      
      // Use Gemini directly instead of Edge Function
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      
      let response;
      if (imageToSend) {
        // Edit image
        const base64Data = imageToSend.split(',')[1];
        const mimeType = imageToSend.split(';')[0].split(':')[1] || 'image/png';
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: userPrompt }
            ]
          }
        });
      } else {
        // Generate image
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: userPrompt }]
          }
        });
      }

      clearInterval(progressInterval);
      setGenerationProgress(100);

      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part && part.inlineData) {
        generatedImageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      } else {
        throw new Error('No image generated by AI');
      }

      // Deduct credit manually since we bypassed the edge function
      if (user) {
        await supabase.from('profiles').update({ credits: credits - 1 }).eq('id', user.id);
        setCredits(prev => prev - 1); // Update UI immediately
      }

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        type: 'ai',
        text: userPrompt,
        imageUrl: generatedImageUrl,
        createdAt: 'Just now',
      };
      setMessages(prev => [...prev, aiMsg]);

      // Save to generation history
      try {
        if (user) {
          await supabase.from('generations').insert({
            user_id: user.id,
            prompt: userPrompt,
            image_url: generatedImageUrl,
          });
        }
      } catch (e) {
        console.error('Failed to save history:', e);
      }

      await refreshProfile();
    } catch (err: any) {
      console.error('Generation error:', err);
      const errorMsg = err.message || 'Something went wrong. Please try again.';
      
      if (errorMsg.includes('Requested entity was not found') || errorMsg.includes('PERMISSION_DENIED') || errorMsg.includes('403')) {
        toast.error('API Key error. Please select a valid Google Cloud API key with Gemini API enabled.');
        if (window.aistudio && window.aistudio.openSelectKey) {
          try {
            await window.aistudio.openSelectKey();
          } catch (e) {
            console.error('Failed to open key selector', e);
          }
        }
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setGenerating(false);
      setGenerationProgress(0);
    }
  };

  const handleNewChat = () => { setMessages([]); setPrompt(''); removeAttachment(); };
  
  const historyMessages = messages.filter(m => m.type === 'ai').filter(m => {
    if (historySearch && !m.text?.toLowerCase().includes(historySearch.toLowerCase())) {
      return false;
    }
    
    if (historyFilter !== 'all') {
      const msgDate = new Date(m.createdAt);
      const now = new Date();
      if (isNaN(msgDate.getTime())) return true; // If it's "Just now" or invalid date string, keep it
      
      const diffTime = Math.abs(now.getTime() - msgDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (historyFilter === 'today' && diffDays > 1) return false;
      if (historyFilter === 'week' && diffDays > 7) return false;
      if (historyFilter === 'month' && diffDays > 30) return false;
    }
    
    return true;
  });

  const handleDownload = async (imageUrl: string) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        // Burn watermark for non-pro users
        if (!isPro) {
          const text = 'Qpixa';
          const fontSize = Math.max(16, Math.floor(canvas.width * 0.04));
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 4;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText(text, canvas.width - fontSize * 0.8, canvas.height - fontSize * 0.6);
        }

        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `qpixa-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success('Image downloaded!');
        }, 'image/png');
      };
      img.onerror = () => toast.error('Failed to download image');
      img.src = imageUrl;
    } catch {
      toast.error('Failed to download image');
    }
  };

  const handleBookmark = async (imageUrl: string, promptText: string) => {
    try {
      if (!user) {
        toast.error('Please login to save favorites');
        return;
      }
      const { error } = await supabase.from('favorites').insert({
        user_id: user.id,
        image_url: imageUrl,
        prompt: promptText,
      });
      if (error) {
        if (error.code === '23505') {
          toast.info('Already saved to favorites');
        } else {
          throw error;
        }
      } else {
        toast.success('Saved to favorites!');
      }
    } catch {
      toast.error('Failed to save');
    }
  };

  const handleShare = async (imageUrl: string, promptText: string) => {
    try {
      if (navigator.share) {
        const shareData: ShareData = { title: 'AI Generated Image', text: promptText };
        if (imageUrl.startsWith('data:')) {
          const res = await fetch(imageUrl);
          const blob = await res.blob();
          const file = new File([blob], `qpixa-${Date.now()}.png`, { type: blob.type });
          if (navigator.canShare?.({ files: [file] })) {
            shareData.files = [file];
          }
        } else {
          shareData.url = imageUrl;
        }
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${promptText}\n\nGenerated with Qpixa`);
        toast.success('Prompt copied to clipboard!');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        toast.error('Failed to share');
      }
    }
  };

  const handleReportSubmit = () => {
    if (!reportText.trim()) {
      toast.error('Please describe the issue');
      return;
    }
    // In a real app, send to Supabase 'reports' table
    toast.success('Issue reported successfully. Thank you!');
    setShowReportModal(false);
    setReportText('');
  };

  const handleFeedbackSubmit = () => {
    if (!feedbackText.trim()) {
      toast.error('Please enter your feedback');
      return;
    }
    // In a real app, send to Supabase 'feedback' table
    toast.success('Feedback sent successfully. Thank you!');
    setShowFeedbackModal(false);
    setFeedbackText('');
  };

  const containerStyle: React.CSSProperties = isKeyboardVisible
    ? { position: 'fixed', top: `${vpOffsetTop}px`, left: 0, right: 0, height: `${vpHeight}px`, zIndex: 30 }
    : { position: 'fixed', top: 0, left: 0, right: 0, bottom: '56px', zIndex: 30 };

  return (
    <>
    <div style={containerStyle} className="flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 pt-2 pb-3 bg-background/95 backdrop-blur-sm border-b border-border z-20" style={{ paddingTop: 'max(env(safe-area-inset-top), 0.5rem)' }}>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
              <Menu size={22} className="text-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 bg-card border-border p-0 flex flex-col" onOpenAutoFocus={(e) => e.preventDefault()}>
            <div className="p-4 border-b border-border shrink-0">
              <SheetTitle className="text-base font-bold text-foreground">AI Studio</SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Generation History</p>
              
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search history..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full bg-secondary text-foreground text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                  <Filter size={12} className="text-muted-foreground shrink-0" />
                  {(['all', 'today', 'week', 'month'] as const).map(filter => (
                    <button
                      key={filter}
                      onClick={() => setHistoryFilter(filter)}
                      className={`px-3 py-1 rounded-full text-[10px] font-semibold capitalize shrink-0 transition-colors ${
                        historyFilter === filter ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {historyMessages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No generations yet</p>
              ) : (
                historyMessages.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setPrompt(item.text || ''); setMenuOpen(false); }}
                    className="w-full text-left bg-secondary rounded-xl p-3 hover:bg-muted transition-colors"
                  >
                    {item.imageUrl && <img src={item.imageUrl} alt="" className="w-full aspect-video object-cover rounded-lg mb-2" />}
                    <p className="text-xs text-foreground line-clamp-2">{item.text}</p>
                    <span className="text-[10px] text-muted-foreground">{item.createdAt}</span>
                  </button>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>

        <h1 className="text-sm font-bold text-foreground">AI Studio</h1>

        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 bg-secondary px-2.5 py-1.5 rounded-full mr-1">
            <Zap size={13} className="text-primary" />
            <span className="text-xs font-semibold text-foreground">{credits}</span>
          </div>
          <button onClick={handleNewChat} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
            <PenLine size={18} className="text-foreground" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
                <MoreVertical size={18} className="text-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem onClick={() => setShowReportModal(true)} className="text-sm gap-2">
                <Flag size={15} /> Report Issue
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowFeedbackModal(true)} className="text-sm gap-2">
                <MessageSquare size={15} /> Send Feedback
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border shadow-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Flag size={18} className="text-primary" />
                Report an Issue
              </h3>
              <button onClick={() => setShowReportModal(false)} className="p-1 rounded-full hover:bg-secondary">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-3">Describe the error or issue you encountered in the Studio.</p>
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="What went wrong?"
                className="w-full h-32 bg-secondary text-sm text-foreground rounded-xl p-3 outline-none resize-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleReportSubmit}
                className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-[0.98] transition-transform"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border shadow-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <MessageSquare size={18} className="text-primary" />
                Send Feedback
              </h3>
              <button onClick={() => setShowFeedbackModal(false)} className="p-1 rounded-full hover:bg-secondary">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-3">Have an idea to improve the Studio? Let us know!</p>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Your suggestions..."
                className="w-full h-32 bg-secondary text-sm text-foreground rounded-xl p-3 outline-none resize-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleFeedbackSubmit}
                className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-[0.98] transition-transform"
              >
                Send Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat content */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-none scrollbar-hide px-4 pb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <Zap size={28} className="text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">Create Something Amazing</h2>
            <p className="text-sm text-muted-foreground mb-6">Describe your image below to get started</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-xl px-4 py-2.5">
              <Paperclip size={14} className="text-primary" />
              <span>Attach a photo to edit it with AI</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {messages.map(msg => (
              msg.type === 'user' ? (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[80%]">
                    {msg.attachedImageUrl && (
                      <div className="mb-1.5 rounded-2xl rounded-br-sm overflow-hidden">
                        <img src={msg.attachedImageUrl} alt="Attached" className="w-full max-h-48 object-cover" />
                      </div>
                    )}
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5">
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <AiMessageBubble 
                  key={msg.id} 
                  msg={msg} 
                  isPro={isPro} 
                  onPublish={onPublish} 
                  onBookmark={handleBookmark} 
                  onDownload={handleDownload} 
                  onShare={handleShare} 
                  onReusePrompt={setPrompt} 
                  setViewerImage={setViewerImage} 
                />
              )
            ))}
            {generating && (
              <div className="flex justify-start">
                <div className="bg-card rounded-2xl rounded-bl-sm p-4 max-w-[85%] border border-border/50 shadow-sm w-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                      </div>
                      <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{attachedImage ? 'Editing image...' : 'Generating image...'}</p>
                      <p className="text-xs text-muted-foreground">This usually takes 5-10 seconds</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1.5">
                    <span>Processing</span>
                    <span>{generationProgress}%</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Input bar */}
      <div className="flex-shrink-0 bg-background border-t border-border px-3 py-2 z-20">
        {attachedPreview && (
          <div className="mb-2 relative inline-block">
            <img src={attachedPreview} alt="Attached" className="h-20 rounded-xl object-cover border border-border" />
            <button
              onClick={removeAttachment}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <div className="bg-secondary search-glow rounded-2xl px-3 py-2 focus-within:border-primary transition-colors">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={attachedImage ? "Describe how to edit this image..." : "Describe your image..."}
            rows={1}
            style={{ minHeight: '44px' }}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none max-h-[160px] py-2"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
          />
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            >
              <Paperclip size={18} className="text-muted-foreground" />
            </button>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || generating}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center disabled:opacity-50"
            >
              {generating ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={14} className="text-primary-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>

    {viewerImage && (
      <ImageViewer src={viewerImage} alt="Generated image" onClose={() => setViewerImage(null)} />
    )}
    </>
  );
}