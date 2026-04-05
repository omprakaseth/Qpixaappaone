import { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function AdminCredits({ setHasUnsavedChanges }: { setHasUnsavedChanges?: (val: boolean) => void }) {
  const [totalCredits, setTotalCredits] = useState(0);
  const [avgCredits, setAvgCredits] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('profiles').select('credits');
      if (data) {
        const total = data.reduce((sum: number, p: any) => sum + (p.credits || 0), 0);
        setTotalCredits(total);
        setAvgCredits(data.length ? Math.round(total / data.length) : 0);
      }
    };
    fetch();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-6">Credits Management</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Total Credits in System</span>
            <Coins size={20} className="text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">{totalCredits}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Average Credits per User</span>
            <Coins size={20} className="text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">{avgCredits}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">To add credits to a specific user, go to Users Management and use the + button.</p>
    </div>
  );
}
