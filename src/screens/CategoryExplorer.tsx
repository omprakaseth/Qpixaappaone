import { X } from 'lucide-react';

interface CategoryExplorerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (category: string) => void;
  activeCategory: string;
}

const explorerCategories = [
  { id: 'Trending', label: 'Trending', emoji: '🔥' },
  { id: 'Portrait', label: 'Portrait', emoji: '🧑' },
  { id: 'Anime', label: 'Anime', emoji: '🎌' },
  { id: 'Cars', label: 'Cars', emoji: '🚗' },
  { id: 'Nature', label: 'Nature', emoji: '🌿' },
  { id: 'Cyberpunk', label: 'Cyberpunk', emoji: '🌆' },
  { id: 'Fantasy', label: 'Fantasy', emoji: '🐉' },
  { id: 'Space', label: 'Space', emoji: '🚀' },
  { id: 'Shorts', label: 'Shorts', emoji: '🎬' },
  { id: 'Characters', label: 'Characters', emoji: '🧙' },
  { id: 'Landscape', label: 'Landscape', emoji: '🏔️' },
];

export default function CategoryExplorer({ open, onClose, onSelect, activeCategory }: CategoryExplorerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-background">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-bold text-foreground">Categories</h1>
        <button onClick={onClose}><X size={22} className="text-foreground" /></button>
      </div>
      <div className="px-4 pb-8 overflow-y-auto h-[calc(100%-56px)] scrollbar-hide">
        <div className="grid grid-cols-3 gap-3">
          {explorerCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { onSelect(cat.id); onClose(); }}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-colors ${
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-foreground'
              }`}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-xs font-semibold">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
