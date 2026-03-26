import { Save, Share2, Copy, Flag } from 'lucide-react';
import { useSwipeDismiss } from '@/hooks/useSwipeDismiss';

interface QuickActionsProps {
  open: boolean;
  onClose: () => void;
  onAction: (action: 'save' | 'share' | 'copy' | 'report') => void;
}

export default function QuickActions({ open, onClose, onAction }: QuickActionsProps) {
  const { dragHandleProps, style: swipeStyle, opacity: backdropOpacity } = useSwipeDismiss({ onDismiss: onClose });

  if (!open) return null;

  const actions = [
    { id: 'save' as const, label: 'Save', icon: Save },
    { id: 'share' as const, label: 'Share', icon: Share2 },
    { id: 'copy' as const, label: 'Copy Prompt', icon: Copy },
    { id: 'report' as const, label: 'Report', icon: Flag },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-black/60" style={{ opacity: backdropOpacity }} onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl pt-2 pb-4 px-4"
        style={swipeStyle}
        onClick={e => e.stopPropagation()}
      >
        {/* Swipe Handle */}
        <div className="flex justify-center pb-2 cursor-grab active:cursor-grabbing" {...dragHandleProps}>
          <div className="w-10 h-1 rounded-full bg-muted-foreground/40" />
        </div>

        {actions.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { onAction(id); onClose(); }}
            className="flex items-center gap-3 w-full py-3 px-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            <Icon size={20} className="text-muted-foreground" />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
