import React, { useState, useRef, useEffect } from 'react';
import { Menu, Send, Zap, PenLine, MoreVertical, Download, Share2, Bookmark, RotateCcw, Clock, Trash2, Settings, Paperclip, X, ImageIcon, Upload, Sparkles, Flag, MessageSquare, Search, Filter, Wand2, Maximize, Layout, SlidersHorizontal, Square, Plus, Check, Loader2 } from 'lucide-react';
import { ImageViewer } from '@/components/ImageViewer';
import { motion, AnimatePresence } from 'motion/react';
import WatermarkedImage from '@/components/WatermarkedImage';
import AILoader from '@/components/AILoader';
import { useAppState } from '@/context/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase, isPlaceholder } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { analytics } from '@/lib/analytics';

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
  aspectRatio?: string;
  status?: 'pending' | 'success' | 'error';
  error?: string;
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

function AiMessageBubble({ msg, isPro, onOpenViewer, onDelete }: any) {
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

  const ratioClass = msg.aspectRatio === '16:9' ? 'aspect-video' : 
                     msg.aspectRatio === '9:16' ? 'aspect-[9/16]' : 
                     msg.aspectRatio === '4:3' ? 'aspect-4/3' : 
                     msg.aspectRatio === '3:4' ? 'aspect-3/4' : 'aspect-square';

  return (
    <div className="flex justify-start">
      <div className="bg-card rounded-2xl overflow-hidden max-w-[85%] border border-border/50 shadow-sm relative group">
        {msg.imageUrl && (
          <div className="relative">
            <button 
              onClick={() => onOpenViewer(msg.imageUrl!, msg.text || '', msg.id)} 
              className="w-full relative block"
            >
              <WatermarkedImage 
                src={msg.imageUrl} 
                alt={msg.text || 'Generated image'} 
                className={cn("w-full object-cover", ratioClass)} 
                isPro={isPro} 
              />
            </button>
            
            {/* Delete Button for individual images */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(msg.id);
              }}
              className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudioScreen({ initialPrompt, onClearInitialPrompt, onPublish }: StudioScreenProps) {
  const isMobile = useIsMobile();
  const { credits, setCredits, isPro, isLoggedIn, refreshProfile, user, profile } = useAppState();
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('flux');
  const MODELS = [
    { id: 'flux', name: 'Flux.1 (High Quality)', provider: 'Pollinations' },
    { id: 'flux-realism', name: 'Flux Realism', provider: 'Pollinations' },
    { id: 'flux-anime', name: 'Flux Anime', provider: 'Pollinations' },
    { id: 'flux-3d', name: 'Flux 3D', provider: 'Pollinations' },
    { id: 'pollinations', name: 'Pollinations Standard', provider: 'Pollinations' },
    { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 (Free)', provider: 'Google' },
    { id: 'gemini-3.1-flash-image-preview', name: 'Gemini 3.1 (Pro)', provider: 'Google' },
    { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'SDXL (Free)', provider: 'HuggingFace' },
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
          const errorMessage = errorData.error || 'Failed to generate image with Hugging Face';
          
          if (errorMessage.includes('Model is overloaded') || errorMessage.includes('currently loading')) {
            throw new Error('Hugging Face model is currently busy or loading. Please wait a moment and try again.');
          }
          
          throw new Error(errorMessage);
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

  const generateWithPollinations = async (modelId: string, promptText: string, ratio: string) => {
    const seed = Math.floor(Math.random() * 1000000);
    const width = ratio === '16:9' ? 1280 : ratio === '9:16' ? 720 : 1024;
    const height = ratio === '16:9' ? 720 : ratio === '9:16' ? 1280 : 1024;
    
    try {
      const response = await fetch('/api/pollinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          model: modelId,
          width,
          height,
          seed,
          nologo: true,
          enhance: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image with Pollinations');
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (err: any) {
      console.error('Pollinations API Error:', err);
      throw err;
    }
  };

  const generateWithGemini = async (modelId: string, promptText: string, imageBase64?: string | null, signal?: AbortSignal) => {
    try {
      console.log(`Calling Gemini Proxy for model: ${modelId}`);
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: promptText,
          model: modelId,
          image: imageBase64,
          type: 'image',
          config: {
            imageConfig: {
              aspectRatio: selectedRatio,
              imageSize: modelId.includes('gemini-3') ? "1K" : undefined
            }
          }
        }),
        signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image with Gemini');
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      console.error('Gemini API Error:', err);
      throw err;
    }
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
  const [viewerData, setViewerData] = useState<{ url: string; prompt: string; id?: string } | null>(null);
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

  // Load sessions from Local Storage and Sync with DB
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const savedSessions = localStorage.getItem('qpixa_studio_sessions');
        let parsed: ChatSession[] = [];
        if (savedSessions) {
          parsed = JSON.parse(savedSessions);
        }

        // If logged in, also fetch from DB to ensure we have history
        if (user && !isPlaceholder) {
          const { data: dbGenerations } = await supabase
            .from('generations')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

          if (dbGenerations && dbGenerations.length > 0) {
            // Create a "Cloud History" session if it doesn't exist or update it
            const cloudMessages: ChatMessage[] = dbGenerations.map((g: any) => ({
              id: g.id,
              type: 'ai',
              text: g.prompt,
              imageUrl: g.image_url,
              createdAt: g.created_at,
              status: 'success'
            }));

            const cloudSession: ChatSession = {
              id: 'cloud-history',
              title: '☁️ Cloud History',
              messages: cloudMessages,
              createdAt: dbGenerations[dbGenerations.length - 1].created_at,
              updatedAt: dbGenerations[0].created_at,
            };

            // Merge with local sessions
            const otherSessions = parsed.filter(s => s.id !== 'cloud-history');
            parsed = [cloudSession, ...otherSessions];
          }
        }

        if (parsed.length > 0) {
          setSessions(parsed);
          
          // If there are sessions, load the most recent one if none selected
          if (!currentSessionId) {
            const mostRecent = parsed[0];
            setCurrentSessionId(mostRecent.id);
            setMessages(mostRecent.messages);
          }
        }
      } catch (e) {
        console.error('Failed to load sessions', e);
      }
    };
    loadSessions();
  }, [user, isLoggedIn]);

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

  const handleDeleteMessage = async (sessionId: string, messageId: string) => {
    try {
      // 1. Optimistic Update - Remove from UI instantly
      setMessages(prev => prev.filter(m => m.id !== messageId));
      
      // Update the session in local storage/state too
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return { ...s, messages: s.messages.filter(m => m.id !== messageId) };
        }
        return s;
      }));

      // 2. Clear from Supabase if the user is logged in
      // Note: We check if messageId is a UUID to distinguish from temporary session IDs
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId);
      
      if (user && !isPlaceholder && isUUID) {
        const { error } = await supabase
          .from('generations')
          .delete()
          .eq('id', messageId)
          .eq('user_id', user.id);
          
        if (error) {
          console.error('Supabase delete error:', error);
          // Only show error toast if it's a real server error
          if (error.code !== 'PGRST116') {
            throw error;
          }
        }
      }
      
      // 3. Update local session storage
      const savedSessions = localStorage.getItem('qpixa_studio_sessions');
      if (savedSessions) {
        const parsed: ChatSession[] = JSON.parse(savedSessions);
        const updated = parsed.map(s => 
          s.id === sessionId 
            ? { ...s, messages: s.messages.filter(m => m.id !== messageId) } 
            : s
        );
        localStorage.setItem('qpixa_studio_sessions', JSON.stringify(updated));
      }

      toast.success('Deleted from history');
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error('Failed to delete permanently');
    }
  };

  const handleClearHistory = async () => {
    if (!user || isPlaceholder) return;
    const confirmDelete = window.confirm('Are you sure you want to permanently delete ALL your cloud history?');
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('generations').delete().eq('user_id', user.id);
      if (error) throw error;
      
      setSessions(prev => prev.map(s => s.id === 'cloud-history' ? { ...s, messages: [] } : s));
      if (currentSessionId === 'cloud-history') {
        setMessages([]);
      }
      toast.success('History cleared');
    } catch (err) {
      toast.error('Failed to clear history');
    }
  };
  
  const handleDeleteSession = async (id: string) => {
    if (id === 'cloud-history') {
      await handleClearHistory();
      return;
    }

    try {
      setSessions(prev => {
        const updated = prev.filter(s => s.id !== id);
        saveSessionsToLocalStorage(updated);
        return updated;
      });
      
      if (currentSessionId === id) {
        handleNewChat();
      }
      toast.success('Chat deleted');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete chat');
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
      aspectRatio: selectedRatio,
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
      
      // Pro Identity Transfer: If an image is attached, describe it first using Gemini 
      // to ensure the character/subject is preserved in the final image generation.
      if (imageToSend) {
        toast.info('Analyzing image for perfect character transfer...');
        try {
          const describeRes = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: "CRITICAL: Describe the EXACT facial features, hair, clothing, and physical build of the person in this image. I need to recreate this IDENTICAL person in a different setting. Focus on unique identifiers. Be extremely specific but concise.",
              image: imageToSend,
              type: 'text',
              model: 'gemini-1.5-flash'
            })
          });
          
          if (describeRes.ok) {
            const describeData = await describeRes.json();
            const characterDesc = describeData.text;
            if (characterDesc) {
              // Enhanced Pro Prompt with Identity Locking
              finalPrompt = `STRICT IDENTITY LOCK: Recreate the exact same person with these features: [${characterDesc}]. Ensure facial structure and clothing remain consistent. PLACE THIS PERSON in this new scene: ${userPrompt}. Artistic style: ${stylePrompt}`;
              console.log('Final Pro Prompt (Identity Locked):', finalPrompt);
            }
          }
        } catch (e) {
          console.warn('Image analysis failed, proceeding with basic prompt.', e);
        }
      }

      if (negativePrompt.trim()) {
        finalPrompt += `. Avoid: ${negativePrompt.trim()}`;
      }

      const currentModel = MODELS.find(m => m.id === selectedModel);
      if (currentModel?.provider === 'HuggingFace') {
        generatedImageUrl = await generateWithHuggingFace(selectedModel, finalPrompt, controller.signal);
      } else if (currentModel?.provider === 'Pollinations') {
        generatedImageUrl = await generateWithPollinations(selectedModel, finalPrompt, selectedRatio);
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
        aspectRatio: selectedRatio,
        status: 'success'
      };

      const finalMessages = [...messages, userMsg, finalAiMsg];
      setMessages(finalMessages);
      updateSessionMessages(activeSessionId, finalMessages);

      // Deduct credit (skip for verified/pro creators if applicable)
      if (user && !profile?.is_verified) {
        await supabase.from('profiles').update({ credits: credits - 1 }).eq('id', user.id);
        setCredits(prev => prev - 1);
      }

      // Save to DB and update AI message with REAL ID
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
        
        const { data: dbGen, error: dbError } = await supabase
          .from('generations')
          .insert({ user_id: user.id, prompt: userPrompt, image_url: finalImageUrl })
          .select()
          .single();

        if (!dbError && dbGen) {
          // Update the message with the real DB ID so deletion works!
          const linkedAiMsg: ChatMessage = {
            ...finalAiMsg,
            id: dbGen.id
          };
          const linkedMessages = [...messages, userMsg, linkedAiMsg];
          setMessages(linkedMessages);
          updateSessionMessages(activeSessionId, linkedMessages);
        } else {
          console.error('Failed to sync generation with DB:', dbError);
        }
      }

      await refreshProfile();
      abortControllerRef.current = null;
    } catch (err: any) {
      clearInterval(progressInterval);
      abortControllerRef.current = null;
      setGenerating(false);
      setGenerationProgress(0);
      
      console.error('GENERATE ERROR:', err);
      const errorMessage = err.message || 'An unknown error occurred';
      toast.error(`Generation failed: ${errorMessage}`);
      
      // Update AI Message to error
      const errorAiMsg: ChatMessage = {
        ...pendingAiMsg,
        status: 'error',
        error: errorMessage,
        text: `Error: ${errorMessage}`
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
      // Try backend Gemini first
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `Enhance this image generation prompt to be more descriptive and artistic, but keep it concise (under 50 words): "${prompt}"`,
          type: 'text',
          model: 'gemini-1.5-flash'
        })
      });

      let enhanced = '';
      if (response.ok) {
        const data = await response.json();
        enhanced = data.text?.trim();
      } else {
        // Fallback to Pollinations Text AI (Proxy)
        console.log('Gemini enhance failed, falling back to Pollinations');
        const pollResponse = await fetch('/api/pollinations/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt: `Enhance this image generation prompt to be more descriptive and artistic, but keep it concise (under 50 words): "${prompt}"`,
            model: 'openai'
          })
        });
        if (pollResponse.ok) {
          const pollData = await pollResponse.json();
          enhanced = pollData.text;
        }
      }
      
      if (enhanced) {
        setPrompt(enhanced.trim());
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
    ? { 
        position: 'fixed', 
        top: `${vpOffsetTop}px`, 
        left: 0, 
        right: 0, 
        height: `${vpHeight}px`, 
        zIndex: 30 
      }
    : { 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: isMobile ? '56px' : '0', 
        zIndex: 30 
      };

  return (
    <>
    <div style={containerStyle} className="flex flex-col overflow-hidden bg-[#09090b]">
      {/* Mobile Header - Hidden on Desktop */}
      {isMobile && (
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
          </div>
        </div>
      )}

      {/* Main Content Split View */}
      <div className={cn("flex-1 flex overflow-hidden", isMobile ? "flex-col" : "flex-row")}>
        
        {/* LEFT PANEL: Settings & Prompt (Desktop) */}
        {!isMobile && (
          <aside className="w-[420px] bg-[#0f0f13] border-r border-[#1f1f23] flex flex-col overflow-hidden animate-in slide-in-from-left duration-300">
            <div className="flex-shrink-0 p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black tracking-tighter uppercase italic text-white leading-none">Studio Engine</h2>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Professional Suite</p>
              </div>
              <div className="flex items-center gap-2">
                 <button 
                  onClick={handleNewChat}
                  className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
                  title="New Session"
                >
                  <RotateCcw size={16} />
                </button>
                <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                  <SheetTrigger asChild>
                    <button className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors">
                      <Clock size={16} />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 bg-[#0f0f13] border-[#1f1f23] p-0 flex flex-col">
                     <div className="p-6 border-b border-white/5">
                        <SheetTitle className="text-white font-black uppercase italic tracking-wider">Session History</SheetTitle>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {sessions.map(s => (
                          <button 
                            key={s.id}
                            onClick={() => handleSelectSession(s)}
                            className={cn(
                              "w-full p-4 rounded-xl text-left transition-all border",
                              currentSessionId === s.id ? "bg-primary/20 border-primary/40" : "bg-white/5 border-transparent hover:bg-white/10"
                            )}
                          >
                            <p className="text-sm font-bold text-white truncate">{s.title}</p>
                            <p className="text-[10px] text-white/40 mt-1">{new Date(s.updatedAt).toLocaleString()}</p>
                          </button>
                        ))}
                     </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Prompt Input */}
              <section>
                <div className="flex items-center justify-between mb-3">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Describe Vision</h3>
                   <button 
                    onClick={handleEnhancePrompt}
                    disabled={enhancing || !prompt.trim()}
                    className="text-[10px] font-bold text-white/40 hover:text-primary transition-colors flex items-center gap-1 uppercase"
                   >
                     {enhancing ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                     Magic Enhance
                   </button>
                </div>
                <div className="relative group">
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g. A futuristic samurai in a neon forest, cinematic lighting..."
                    className="w-full bg-[#16161c] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-primary transition-all min-h-[160px] resize-none"
                  />
                  <div className="absolute bottom-4 right-4 flex gap-2">
                     <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                      title="Attach Reference Image"
                     >
                       <Paperclip size={18} />
                     </button>
                  </div>
                </div>
                {attachedPreview && (
                  <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3">
                    <img src={attachedPreview} className="w-12 h-12 rounded-lg object-cover ring-2 ring-primary/40" />
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-primary uppercase">Identity Source</p>
                      <p className="text-[11px] text-white/60">Character locked for next generation</p>
                    </div>
                    <button onClick={removeAttachment} className="p-1.5 hover:bg-destructive/20 text-white/40 hover:text-destructive rounded-lg"><X size={14} /></button>
                  </div>
                )}
              </section>

              {/* Aspect Ratio */}
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Canvas Frame</h3>
                <div className="grid grid-cols-5 gap-2">
                  {ASPECT_RATIOS.map(ratio => (
                    <button
                      key={ratio.id}
                      onClick={() => setSelectedRatio(ratio.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all gap-1.5",
                        selectedRatio === ratio.id ? "bg-primary border-primary text-white" : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                      )}
                    >
                      <Square size={14} className={cn(
                        ratio.id === '16:9' ? 'scale-x-125 scale-y-75' : 
                        ratio.id === '9:16' ? 'scale-x-75 scale-y-125' : 
                        ratio.id === '4:3' ? 'scale-x-110 scale-y-90' :
                        ratio.id === '3:4' ? 'scale-x-90 scale-y-110' : ''
                      )} />
                      <span className="text-[10px] font-bold">{ratio.id}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Models */}
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Core Engine</h3>
                <div className="grid grid-cols-2 gap-2">
                  {MODELS.slice(0, 4).map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedModel(m.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all relative group",
                        selectedModel === m.id ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                      )}
                    >
                      <p className="text-xs font-bold leading-tight">{m.name}</p>
                      <p className="text-[9px] mt-1 opacity-60 uppercase font-black">{m.provider}</p>
                      {selectedModel === m.id && <Check size={12} className="absolute top-3 right-3" />}
                    </button>
                  ))}
                </div>
              </section>

              {/* Styles */}
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Aesthetic Overlay</h3>
                <div className="grid grid-cols-3 gap-2">
                  {STYLE_PRESETS.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={cn(
                        "p-2.5 rounded-xl border text-center transition-all",
                        selectedStyle === style.id ? "bg-primary text-white border-primary" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                      )}
                    >
                      <span className="text-[10px] font-bold truncate block">{style.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Bottom Generate Button */}
            <div className="p-6 border-t border-white/5">
               <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className={cn(
                  "w-full h-14 rounded-2xl font-black uppercase tracking-[0.1em] text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl",
                  generating ? "bg-white/5 text-white/20 cursor-not-allowed" : "bg-primary text-white shadow-primary/20 hover:scale-[1.02]"
                )}
              >
                {generating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span className="tabular-nums">Forging Image... {generationProgress}%</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Ignite Creation
                  </>
                )}
              </button>
            </div>
          </aside>
        )}

        {/* RIGHT CONTENT: Preview & Chat */}
        <div className="flex-1 flex flex-col relative bg-[#09090b]">
           <div className={cn(
             "flex-1 overflow-y-auto p-6 md:p-12 space-y-12 flex flex-col-reverse custom-scrollbar",
             isMobile && "p-4 space-y-6"
           )}>
             <div ref={chatEndRef} />
             
             {[...messages].reverse().map((msg) => (
                <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {msg.type === 'user' ? (
                    <div className="flex justify-end mb-8">
                       <div className="bg-primary/10 border border-primary/20 rounded-3xl rounded-tr-sm p-6 max-w-[85%] md:max-w-xl">
                         {msg.attachedImageUrl && (
                           <img src={msg.attachedImageUrl} className="w-full rounded-2xl mb-4 object-cover max-h-[400px] shadow-2xl" />
                         )}
                         <p className="text-white text-sm md:text-base leading-relaxed tracking-wide">{msg.text}</p>
                       </div>
                    </div>
                  ) : (
                    <div className="flex justify-center md:justify-start">
                       <AiMessageBubble 
                        msg={msg} 
                        isPro={isPro} 
                        onOpenViewer={(url: string, p: string, id: string) => setViewerData({ url, prompt: p, id })}
                        onDelete={(id: string) => handleDeleteMessage(currentSessionId!, id)}
                      />
                    </div>
                  )}
                </div>
             ))}

             {messages.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="relative mb-10 group">
                    <div className="absolute inset-0 bg-primary blur-[120px] opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative w-32 h-32 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl">
                      <Sparkles size={60} className="text-white animate-pulse" />
                    </div>
                  </div>
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Imagine the Impossible</h2>
                  <p className="text-white/40 text-lg max-w-md font-medium px-8 leading-relaxed">
                    Professional AI workspace. Prompt, refine, and generate museum-quality art in seconds.
                  </p>
               </div>
             )}
           </div>

           {/* Mobile Input (Shown only on mobile) */}
           {isMobile && (
              <div className="flex-shrink-0 p-4 pb-safe bg-[#09090b] border-t border-white/5 z-20">
                 <div className="relative flex items-end gap-2 bg-[#16161c] rounded-2xl p-2 border border-white/5 focus-within:border-primary/50 transition-all">
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 text-white/40 hover:text-white transition-colors">
                      <Paperclip size={20} />
                    </button>
                    <textarea
                      ref={textareaRef}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Say something creative..."
                      className="flex-1 bg-transparent border-none outline-none text-sm text-white py-3 max-h-[160px] resize-none"
                      rows={1}
                    />
                    <button 
                      onClick={generating ? handleStop : handleGenerate}
                      className={cn(
                        "p-3 rounded-xl flex items-center justify-center transition-all",
                        generating || prompt.trim() ? "bg-primary text-white" : "bg-white/5 text-white/20"
                      )}
                    >
                      {generating ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>

      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
      
      {/* Modals & Menus */}

    <AnimatePresence>
      {viewerData && (
        <ImageViewer 
          url={viewerData.url} 
          alt={viewerData.prompt} 
          onClose={() => setViewerData(null)} 
          isOwner={true}
          onDelete={() => {
            if (viewerData.id && currentSessionId) {
              handleDeleteMessage(currentSessionId, viewerData.id);
              setViewerData(null);
            }
          }}
          onDownload={() => handleDownload?.(viewerData.url)}
          onShare={() => handleShare?.(viewerData.url, viewerData.prompt)}
        />
      )}
    </AnimatePresence>
    </>
  );
}