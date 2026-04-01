import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, X, Video, Store, Image as ImageIcon, Music } from 'lucide-react';
import { useAppState } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Post } from '@/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface CreatePostProps {
  onBack: () => void;
  initialImageUrl?: string;
  initialPrompt?: string;
}

type PostType = 'post' | 'short';

export default function CreatePost({ onBack, initialImageUrl, initialPrompt }: CreatePostProps) {
  const { addPost, user } = useAppState();
  const [type, setType] = useState<PostType>('post');
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [tags, setTags] = useState('');
  const [price, setPrice] = useState('');
  const [audioName, setAudioName] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl || null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
    if (initialImageUrl) setImagePreview(initialImageUrl);
  }, [initialPrompt, initialImageUrl]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const handlePost = async () => {
    if (type === 'post' && !prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    if (type === 'short' && !selectedFile) {
      toast.error('Please upload a video for your Short');
      return;
    }

    setPublishing(true);
    setUploadProgress(0);

    try {
      let finalUrl = type === 'short' ? videoPreview : imagePreview;

      if (user && selectedFile) {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        const fileExt = selectedFile.name.split('.').pop();
        const timestamp = Date.now();
        const fileName = `${timestamp}.${fileExt}`;
        const bucket = 'prompt-images';
        const filePath = `${user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, selectedFile, {
            contentType: selectedFile.type,
            upsert: false
          });
          
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        finalUrl = data.publicUrl;
      } else {
        setUploadProgress(100);
      }

      if (user) {
        if (type === 'post') {
          const { error } = await supabase.from('posts').insert({
            creator_id: user.id,
            prompt: prompt.trim(),
            image_url: finalUrl,
          });
          if (error) throw error;
        } else if (type === 'short') {
          const { error } = await (supabase.from('shorts' as any) as any).insert({
            video_url: finalUrl,
            creator_id: user.id,
            title: title.trim() || null,
            audio_name: audioName.trim() || null,
          });
          if (error) throw error;
          toast.success('Short uploaded successfully!');
        }
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} published!`);
      } else {
        // Fallback to local state for non-logged-in users
        if (type === 'post') {
          const newPost: Post = {
            id: `post-${Date.now()}`,
            title: title.trim(),
            imageUrl: imagePreview || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&h=600&fit=crop',
            creator: { id: user?.id || 'mock-id', name: 'You', username: '@you', avatar: '', initials: 'YO' },
            prompt: prompt.trim(),
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            category: 'Trending',
            style: 'Digital Art',
            aspectRatio: '1:1',
            views: 0,
            likes: 0,
            saves: 0,
            comments: 0,
            createdAt: new Date().toISOString(),
            isLiked: false,
            isSaved: false,
          };
          addPost(newPost);
        }
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} created!`);
      }
      onBack();
    } catch (err: any) {
      console.error('Post error details:', err);
      const errorMessage = err.message || err.error_description || 'Unknown error';
      toast.error(`Failed to publish ${type}: ${errorMessage}`);
    } finally {
      setPublishing(false);
    }
  };

  const types: { id: PostType; label: string; icon: any }[] = [
    { id: 'post', label: 'Post', icon: ImageIcon },
    { id: 'short', label: 'Short', icon: Video },
  ];

  return (
    <div className="fixed inset-0 z-[70] bg-background overflow-y-auto scrollbar-hide">
      <div className="flex items-center gap-3 px-4 py-3 sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <button onClick={onBack}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="text-base font-bold text-foreground">Create</h1>
        <button
          onClick={handlePost}
          disabled={publishing || (type === 'post' && !title.trim()) || (type === 'short' && !selectedFile)}
          className="ml-auto px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 relative overflow-hidden"
        >
          {publishing && (
            <div 
              className="absolute inset-y-0 left-0 bg-white/20 transition-all duration-200" 
              style={{ width: `${uploadProgress}%` }} 
            />
          )}
          <span className="relative z-10">
            {publishing ? `Uploading ${uploadProgress}%` : 'Publish'}
          </span>
        </button>
      </div>

      <div className="px-4 space-y-6 pb-8">
        {/* Type Switcher */}
        <div className="flex bg-secondary p-1 rounded-2xl">
          {types.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setType(t.id);
                setSelectedFile(null);
                setImagePreview(null);
                setVideoPreview(null);
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all relative",
                type === t.id ? "text-primary-foreground" : "text-muted-foreground"
              )}
            >
              {type === t.id && (
                <motion.div
                  layoutId="activeType"
                  className="absolute inset-0 bg-primary rounded-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <t.icon size={16} className="relative z-10" />
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Media Upload */}
        <div
          onClick={() => {
            if (type === 'short') videoFileRef.current?.click();
            else fileRef.current?.click();
          }}
          className={cn(
            "relative rounded-3xl bg-secondary/50 border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:bg-secondary/80 group",
            type === 'short' ? "aspect-[9/16] w-full max-w-[280px] mx-auto" : "aspect-square w-full"
          )}
        >
          {type === 'short' ? (
            videoPreview ? (
              <div className="relative w-full h-full">
                <video src={videoPreview} className="w-full h-full object-cover" autoPlay muted loop />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                    <Music size={14} className="text-white" />
                  </div>
                  <p className="text-xs text-white font-medium truncate">{audioName || 'Original Audio'}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                  <Video size={32} className="text-primary" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Select Video</h3>
                <p className="text-xs text-white/40 max-w-[180px]">Upload a vertical video (9:16) up to 60 seconds</p>
              </div>
            )
          ) : (
            imagePreview ? (
              <img src={imagePreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                  <Upload size={32} className="text-primary" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Upload Image</h3>
                <p className="text-xs text-white/40">High quality AI generated art</p>
              </div>
            )
          )}
          
          {(imagePreview || videoPreview) && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setImagePreview(null);
                setVideoPreview(null);
                setSelectedFile(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white backdrop-blur-xl border border-white/10 hover:bg-red-500 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        <input ref={videoFileRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">TITLE</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={type === 'short' ? "Short description..." : "Give your creation a name"}
              className="w-full bg-secondary rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-transparent focus:border-primary/20 transition-colors"
            />
          </div>

          {type === 'post' && (
            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">PROMPT</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Describe how you created this"
                rows={3}
                className="w-full bg-secondary rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none border border-transparent focus:border-primary/20 transition-colors"
              />
            </div>
          )}

          {type === 'short' && (
            <div className="bg-secondary/30 p-4 rounded-2xl border border-white/5">
              <label className="text-[10px] font-bold text-white/40 mb-2 block uppercase tracking-wider">AUDIO DETAILS</label>
              <div className="flex items-center gap-3 bg-black/20 rounded-xl px-4 py-3 border border-white/5">
                <Music size={16} className="text-primary" />
                <input
                  value={audioName}
                  onChange={e => setAudioName(e.target.value)}
                  placeholder="Original Audio - @you"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none"
                />
              </div>
            </div>
          )}

          {type === 'market' && (
            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">PRICE (CREDITS)</label>
              <input
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="e.g. 50"
                type="number"
                className="w-full bg-secondary rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-transparent focus:border-primary/20 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">TAGS</label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="ai, digital, cyberpunk"
              className="w-full bg-secondary rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-transparent focus:border-primary/20 transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
