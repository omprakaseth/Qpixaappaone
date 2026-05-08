import React, { useState, useRef } from 'react';
import { X, Camera, Loader2, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ImageCropper from './ImageCropper';

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
  
  // Cropper states
  const [cropMode, setCropMode] = useState<'avatar' | 'cover' | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverProgress, setCoverProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const initial = (displayName || username || 'U').charAt(0).toUpperCase();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, mode: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setTempImageUrl(reader.result as string);
      setCropMode(mode);
    };
    reader.readAsDataURL(file);
    
    // Reset input value to allow selecting same file again
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const mode = cropMode;
    setCropMode(null);
    setTempImageUrl(null);

    if (mode === 'avatar') {
      await uploadAvatar(croppedBlob);
    } else {
      await uploadCover(croppedBlob);
    }
  };

  const uploadAvatar = async (file: Blob | File) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => prev >= 90 ? 90 : prev + 10);
      }, 200);

      const path = `${profile.id}/avatar-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('avatars').upload(path, file, { 
        contentType: 'image/jpeg',
        upsert: true 
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      // Add timestamp to bust cache
      const finalUrl = `${data.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(finalUrl);
      toast.success('Profile photo ready!');
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      toast.error('Avatar upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadCover = async (file: Blob | File) => {
    setUploadingCover(true);
    setCoverProgress(0);
    try {
      const progressInterval = setInterval(() => {
        setCoverProgress(prev => prev >= 90 ? 90 : prev + 10);
      }, 200);

      const path = `${profile.id}/cover-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('avatars').upload(path, file, { 
        contentType: 'image/jpeg',
        upsert: true 
      });
      
      clearInterval(progressInterval);
      setCoverProgress(100);

      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      // Add timestamp to bust cache
      const finalUrl = `${data.publicUrl}?t=${Date.now()}`;
      setCoverUrl(finalUrl);
      toast.success('Cover photo ready!');
    } catch (err: any) {
       console.error('Cover upload error:', err);
      toast.error('Cover upload failed');
    } finally {
      setUploadingCover(false);
      setCoverProgress(0);
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }
    setSaving(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      const updateData: any = {
        username: username.trim(),
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl || null,
        cover_url: coverUrl || null,
      };

      console.log('Finalizing profile update:', updateData);

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', currentUser.id);
        
      if (error) throw error;

      toast.success('Profile updated successfully!');
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Profile update error:', err);
      if (err.code === '23505') {
        toast.error('Username already exists');
      } else {
        toast.error(`Update failed: ${err.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-bottom duration-200">
      {/* Cropper Modal Injection */}
      {cropMode && tempImageUrl && (
        <ImageCropper
          image={tempImageUrl}
          aspect={cropMode === 'avatar' ? 1 : 2.5} // 2.5:1 for cover
          circular={cropMode === 'avatar'}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setCropMode(null);
            setTempImageUrl(null);
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={onClose} className="text-sm text-muted-foreground">Cancel</button>
        <h2 className="text-sm font-bold text-foreground">Edit Profile</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-bold text-primary disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Cover Photo Section */}
        <div className="relative h-[130px] w-full overflow-hidden bg-secondary">
          <img
            src={(coverUrl ? `${coverUrl}${coverUrl.includes('?') ? '&' : '?'}t=${Date.now()}` : 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80')}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <button
              onClick={() => coverFileRef.current?.click()}
              disabled={uploadingCover}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 text-foreground text-[11px] font-semibold shadow-lg active:scale-95 transition-transform"
            >
              {uploadingCover ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 size={13} className="animate-spin" />
                  <span>{coverProgress}%</span>
                </div>
              ) : (
                <>
                  <ImageIcon size={13} />
                  Change Cover
                </>
              )}
            </button>
          </div>
          <input
            ref={coverFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'cover')}
          />
        </div>

        {/* Avatar section */}
        <div className="flex flex-col items-center py-6 -mt-10">
          <div className="relative">
            <div className="w-24 h-24 rounded-full p-1 bg-background shadow-xl">
              <div className="w-full h-full rounded-full overflow-hidden bg-secondary flex items-center justify-center">
                {avatarUrl ? (
                  <img 
                    src={`${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}t=${Date.now()}`} 
                    alt="" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-3xl font-bold text-secondary-foreground">{initial}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg border-2 border-background active:scale-90 transition-transform"
            >
              {uploading ? (
                <Loader2 size={14} className="text-primary-foreground animate-spin" />
              ) : (
                <Camera size={14} className="text-primary-foreground" />
              )}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'avatar')}
          />
          <p className="text-[10px] text-muted-foreground mt-2 font-medium">Recommended: Square Photo</p>
        </div>

        {/* Fields */}
        <div className="px-4 space-y-4 py-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase px-1">Display Name</label>
            <div className="bg-secondary/40 rounded-xl px-4 py-3 border border-border/50 focus-within:border-primary/50 transition-colors">
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full text-sm text-foreground bg-transparent outline-none"
                placeholder="Ex: John Doe"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase px-1">Username</label>
            <div className="bg-secondary/40 rounded-xl px-4 py-3 border border-border/50 focus-within:border-primary/50 transition-colors flex items-center gap-1.5">
              <span className="text-muted-foreground text-sm">@</span>
              <input
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                className="w-full text-sm text-foreground bg-transparent outline-none"
                placeholder="username"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Bio</label>
              <span className="text-[10px] text-muted-foreground">{bio.length}/150</span>
            </div>
            <div className="bg-secondary/40 rounded-xl px-4 py-3 border border-border/50 focus-within:border-primary/50 transition-colors">
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={150}
                rows={4}
                className="w-full text-sm text-foreground bg-transparent outline-none resize-none"
                placeholder="Share your story or social links..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

