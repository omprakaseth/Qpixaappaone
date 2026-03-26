import { X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export interface MarketplaceFilters {
  product: string;
  type: string;
  price: string;
  model: string;
}

const defaultFilters: MarketplaceFilters = {
  product: 'all',
  type: 'all',
  price: 'all',
  model: 'all',
};

interface MarketplaceFilterPanelProps {
  open: boolean;
  onClose: () => void;
  filters: MarketplaceFilters;
  onApply: (filters: MarketplaceFilters) => void;
}

const productOptions = [
  { value: 'all', label: 'All' },
  { value: 'prompts', label: 'Prompts' },
  { value: 'bundles', label: 'Bundles' },
];

const typeOptions = [
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Image' },
  { value: 'text', label: 'Text' },
  { value: 'video', label: 'Video' },
];

const priceOptions = [
  { value: 'all', label: 'All' },
  { value: 'free', label: 'Free prompts only' },
  { value: 'paid', label: 'Paid prompts only' },
];

const modelOptions = [
  { value: 'all', label: 'All' },
  { value: 'Gemini Image', label: 'Gemini Image' },
  { value: 'DALL-E', label: 'DALL·E' },
  { value: 'Midjourney', label: 'Midjourney' },
  { value: 'Stable Diff.', label: 'Stable Diffusion' },
  { value: 'FLUX', label: 'FLUX' },
];

function FilterSection({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      <RadioGroup value={value} onValueChange={onChange} className="gap-2.5">
        {options.map(opt => (
          <div key={opt.value} className="flex items-center gap-3">
            <RadioGroupItem value={opt.value} id={`${title}-${opt.value}`} />
            <Label
              htmlFor={`${title}-${opt.value}`}
              className="text-sm text-foreground/80 cursor-pointer font-normal"
            >
              {opt.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

export default function MarketplaceFilterPanel({
  open,
  onClose,
  filters,
  onApply,
}: MarketplaceFilterPanelProps) {
  const handleChange = (field: keyof MarketplaceFilters, value: string) => {
    onApply({ ...filters, [field]: value });
  };

  const handleReset = () => {
    onApply(defaultFilters);
  };

  const activeCount = Object.values(filters).filter(v => v !== 'all').length;

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="left" className="w-[280px] bg-card border-r border-border p-0 flex flex-col">
        <SheetHeader className="px-4 pt-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-bold text-foreground">Filters</SheetTitle>
            {activeCount > 0 && (
              <button
                onClick={handleReset}
                className="text-xs text-primary font-medium"
              >
                Reset all
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
          <FilterSection
            title="Product"
            options={productOptions}
            value={filters.product}
            onChange={v => handleChange('product', v)}
          />
          <FilterSection
            title="Type"
            options={typeOptions}
            value={filters.type}
            onChange={v => handleChange('type', v)}
          />
          <FilterSection
            title="Price"
            options={priceOptions}
            value={filters.price}
            onChange={v => handleChange('price', v)}
          />
          <FilterSection
            title="Model"
            options={modelOptions}
            value={filters.model}
            onChange={v => handleChange('model', v)}
          />
        </div>

        <div className="px-4 py-4 border-t border-border">
          <Button onClick={onClose} className="w-full h-10 rounded-xl font-semibold text-sm">
            Show Results
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { defaultFilters };
