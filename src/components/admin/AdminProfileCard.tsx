import { useState } from 'react';
import { Eye, EyeOff, Lock, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminProfileCardProps {
  email: string;
  isSuperAdmin: boolean;
}

export default function AdminProfileCard({ email, isSuperAdmin }: AdminProfileCardProps) {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword.trim() || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-3 border-t border-border">
      <div className="bg-secondary rounded-lg p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
            {email.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{email}</p>
            <p className="text-[10px] text-muted-foreground">{isSuperAdmin ? 'Super Admin' : 'Admin'}</p>
          </div>
        </div>

        {!showChangePassword ? (
          <button
            onClick={() => setShowChangePassword(true)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
          >
            <Lock size={14} />
            Change Password
          </button>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full bg-background rounded-md px-3 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full bg-background rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleChangePassword}
                disabled={saving}
                className="flex-1 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Check size={12} />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => { setShowChangePassword(false); setNewPassword(''); setConfirmPassword(''); }}
                className="px-3 py-1.5 rounded-md bg-background text-muted-foreground text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
