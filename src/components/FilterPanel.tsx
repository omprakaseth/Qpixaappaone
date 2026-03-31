import { X, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
}

export interface FilterState {
  style: string;
  popularity: string;
  time: string;
}

const styleOptions = ['All', 'Cinematic', 'Photorealistic', 'Digital Art', 'Oil Painting', 'Watercolor', 'Pixel Art'];
const popularityOptions = ['All', 'Most Liked', 'Most Viewed', 'Most Saved'];
const timeOptions = ['All Time', 'Today', 'This Week', 'This Month'];

export default function FilterPanel({ open, onClose, onApply }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterState>({
    style: 'All', popularity: 'All', time: 'All Time',
  });

  if (!open) return null;

  const FilterSection = ({ label, options, value, field }: { label: string; options: string[]; value: string; field: keyof FilterState }) => (
    <div className="mb-5">
      <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => setFilters(f => ({ ...f, [field]: opt }))}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              value === opt
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] bg-black/60" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl p-5 max-h-[70vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">Filters</h2>
          <button onClick={onClose} className="text-muted-foreground"><X size={20} /></button>
        </div>
        <FilterSection label="Style" options={styleOptions} value={filters.style} field="style" />
        <FilterSection label="Popularity" options={popularityOptions} value={filters.popularity} field="popularity" />
        <FilterSection label="Time" options={timeOptions} value={filters.time} field="time" />
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setFilters({ style: 'All', popularity: 'All', time: 'All Time' })}
            className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold"
          >
            Reset
          </button>
          <button
            onClick={() => { onApply(filters); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
