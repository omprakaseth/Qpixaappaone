import React, { useState, useRef, useEffect } from 'react';
import { Menu, Send, Zap, PenLine, MoreVertical, Download, Share2, Bookmark, RotateCcw, Clock, Trash2, Settings, Paperclip, X, ImageIcon, Upload, Sparkles, Flag, MessageSquare, Search, Filter, Wand2, Maximize, Layout, SlidersHorizontal, Square, Plus } from 'lucide-react';
import WatermarkedImage from '@/components/WatermarkedImage';
import ImageViewer from '@/components/ImageViewer';
import AILoader from '@/components/AILoader';
import { useAppState } from '@/context/AppContext';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase, isPlaceholder } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { analytics } from '@/lib/analytics';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';

const STYLE_PRESETS = [
  { id: 'none', name: 'None', prompt: '' },
  { id: 'realistic', name: 'Realistic', prompt: 'highly detailed, photorealistic, 8k, masterpiece' },
  { id: 'anime', name: 'Anime', prompt: 'anime style, vibrant colors, expressive eyes, clean lines' },
  { id: 'cyberpunk', name: 'Cyberpunk', prompt: 'cyberpunk aesthetic, neon lights, futuristic city, rainy night' },
  { id: 'oil', name: 'Oil Painting', prompt: 'oil painting, thick brushstrokes, classical art style, rich textures' },
  { id: '3d', name: '3D Render', prompt: 'octane render, unreal engine 5, volumetric lighting, cinematic' },
  { id: 'sketch', name: 'Sketch', prompt: 'pencil sketch, hand-drawn, charcoal, artistic' },
];

const ASPECT_RATIOS = [
  { id: '1:1', name: 'Square', icon: '1:1' },
  { id: '16:9', name: 'Landscape', icon: '16:9' },
  { id: '9:16', name: 'Portrait', icon: '9:16' },
  { id: '4:3', name: 'Classic', icon: '4:3' },
  { id: '3:4', name: 'Tall', icon: '3:4' },
];

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
  status?: 'pending' | 'success' | 'error';
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface StudioScreenProps {
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  onPublish?: (imageUrl: string, prompt: string) => void;
}

