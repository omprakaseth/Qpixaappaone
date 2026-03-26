import { Gift } from 'lucide-react';

interface RewardButtonProps {
  onClick: () => void;
}

export default function RewardButton({ onClick }: RewardButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-[130px] right-3 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse"
      title="Watch ad for free credits"
    >
      <Gift size={20} />
    </button>
  );
}
