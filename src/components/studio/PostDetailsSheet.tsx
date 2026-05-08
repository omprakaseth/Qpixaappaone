import React, { useState } from 'react';
import { X, Check, Tag, Type, AlignLeft, Hash, Sparkles, Loader2, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppState } from '@/context/AppContext';
import { toast } from 'sonner';

interface PostDetailsSheetProps {
  file: Blob | File;
  thumbnail: string;
  onCancel: () => void;
  onPublish: (details: { title: string; description: string; tags: string }) => void;
  isUploading?: boolean;
}

const SUGGESTED_HASHTAGS = ['ai', 'creative', 'short', 'viral', 'vibe', 'art', 'digital', 'future'];

export default function PostDetailsSheet({ file, thumbnail, onCancel, onPublish, isUploading }: PostDetailsSheetProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [previewPlaying, setPreviewPlaying] = useState(false);

  const handlePublish = () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    onPublish({ title, description, tags });
  };

  const addHashtag = (tag: string) => {
    const currentTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (!currentTags.includes(tag)) {
      setTags([...currentTags, tag].join(', '));
    }
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[70] bg-background flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={onCancel} className="text-sm font-medium text-muted-foreground p-2 -ml-2">
          Discard
        </button>
        <h2 className="text-sm font-bold">New Short</h2>
        <button 
          onClick={handlePublish}
          disabled={!title.trim() || isUploading}
          className="text-sm font-bold text-primary disabled:opacity-50 p-2 -mr-2"
        >
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : 'Publish'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Main Content Area */}
          <div className="flex gap-4">
            {/* Thumbnail Preview */}
            <div className="relative w-32 aspect-[9/16] rounded-xl overflow-hidden bg-secondary shadow-lg flex-shrink-0">
              <img 
                src={thumbnail} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play size={14} className="fill-white text-white ml-0.5" />
                </div>
              </div>
            </div>

            {/* Title & Description Column */}
            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Type size={10} /> Title
                </label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Give your short a name..."
                  className="w-full bg-secondary/30 rounded-xl px-4 py-3 text-sm outline-none border border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <AlignLeft size={10} /> Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What's happening in this short?"
                  rows={4}
                  className="w-full bg-secondary/30 rounded-xl px-4 py-3 text-sm outline-none border border-border/50 focus:border-primary/50 transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Hash size={10} /> Hashtags
              </label>
              <input
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="Comma separated tags (ai, creative, etc)"
                className="w-full bg-secondary/30 rounded-xl px-4 py-3 text-sm outline-none border border-border/50 focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {SUGGESTED_HASHTAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => addHashtag(tag)}
                  className="px-3 py-1.5 rounded-full bg-secondary/50 text-[11px] font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-1"
                >
                  <Sparkles size={10} /> #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 mt-8">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} className="text-primary" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-primary">Creator Tip</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Shorts with trending hashtags like #ai and #vocal often get 3x more visibility on the explore page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