function AiMessageBubble({ msg, isPro, onPublish, onBookmark, onDownload, onShare, onReusePrompt, setViewerImage, onStop, generating }: any) {
  const [showPrompt, setShowPrompt] = useState(false);

  if (msg.status === 'pending') {
    return (
      <div className="flex justify-start items-center gap-4">
        <AILoader showSecondary={false} />
      </div>
    );
  }

  if (msg.status === 'error') {
    return (
      <div className="flex justify-start">
        <div className="bg-destructive/10 text-destructive rounded-2xl rounded-bl-sm p-4 border border-destructive/20 max-w-[85%]">
          <div className="flex items-center gap-2 mb-2">
            <Flag size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Generation Failed</span>
          </div>
          <p className="text-sm leading-relaxed">{msg.text}</p>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-4">
              <button onClick={() => msg.imageUrl && onBookmark(msg.imageUrl, msg.text || '')} className="text-muted-foreground hover:text-foreground transition-colors" title="Bookmark"><Bookmark size={16} /></button>
              <button onClick={() => msg.imageUrl && onDownload(msg.imageUrl)} className="text-muted-foreground hover:text-foreground transition-colors" title="Download"><Download size={16} /></button>
              <button onClick={() => msg.imageUrl && onShare(msg.imageUrl, msg.text || '')} className="text-muted-foreground hover:text-foreground transition-colors" title="Share"><Share2 size={16} /></button>
              <button onClick={() => onReusePrompt(msg.text || '')} className="text-muted-foreground hover:text-foreground transition-colors" title="Reuse Prompt"><RotateCcw size={16} /></button>
            </div>
            <button 
              onClick={() => msg.imageUrl && onPublish?.(msg.imageUrl, msg.text || '')} 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all text-[10px] font-bold uppercase tracking-wider"
            >
              <Upload size={14} />
              Post to Feed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudioScreen({ initialPrompt, onClearInitialPrompt, onPublish }: StudioScreenProps) {
  const { credits, setCredits, isPro, isLoggedIn, refreshProfile, user } = useAppState();
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash-image');
  const MODELS = [
    { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 (Free)', provider: 'Google' },
    { id: 'gemini-3.1-flash-image-preview', name: 'Gemini 3.1 (High Quality)', provider: 'Google' },
    { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'Stable Diffusion XL (Free)', provider: 'HuggingFace' },
    { id: 'runwayml/stable-diffusion-v1-5', name: 'SD v1.5 (Fast & Free)', provider: 'HuggingFace' },
  ];

  const generateWithHuggingFace = async (modelId: string, promptText: string, signal?: AbortSignal) => {
    const callApi = async (retryCount = 0): Promise<any> => {
      try {
        if (signal?.aborted) throw new Error('Aborted');
        
        console.log(`Calling HF Proxy for model: ${modelId}, attempt: ${retryCount + 1}`);
        const response = await fetch('/api/hf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            modelId,
            inputs: promptText,
            options: { wait_for_model: true }
          }),
          signal
        });

        if (response.status === 503 && retryCount < 5) {
          setGenerationProgress(prev => Math.min(prev + 2, 98));
          await new Promise(r => setTimeout(r, 8000));
          return callApi(retryCount + 1);
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate image with Hugging Face');
        }

        const data = await response.json();
        return data.imageUrl;
      } catch (err: any) {
        if (err.name === 'AbortError' || err.message === 'Aborted') throw err;
        console.error('HF API Error:', err);
        throw err;
      }
    };

    return callApi();
  };

  const generateWithGemini = async (modelId: string, promptText: string, imageBase64?: string | null, signal?: AbortSignal) => {
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Generation timed out. Please try again or check your connection.')), 60000);
    });

    const generationPromise = (async () => {
      try {
        let apiKey = (process.env as any).API_KEY || (process.env as any).GEMINI_API_KEY;
        
        if (!apiKey && (window as any).aistudio?.openSelectKey) {
          toast.info('Please select an API key to continue with this model.');
          await (window as any).aistudio.openSelectKey();
          apiKey = (process.env as any).API_KEY || (process.env as any).GEMINI_API_KEY;
        }

        if (!apiKey) {
          throw new Error('No API key found. Please add GEMINI_API_KEY to your environment or select a key in AI Studio.');
        }

        const ai = new GoogleGenAI({ apiKey });
        const isGemini3 = modelId.includes('gemini-3');
        
        let contents: any;
        if (imageBase64) {
          const base64Data = imageBase64.split(',')[1];
          const mimeType = imageBase64.split(';')[0].split(':')[1] || 'image/png';
          contents = {
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: promptText }
            ]
          };
        } else {
          contents = {
            parts: [{ text: promptText }]
          };
        }

        // Optimize config: Only send imageSize for Gemini 3 models
        const config: any = {
          imageConfig: {
            aspectRatio: selectedRatio as any,
          }
        };

        if (isGemini3) {
          config.imageConfig.imageSize = "1K";
        }

        const response = await ai.models.generateContent({
          model: modelId,
          contents,
          config
        });

        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part && part.inlineData) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        } else {
          throw new Error("No image generated by AI. The model might have returned text instead or blocked the request.");
        }
      } catch (err: any) {
        console.error('Gemini Client Error:', err);
        throw err;
      }
    })();

    // Race between generation and timeout
    return Promise.race([generationPromise, timeoutPromise]) as Promise<string>;
  };

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('none');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
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
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [longPressSession, setLongPressSession] = useState<ChatSession | null>(null);
  const [showSessionActions, setShowSessionActions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  // Load sessions from Local Storage
  useEffect(() => {
    const loadSessions = () => {
      try {
        const savedSessions = localStorage.getItem('qpixa_studio_sessions');
        if (savedSessions) {
          const parsed: ChatSession[] = JSON.parse(savedSessions);
          setSessions(parsed);
          
          // If there are sessions, load the most recent one
          if (parsed.length > 0 && !currentSessionId) {
            const mostRecent = parsed[0];
            setCurrentSessionId(mostRecent.id);
            setMessages(mostRecent.messages);
            
            // Check for pending generations and resume if possible
            const pendingMsg = mostRecent.messages.find(m => m.status === 'pending');
            if (pendingMsg && !generating) {
              // We can't easily auto-resume because we might lack context (like attached image)
              // But we can mark it as error so user can retry, or just leave it.
              // For now, let's just mark it as error so it doesn't stay stuck forever
              const updatedMessages = mostRecent.messages.map(m => 
                m.status === 'pending' ? { ...m, status: 'error' as const, text: 'Generation interrupted. Please try again.' } : m
              );
              setMessages(updatedMessages);
              updateSessionMessages(mostRecent.id, updatedMessages);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load sessions', e);
      }
    };
    loadSessions();
  }, []);

  // Helper to save sessions to local storage
  const saveSessionsToLocalStorage = (updatedSessions: ChatSession[]) => {
    try {
      localStorage.setItem('qpixa_studio_sessions', JSON.stringify(updatedSessions));
    } catch (e) {
      console.error('Failed to save sessions', e);
    }
  };

  const handleCreateSession = (firstPrompt: string): ChatSession => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: firstPrompt.slice(0, 30) + (firstPrompt.length > 30 ? '...' : ''),
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    return newSession;
  };

  const updateSessionMessages = (sessionId: string, newMessages: ChatMessage[]) => {
    setSessions(prev => {
      const updated = prev.map(s => 
        s.id === sessionId 
          ? { ...s, messages: newMessages, updatedAt: new Date().toISOString() } 
          : s
      );
      saveSessionsToLocalStorage(updated);
      return updated;
    });
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setSessions(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, title: newTitle } : s);
      saveSessionsToLocalStorage(updated);
      return updated;
    });
    setEditingSessionId(null);
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveSessionsToLocalStorage(updated);
      return updated;
    });
    if (currentSessionId === id) {
      handleNewChat();
    }
  };

  const handleSelectSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setMenuOpen(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploadingAttachment(true);
    setAttachedPreview(URL.createObjectURL(file));

    try {
      if (!user) throw new Error('Please login to upload images');
      
      const fileName = `attachment-${Date.now()}-${file.name}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('prompt-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('prompt-images')
        .getPublicUrl(filePath);

      setAttachedImage(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('Failed to upload image');
      setAttachedPreview(null);
    } finally {
      setIsUploadingAttachment(false);
    }
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

    const userPrompt = prompt.trim();
    
    // 1. Manage Session
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      const newSession = handleCreateSession(userPrompt);
      activeSessionId = newSession.id;
    }

    // 2. Add User Message and Pending AI Message immediately
    const userMsg: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      type: 'user',
      text: userPrompt,
      attachedImageUrl: attachedPreview || undefined,
      createdAt: new Date().toISOString(),
      status: 'success'
    };

    const pendingAiMsg: ChatMessage = {
      id: `msg-a-pending-${Date.now()}`,
      type: 'ai',
      text: userPrompt,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    const newMessages = [...messages, userMsg, pendingAiMsg];
    setMessages(newMessages);
    updateSessionMessages(activeSessionId, newMessages);
    
    setPrompt('');
    setGenerating(true);
    setGenerationProgress(0);

    // Setup AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 98) return 98;
        const increment = prev < 40 ? 18 : prev < 70 ? 8 : prev < 90 ? 3 : 1;
        return prev + increment;
      });
    }, 300);

    const imageToSend = attachedImage;
    removeAttachment();

    try {
      let generatedImageUrl = '';
      const stylePrompt = STYLE_PRESETS.find(s => s.id === selectedStyle)?.prompt || '';
      let finalPrompt = stylePrompt ? `${userPrompt}, ${stylePrompt}` : userPrompt;
      if (negativePrompt.trim()) {
        finalPrompt += `. Avoid: ${negativePrompt.trim()}`;
      }

      const currentModel = MODELS.find(m => m.id === selectedModel);
      if (currentModel?.provider === 'HuggingFace') {
        generatedImageUrl = await generateWithHuggingFace(selectedModel, finalPrompt, controller.signal);
      } else {
        generatedImageUrl = await generateWithGemini(selectedModel, finalPrompt, imageToSend, controller.signal);
      }

      clearInterval(progressInterval);
      setGenerationProgress(100);

      // Update AI Message to success
      const finalAiMsg: ChatMessage = {
        ...pendingAiMsg,
        id: `msg-a-${Date.now()}`,
        imageUrl: generatedImageUrl,
        status: 'success'
      };

      const finalMessages = [...messages, userMsg, finalAiMsg];
      setMessages(finalMessages);
      updateSessionMessages(activeSessionId, finalMessages);

      // Deduct credit
      if (user) {
        await supabase.from('profiles').update({ credits: credits - 1 }).eq('id', user.id);
        setCredits(prev => prev - 1);
      }

      // Save to DB
      if (user && !isPlaceholder) {
        let finalImageUrl = generatedImageUrl;
        if (generatedImageUrl.startsWith('data:')) {
          try {
            const res = await fetch(generatedImageUrl);
            const blob = await res.blob();
            const fileName = `studio-${Date.now()}.png`;
            const filePath = `${user.id}/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('prompt-images').upload(filePath, blob, { contentType: 'image/png' });
            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage.from('prompt-images').getPublicUrl(filePath);
              finalImageUrl = publicUrl;
            }
          } catch (e) { console.error(e); }
        }
        await supabase.from('generations').insert({ user_id: user.id, prompt: userPrompt, image_url: finalImageUrl });
      }

      await refreshProfile();
      abortControllerRef.current = null;
    } catch (err: any) {
      clearInterval(progressInterval);
      abortControllerRef.current = null;
      
      // Update AI Message to error
      const errorAiMsg: ChatMessage = {
        ...pendingAiMsg,
        status: 'error',
        text: `Error: ${err.message || 'Generation failed'}`
      };
      const errorMessages = [...messages, userMsg, errorAiMsg];
      setMessages(errorMessages);
      updateSessionMessages(activeSessionId, errorMessages);

      if (err.message === 'Aborted') {
        toast.info('Generation stopped');
      } else {
        toast.error(err.message || 'Something went wrong');
      }
    } finally {
      setGenerating(false);
      setGenerationProgress(0);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || enhancing) return;
    
    setEnhancing(true);
    try {
      let apiKey = (process.env as any).API_KEY || (process.env as any).GEMINI_API_KEY;
      
      if (!apiKey && (window as any).aistudio?.openSelectKey) {
        await (window as any).aistudio.openSelectKey();
        apiKey = (process.env as any).API_KEY || (process.env as any).GEMINI_API_KEY;
      }

      if (!apiKey) throw new Error('API Key missing');

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Enhance this image generation prompt to be more descriptive and artistic, but keep it concise (under 50 words): "${prompt}"`
      });

      const enhanced = response.text?.trim();
      if (enhanced) {
        setPrompt(enhanced);
        toast.success('Prompt enhanced!');
      }
    } catch (err) {
      console.error('Enhance error:', err);
      toast.error('Failed to enhance prompt');
    } finally {
      setEnhancing(false);
    }
  };

  const handleNewChat = () => { 
    setMessages([]); 
    setPrompt(''); 
    setCurrentSessionId(null);
    removeAttachment(); 
    setSelectedStyle('none'); 
    setSelectedRatio('1:1'); 
  };
  
  const historyMessages = history.filter(m => m.type === 'ai').filter(m => {
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

  const handleShareSession = async (session: ChatSession) => {
    try {
      const text = `Check out my AI Studio chat: "${session.title}" on Qpixa!`;
      if (navigator.share) {
        await navigator.share({
          title: 'Qpixa AI Studio Chat',
          text: text,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share error:', err);
    }
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
              <SheetTitle className="text-base font-bold text-foreground">Chat History</SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Manage your conversations</p>
              
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search chats..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full bg-secondary text-foreground text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Clock size={32} className="mb-2 opacity-20" />
                  <p className="text-xs">No chat history yet</p>
                </div>
              ) : (
                sessions.filter(s => s.title.toLowerCase().includes(historySearch.toLowerCase())).map(session => (
                  <div
                    key={session.id}
                    className={cn(
                      "group relative flex items-center gap-3 w-full p-3 rounded-xl transition-all cursor-pointer",
                      currentSessionId === session.id ? "bg-primary/10 border border-primary/20" : "bg-secondary/50 hover:bg-secondary border border-transparent"
                    )}
                    onClick={() => handleSelectSession(session)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setLongPressSession(session);
                      setShowSessionActions(true);
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageSquare size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingSessionId === session.id ? (
                        <input
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => handleRenameSession(session.id, editTitle)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameSession(session.id, editTitle)}
                          className="w-full bg-background text-xs font-medium py-0.5 px-1 rounded outline-none ring-1 ring-primary"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <p className="text-xs font-medium text-foreground truncate">{session.title}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* Status Icon for Pending */}
                    {session.messages.some(m => m.status === 'pending') && (
                      <RotateCcw size={12} className="text-primary animate-spin shrink-0" />
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSessionId(session.id);
                          setEditTitle(session.title);
                        }}
                        className="p-1 hover:bg-background rounded"
                      >
                        <PenLine size={12} className="text-muted-foreground hover:text-foreground" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className="p-1 hover:bg-background rounded"
                      >
                        <Trash2 size={12} className="text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-border">
              <button 
                onClick={() => { handleNewChat(); setMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
              >
                <Plus size={18} />
                New Chat
              </button>
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
                  onStop={handleStop}
                  generating={generating}
                />
              )
            ))}
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
      <div className="flex-shrink-0 bg-background border-t border-border px-3 py-2 z-20 mb-[2%]">
        {showAdvanced && (
          <div className="mb-3 animate-in slide-in-from-bottom-2 duration-200">
            <div className="bg-secondary/30 rounded-xl p-2.5 border border-border/50 space-y-3">
              {/* Style Presets */}
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Style Preset</label>
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
                  {STYLE_PRESETS.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-semibold whitespace-nowrap transition-colors ${
                        selectedStyle === style.id ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-transparent'
                      }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">AI Model</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {MODELS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedModel(m.id)}
                      className={`px-2 py-1.5 rounded-lg text-[9px] font-bold border transition-all flex flex-row items-center justify-between gap-2 ${
                        selectedModel === m.id ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-background/50 border-transparent text-muted-foreground'
                      }`}
                    >
                      <span className="truncate">{m.name.replace(' (Free)', '').replace(' (High Quality)', '').replace(' (Fast & Free)', '')}</span>
                      {m.provider === 'HuggingFace' || m.id === 'gemini-2.5-flash-image' ? (
                        <span className="text-[7px] px-1 py-0.5 bg-green-500/20 text-green-500 rounded uppercase font-black">Free</span>
                      ) : (
                        <span className="text-[7px] px-1 py-0.5 bg-amber-500/20 text-amber-500 rounded uppercase font-black">Pro</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Negative Prompt</label>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="What to exclude..."
                  className="w-full bg-transparent text-[10px] text-foreground placeholder:text-muted-foreground/50 outline-none resize-none h-10"
                />
              </div>
            </div>
          </div>
        )}

        {attachedPreview && (
          <div className="mb-2 relative inline-block">
            <img src={attachedPreview} alt="Attached" className={cn("h-20 rounded-xl object-cover border border-border", isUploadingAttachment && "opacity-50")} />
            {isUploadingAttachment ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <RotateCcw size={20} className="text-primary animate-spin" />
              </div>
            ) : (
              <button
                onClick={removeAttachment}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              >
                <X size={12} />
              </button>
            )}
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
            <div className="flex items-center gap-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                title="Attach Image"
              >
                <Paperclip size={18} className="text-muted-foreground" />
              </button>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors relative",
                  showAdvanced ? "text-primary" : "text-muted-foreground"
                )}
                title="Advanced Settings"
              >
                <SlidersHorizontal size={18} />
                {(selectedStyle !== 'none' || negativePrompt.trim() !== '') && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full border border-background" />
                )}
              </button>
              <button
                onClick={handleEnhancePrompt}
                disabled={!prompt.trim() || enhancing}
                className={`w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors ${enhancing ? 'animate-pulse text-primary' : 'text-muted-foreground'}`}
                title="Enhance Prompt"
              >
                <Wand2 size={18} />
              </button>
            </div>
            <button
              onClick={generating ? handleStop : handleGenerate}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                generating ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'
              } disabled:opacity-50`}
            >
              {generating ? (
                <Square size={12} fill="currentColor" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>

    {showSessionActions && longPressSession && (
      <div className="fixed inset-0 z-[110] bg-background/80 backdrop-blur-sm flex items-end justify-center sm:items-center p-4" onClick={() => setShowSessionActions(false)}>
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="bg-card w-full max-w-sm rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-border text-center">
            <h3 className="font-bold text-foreground truncate px-4">{longPressSession.title}</h3>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">Chat Actions</p>
          </div>
          <div className="p-2 space-y-1">
            <button 
              onClick={() => {
                setEditingSessionId(longPressSession.id);
                setEditTitle(longPressSession.title);
                setShowSessionActions(false);
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-secondary transition-colors text-sm font-medium"
            >
              <PenLine size={18} className="text-primary" />
              Rename Chat
            </button>
            <button 
              onClick={() => {
                handleShareSession(longPressSession);
                setShowSessionActions(false);
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-secondary transition-colors text-sm font-medium"
            >
              <Share2 size={18} className="text-blue-500" />
              Share Chat
            </button>
            <button 
              onClick={() => {
                handleDeleteSession(longPressSession.id);
                setShowSessionActions(false);
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-secondary transition-colors text-sm font-medium text-destructive"
            >
              <Trash2 size={18} />
              Delete Chat
            </button>
          </div>
          <div className="p-4 bg-secondary/30">
            <button 
              onClick={() => setShowSessionActions(false)}
              className="w-full py-3 rounded-xl bg-secondary text-foreground text-sm font-bold"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    )}

    {viewerImage && (
      <ImageViewer src={viewerImage} alt="Generated image" onClose={() => setViewerImage(null)} />
    )}
    </>
  );
}