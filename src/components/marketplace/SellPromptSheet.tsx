import { useState, useRef } from 'react';
import { X, Upload, Coins, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAppState } from '@/context/AppContext';
import { useSwipeDismiss } from '@/hooks/useSwipeDismiss';

interface SellPromptSheetProps {
  onClose: () => void;
  onSuccess: () => void;
}

const categories = ['Photo Prompts', 'Art Prompts', 'Sci-Fi Prompts', 'Car Prompts', 'Nature Prompts', 'Portrait Prompts', 'Anime Prompts'];
const modelTypes = ['Gemini Image', 'DALL-E', 'Midjourney', 'Stable Diff.'];

export default function SellPromptSheet({ onClose, onSuccess }: SellPromptSheetProps) {
  const { user } = useAppState();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [promptText, setPromptText] = useState('');
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState(categories[0]);
  const [modelType, setModelType] = useState(modelTypes[0]);
  const [price, setPrice] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!title.trim() || !promptText.trim()) {
      setError('Title and prompt are required');
      return;
    }
    if (!user) return;

    setSubmitting(true);
    setError('');

    const { error: dbError } = await supabase.from('marketplace_prompts').insert({
      creator_id: user.id,
      title: title.trim(),
      description: description.trim(),
      prompt_text: promptText.trim(),
      preview_image: previewImages[0] || null,
      category,
      model_type: modelType,
      price,
    });

    setSubmitting(false);

    if (dbError) {
      setError('Failed to publish prompt. Try again.');
      return;
    }

    onSuccess();
    onClose();
  };

  const { dragHandleProps, style: swipeStyle, opacity: backdropOpacity } = useSwipeDismiss({ onDismiss: onClose });

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" style={{ opacity: backdropOpacity }} onClick={onClose} />

      <div className="relative w-full max-w-lg bg-card rounded-t-2xl border-t border-border max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300" style={swipeStyle}>
        <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing" {...dragHandleProps}>
          <div className="w-10 h-1 rounded-full bg-muted-foreground/40" />
        </div>

        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground z-10">
          <X size={20} />
        </button>

        <div className="px-5 pt-2 pb-1">
          <h2 className="text-lg font-bold text-foreground">Sell Your Prompt</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Share your best prompts and earn credits</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4 mt-3">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">Title *</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Cinematic Portrait Pack"
              className="h-10 bg-secondary border-none rounded-xl text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what this prompt creates..."
              className="w-full h-20 bg-secondary border-none rounded-xl text-sm p-3 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Prompt Text */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">Prompt Text *</label>
            <textarea
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
              placeholder="Your full prompt text that buyers will receive..."
              className="w-full h-24 bg-secondary border-none rounded-xl text-sm p-3 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Preview Images Upload */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">Preview Images</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !user) return;
                setUploadingIdx(previewImages.length);
                const path = `${user.id}/${Date.now()}-${file.name}`;
                const { error: upErr } = await supabase.storage.from('prompt-images').upload(path, file);
                if (upErr) { setUploadingIdx(null); return; }
                const { data } = supabase.storage.from('prompt-images').getPublicUrl(path);
                setPreviewImages(prev => [...prev, data.publicUrl]);
                setUploadingIdx(null);
                e.target.value = '';
              }}
            />
            <div className="flex gap-2 flex-wrap">
              {previewImages.map((img, i) => (
                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-border bg-secondary group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setPreviewImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-destructive/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={10} className="text-destructive-foreground" />
                  </button>
                </div>
              ))}
              {uploadingIdx !== null && (
                <div className="w-16 h-16 rounded-xl border border-border bg-secondary flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {previewImages.length < 4 && uploadingIdx === null && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-secondary/50 flex flex-col items-center justify-center gap-0.5 hover:border-primary/50 hover:bg-secondary transition-colors"
                >
                  <Plus size={18} className="text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground">Add</span>
                </button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Up to 4 images (tap + to upload)</p>
          </div>

          {/* Category & Model */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full h-10 bg-secondary border-none rounded-xl text-sm px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">AI Model</label>
              <select
                value={modelType}
                onChange={e => setModelType(e.target.value)}
                className="w-full h-10 bg-secondary border-none rounded-xl text-sm px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {modelTypes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">Price (credits)</label>
            <div className="relative">
              <Coins size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
              <Input
                type="number"
                min={0}
                max={100}
                value={price}
                onChange={e => setPrice(Math.max(0, parseInt(e.target.value) || 0))}
                className="pl-9 h-10 bg-secondary border-none rounded-xl text-sm"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Set to 0 for free prompts</p>
          </div>

          {error && (
            <p className="text-xs text-destructive font-medium">{error}</p>
          )}
        </div>

        {/* Submit */}
        <div className="px-5 py-4 border-t border-border bg-card safe-bottom">
          <Button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !promptText.trim()}
            className="w-full h-12 rounded-xl font-semibold text-sm"
          >
            {submitting ? 'Publishing...' : (
              <>
                <Upload size={16} />
                {price > 0 ? `Publish for ${price} credits` : 'Publish for Free'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
