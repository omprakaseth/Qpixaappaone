import React, { useState, useRef } from 'react';
import { X, Camera, Loader2, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  cover_url: string | null;
}

interface EditProfileSheetProps {
  profile: Profile;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditProfileSheet({ profile, onClose, onSaved }: EditProfileSheetProps) {
  const [username, setUsername] = useState(profile.username || '');
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [coverUrl, setCoverUrl] = useState(profile.cover_url || '');
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const initial = (displayName || username || 'U').charAt(0).toUpperCase();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      toast.success('Photo uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Cover image must be under 5MB');
      return;
    }
    setUploadingCover(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${profile.id}/cover-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setCoverUrl(data.publicUrl);
      toast.success('Cover uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl || null,
          cover_url: coverUrl || null,
        })
        .eq('id', profile.id);
      if (error) throw error;
      toast.success('Profile updated!');
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Profile update error:', err);
      if (err.code === '23505') {
        toast.error('Username is already taken');
      } else {
        toast.error('Failed to save profile');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-bottom duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={onClose} className="text-sm text-muted-foreground">Cancel</button>
        <h2 className="text-sm font-bold text-foreground">Edit Profile</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-bold text-primary disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : 'Done'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Cover Photo Section */}
        <div className="relative h-[120px] w-full overflow-hidden bg-secondary">
          <img
            src={coverUrl || '/default-cover.jpg'}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <button
              onClick={() => coverFileRef.current?.click()}
              disabled={uploadingCover}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 text-foreground text-[11px] font-semibold"
            >
              {uploadingCover ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <ImageIcon size={13} />
              )}
              Change Cover
            </button>
          </div>
          <input
            ref={coverFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverUpload}
          />
        </div>

        {/* Avatar section */}
        <div className="flex flex-col items-center py-6 -mt-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-secondary">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-secondary-foreground">{initial}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg"
            >
              {uploading ? (
                <Loader2 size={13} className="text-primary-foreground animate-spin" />
              ) : (
                <Camera size={13} className="text-primary-foreground" />
              )}
            </button>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs font-semibold text-primary mt-2"
          >
            Change Photo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>

        {/* Fields */}
        <div className="px-4 space-y-0">
          <div className="flex items-center py-3 border-t border-border">
            <label className="w-24 text-xs text-muted-foreground flex-shrink-0">Username</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="flex-1 text-sm text-foreground bg-transparent outline-none"
              placeholder="username"
            />
          </div>
          <div className="flex items-center py-3 border-t border-border">
            <label className="w-24 text-xs text-muted-foreground flex-shrink-0">Name</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="flex-1 text-sm text-foreground bg-transparent outline-none"
              placeholder="Display name"
            />
          </div>
          <div className="flex items-start py-3 border-t border-b border-border">
            <label className="w-24 text-xs text-muted-foreground flex-shrink-0 pt-0.5">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={150}
              rows={3}
              className="flex-1 text-sm text-foreground bg-transparent outline-none resize-none"
              placeholder="Tell about yourself..."
            />
          </div>
          <p className="text-right text-[10px] text-muted-foreground pt-1">{bio.length}/150</p>
        </div>
      </div>
    </div>
  );
}
