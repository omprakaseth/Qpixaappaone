import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { useAppState } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Post } from '@/context/AppContext';

interface CreatePostProps {
  onBack: () => void;
  initialImageUrl?: string;
  initialPrompt?: string;
}

export default function CreatePost({ onBack, initialImageUrl, initialPrompt }: CreatePostProps) {
  const { addPost, user } = useAppState();
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [tags, setTags] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl || null);
  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handlePost = async () => {
    if (!title.trim() || !prompt.trim()) return;
    setPublishing(true);
    setUploadProgress(0);

    try {
      let finalImageUrl = imagePreview;

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
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('prompt-images')
          .upload(filePath, selectedFile);
          
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from('prompt-images').getPublicUrl(filePath);
        finalImageUrl = data.publicUrl;
      } else {
        setUploadProgress(100);
      }

      if (user) {
        const { error } = await supabase.from('posts').insert({
          creator_id: user.id,
          prompt: prompt.trim(),
          image_url: finalImageUrl,
        });
        if (error) throw error;
        toast.success('Post published!');
      } else {
        // Fallback to local state for non-logged-in users
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
        toast.success('Post created!');
      }
      onBack();
    } catch (err) {
      console.error('Post error:', err);
      toast.error('Failed to publish post');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-background overflow-y-auto scrollbar-hide">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onBack}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="text-base font-bold text-foreground">Create Post</h1>
        <button
          onClick={handlePost}
          disabled={!title.trim() || !prompt.trim() || publishing}
          className="ml-auto px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 relative overflow-hidden"
        >
          {publishing && (
            <div 
              className="absolute inset-y-0 left-0 bg-white/20 transition-all duration-200" 
              style={{ width: `${uploadProgress}%` }} 
            />
          )}
          <span className="relative z-10">
            {publishing ? `Publishing ${uploadProgress}%` : 'Post'}
          </span>
        </button>
      </div>

      <div className="px-4 space-y-4 pb-8">
        {/* Image upload */}
        <div
          onClick={() => !initialImageUrl && fileRef.current?.click()}
          className="aspect-square rounded-xl bg-card border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer overflow-hidden"
        >
          {imagePreview ? (
            <img src={imagePreview} alt="" className="w-full h-full object-cover" />
          ) : (
            <>
              <Upload size={32} className="text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Upload Image</p>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">TITLE</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Give your creation a name"
            className="w-full bg-secondary rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">PROMPT</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe how you created this"
            rows={3}
            className="w-full bg-secondary rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">TAGS</label>
          <input
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="ai, digital, cyberpunk"
            className="w-full bg-secondary rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
      </div>
    </div>
  );
}
