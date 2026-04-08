import { ArrowLeft, User, Bell, Shield, Palette, Globe, CreditCard, HelpCircle, LogOut, ChevronRight, Info, FileText, Mail, Sun, Moon, Monitor, Save, Lock, Eye, EyeOff, Download } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useAppState } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
interface SettingsScreenProps {
  onBack: () => void;
}

type ThemeMode = 'dark' | 'light' | 'system';

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  let effectiveTheme: 'dark' | 'light' = 'dark';

  if (mode === 'system') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    effectiveTheme = mode;
  }

  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  localStorage.setItem('qpixa-theme', mode);
}

function getStoredTheme(): ThemeMode {
  return (localStorage.getItem('qpixa-theme') as ThemeMode) || 'dark';
}

const sections = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'language', label: 'Language', icon: Globe },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'install', label: 'Install App', icon: Download },
  { id: 'feedback', label: 'Send Feedback', icon: Mail },
  { id: 'help', label: 'Help & Support', icon: HelpCircle },
  { id: 'legal', label: 'Legal & About', icon: Info },
];

const themeOptions: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'system', label: 'System default', icon: Monitor },
];

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { signOut, profile, refreshProfile, isLoggedIn } = useAppState();
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const [showTheme, setShowTheme] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('qpixa-notif') !== 'false');
  const [activityStatus, setActivityStatus] = useState(() => localStorage.getItem('qpixa-activity') !== 'false');
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private'>(() => (localStorage.getItem('qpixa-visibility') as any) || 'public');
  const [language, setLanguage] = useState(() => localStorage.getItem('qpixa-lang') || 'en');
  
  // PWA Install
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.info('App is already installed or not supported on this browser.');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };
  
  // Account editing
  const [editUsername, setEditUsername] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  
  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // Load profile data into edit fields
  useEffect(() => {
    if (profile) {
      setEditUsername(profile.username || '');
      setEditDisplayName(profile.display_name || '');
      setEditBio(profile.bio || '');
      setEditAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  // Apply theme on mount and listen for system changes
  useEffect(() => {
    applyTheme(theme);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (theme === 'system') applyTheme('system'); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !profile) return;
    const file = e.target.files[0];
    
    // Check if it's a mock project
    if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder-project.supabase.co') {
      toast.error('Avatar upload is not available in demo mode');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setEditAvatarUrl(data.publicUrl);
      toast.success('Avatar uploaded successfully! Click Save Changes to apply.');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Error uploading avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveProfile = async () => {
    if (!isLoggedIn || !profile?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editUsername.trim() || null,
          display_name: editDisplayName.trim() || null,
          bio: editBio.trim() || null,
          avatar_url: editAvatarUrl || null,
        })
        .eq('id', profile?.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Profile updated!');
    } catch (err: any) {
      console.error('Profile update error:', err);
      if (err.code === '23505') {
        toast.error('Username is already taken');
      } else {
        toast.error('Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (t: ThemeMode) => {
    setTheme(t);
    applyTheme(t);
  };

  const toggleNotif = () => {
    const val = !notifEnabled;
    setNotifEnabled(val);
    localStorage.setItem('qpixa-notif', val.toString());
  };

  const toggleActivity = () => {
    const val = !activityStatus;
    setActivityStatus(val);
    localStorage.setItem('qpixa-activity', val.toString());
  };

  const toggleVisibility = () => {
    const val = profileVisibility === 'public' ? 'private' : 'public';
    setProfileVisibility(val);
    localStorage.setItem('qpixa-visibility', val);
  };

  const changeLanguage = (langId: string, langLabel: string) => {
    setLanguage(langId);
    localStorage.setItem('qpixa-lang', langId);
    toast.success(`Language set to ${langLabel}`);
  };

  const handleLogout = async () => {
    await signOut();
    onBack();
  };

  const handleSectionClick = (id: string) => {
    if (id === 'theme') {
      setShowTheme(!showTheme);
      return;
    }
    setActiveSection(activeSection === id ? null : id);
  };

  const touchStartX = React.useRef(0);
  const touchStartY = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    
    if (deltaX > 80 && deltaY < 50) {
      onBack();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[70] bg-background overflow-y-auto scrollbar-hide"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onBack}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="text-base font-bold text-foreground">Settings</h1>
      </div>

      <div className="px-4 space-y-1 pb-8">
        {sections.map(({ id, label, icon: Icon }) => (
          <div key={id}>
            <button
              onClick={() => handleSectionClick(id)}
              className="flex items-center justify-between w-full py-3.5 px-3 rounded-xl hover:bg-card transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
              <ChevronRight size={16} className={`text-muted-foreground transition-transform ${(activeSection === id || (id === 'theme' && showTheme)) ? 'rotate-90' : ''}`} />
            </button>

            {/* Theme sub-section */}
            {id === 'theme' && showTheme && (
              <div className="ml-10 space-y-1 py-2">
                {themeOptions.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={`w-full text-left py-2.5 px-3 rounded-lg text-sm flex items-center gap-2.5 ${
                      theme === t.id ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <t.icon size={16} />
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* Account section */}
            {id === 'account' && activeSection === 'account' && (
              <div className="ml-10 mr-3 mb-2 p-4 bg-card border border-border rounded-xl space-y-3">
                {isLoggedIn ? (
                  <>
                    <div className="flex flex-col items-center mb-4">
                      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-secondary border border-border mb-2">
                        {editAvatarUrl ? (
                          <img src={editAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <User size={32} />
                          </div>
                        )}
                        {uploadingAvatar && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <label className="text-xs text-primary font-medium cursor-pointer hover:underline">
                        Change Picture
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleAvatarUpload}
                          disabled={uploadingAvatar}
                        />
                      </label>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-medium">Username</label>
                      <input
                        value={editUsername}
                        onChange={e => setEditUsername(e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary transition-colors"
                        placeholder="username"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-medium">Display Name</label>
                      <input
                        value={editDisplayName}
                        onChange={e => setEditDisplayName(e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary transition-colors"
                        placeholder="Display Name"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-medium">Bio</label>
                      <textarea
                        value={editBio}
                        onChange={e => setEditBio(e.target.value)}
                        rows={2}
                        className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary transition-colors resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>

                    {/* Change Password */}
                    <div className="border-t border-border pt-3 mt-3">
                      <p className="text-[10px] text-muted-foreground font-medium mb-2">Change Password</p>
                      <div className="space-y-2">
                        <div className="relative">
                          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type={showNewPw ? 'text' : 'password'}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="New password (min 6 chars)"
                            className="w-full pl-9 pr-9 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary transition-colors"
                          />
                          <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        <button
                          onClick={async () => {
                            if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
                            setChangingPw(true);
                            const { error } = await supabase.auth.updateUser({ password: newPassword });
                            setChangingPw(false);
                            if (error) { toast.error(error.message); return; }
                            toast.success('Password updated!');
                            setNewPassword('');
                          }}
                          disabled={changingPw || newPassword.length < 6}
                          className="w-full py-2 rounded-lg bg-secondary text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 hover:bg-muted transition-colors"
                        >
                          <Lock size={12} /> {changingPw ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">Sign in to edit your account</p>
                )}
              </div>
            )}

            {/* Language section */}
            {id === 'language' && activeSection === 'language' && (
              <div className="ml-10 mr-3 mb-2 p-4 bg-card border border-border rounded-xl space-y-1">
                {[
                  { id: 'en', label: 'English' },
                  { id: 'hi', label: 'हिन्दी (Hindi)' },
                  { id: 'es', label: 'Español' },
                  { id: 'ar', label: 'العربية (Arabic)' },
                ].map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => changeLanguage(lang.id, lang.label)}
                    className={`w-full text-left py-2.5 px-3 rounded-lg text-sm ${
                      language === lang.id ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}

            {/* Install section */}
            {id === 'install' && activeSection === 'install' && (
              <div className="ml-10 mr-3 mb-2 p-4 bg-card border border-border rounded-xl space-y-3">
                <p className="text-xs text-muted-foreground">Install Qpixa on your home screen for a better experience, faster loading, and offline access.</p>
                <button
                  onClick={handleInstall}
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Download size={14} /> Install Now
                </button>
              </div>
            )}
            {id === 'subscription' && activeSection === 'subscription' && (
              <div className="ml-10 mr-3 mb-2 p-4 bg-card border border-border rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">Current Plan</p>
                  <span className="text-xs font-bold text-primary capitalize">{profile?.subscription_plan || 'Free'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">Credits</p>
                  <span className="text-xs font-bold text-foreground">{profile?.credits ?? 0}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Upgrade to Pro for unlimited generations and no ads.</p>
              </div>
            )}

            {id === 'notifications' && activeSection === 'notifications' && (
              <div className="ml-10 mr-3 mb-2 p-4 bg-card border border-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-foreground">Push Notifications</p>
                    <p className="text-[10px] text-muted-foreground">Receive push notifications</p>
                  </div>
                  <button
                    onClick={toggleNotif}
                    className={`w-11 h-6 rounded-full relative transition-colors ${notifEnabled ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notifEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            )}

            {/* Legal & About section */}
            {id === 'legal' && activeSection === 'legal' && (
              <div className="ml-10 mr-3 mb-2 p-4 bg-card border border-border rounded-xl space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-foreground px-1">Information</h3>
                  <div className="grid grid-cols-1 gap-1">
                    <button 
                      onClick={() => setActiveSection('about_detail')}
                      className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Info size={14} className="text-muted-foreground" />
                        <span className="text-xs">About Qpixa</span>
                      </div>
                      <ChevronRight size={12} className="text-muted-foreground" />
                    </button>
                    <button 
                      onClick={() => setActiveSection('contact_detail')}
                      className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-muted-foreground" />
                        <span className="text-xs">Contact Us</span>
                      </div>
                      <ChevronRight size={12} className="text-muted-foreground" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-foreground px-1">Legal</h3>
                  <div className="grid grid-cols-1 gap-1">
                    <button 
                      onClick={() => setActiveSection('privacy_detail')}
                      className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-muted-foreground" />
                        <span className="text-xs">Privacy Policy</span>
                      </div>
                      <ChevronRight size={12} className="text-muted-foreground" />
                    </button>
                    <button 
                      onClick={() => setActiveSection('terms_detail')}
                      className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-muted-foreground" />
                        <span className="text-xs">Terms of Service</span>
                      </div>
                      <ChevronRight size={12} className="text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground text-center pt-2">© 2026 Qpixa. All rights reserved.</p>
              </div>
            )}

            {/* About Detail */}
            {activeSection === 'about_detail' && id === 'legal' && (
              <div className="ml-10 mr-3 mb-2 p-4 bg-card border border-border rounded-xl space-y-3">
                <button onClick={() => setActiveSection('legal')} className="flex items-center gap-1 text-[10px] text-primary font-bold mb-2">
                  <ArrowLeft size={10} /> Back
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">Q</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Qpixa</h3>
                    <p className="text-[10px] text-muted-foreground">Version 1.0.0</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Qpixa is an AI-powered image generation and sharing platform where creators can generate, share, and sell AI art prompts.
                </p>
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-semibold text-foreground">Developer</p>
                  <p className="text-xs text-muted-foreground mt-1">Om Prakash Seth</p>
                </div>
              </div>
            )}

            {/* Contact Detail */}
            {activeSection === 'contact_detail' && id === 'legal' && (
              <div className="ml-10 mr-3 mb-2 p-4 bg-card border border-border rounded-xl space-y-3">
                <button onClick={() => setActiveSection('legal')} className="flex items-center gap-1 text-[10px] text-primary font-bold mb-2">
                  <ArrowLeft size={10} /> Back
                </button>
                <h3 className="text-sm font-bold text-foreground">Contact Us</h3>
                <p className="text-xs text-muted-foreground">Reach out to us for any queries or feedback.</p>
                <div className="flex items-center gap-2 p-3 bg-secondary rounded-xl">
                  <Mail size={14} className="text-primary" />
                  <span className="text-xs text-foreground">support@qpixa.com</span>
                </div>
              </div>
            )}

            {/* Privacy Detail */}
            {activeSection === 'privacy_detail' && id === 'legal' && (
              <div className="ml-10 mr-3 mb-2 p-4 bg-card border border-border rounded-xl space-y-3 max-h-[400px] overflow-y-auto">
                <button onClick={() => setActiveSection('legal')} className="flex items-center gap-1 text-[10px] text-primary font-bold mb-2">
                  <ArrowLeft size={10} /> Back
                </button>
                <h3 className="text-sm font-bold text-foreground">Privacy Policy</h3>
                <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                  <p>We collect information you provide directly: account details, content you create, and usage data to improve our services.</p>
                  <p>Your data is securely stored using industry-standard encryption.</p>
                  <p>For privacy concerns, contact us at: <span className="text-primary">support@qpixa.com</span></p>
                </div>
              </div>
            )}

            {/* Terms Detail */}
            {activeSection === 'terms_detail' && id === 'legal' && (
              <div className="ml-10 mr-3 mb-2 p-4 bg-card border border-border rounded-xl space-y-3 max-h-[400px] overflow-y-auto">
                <button onClick={() => setActiveSection('legal')} className="flex items-center gap-1 text-[10px] text-primary font-bold mb-2">
                  <ArrowLeft size={10} /> Back
                </button>
                <h3 className="text-sm font-bold text-foreground">Terms of Service</h3>
                <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                  <p>By using Qpixa, you agree to be bound by these Terms of Service.</p>
                  <p>You retain ownership of the content you create.</p>
                  <p>Users are prohibited from generating or sharing content that is illegal or harmful.</p>
                </div>
              </div>
            )}

            {/* Privacy & Security section */}
            {id === 'privacy' && activeSection === 'privacy' && (
              <div className="ml-10 mr-3 mb-2 p-4 bg-card border border-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-foreground">Profile Visibility</p>
                    <p className="text-[10px] text-muted-foreground">Control who can see your profile</p>
                  </div>
                  <button
                    onClick={toggleVisibility}
                    className="text-[10px] text-primary font-semibold px-2 py-1 rounded bg-primary/10"
                  >
                    {profileVisibility === 'public' ? 'Public' : 'Private'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-foreground">Show Activity Status</p>
                    <p className="text-[10px] text-muted-foreground">Let others see when you're online</p>
                  </div>
                  <button
                    onClick={toggleActivity}
                    className={`w-11 h-6 rounded-full relative transition-colors ${activityStatus ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${activityStatus ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            )}

            {/* Help section */}
            {id === 'help' && activeSection === 'help' && (
              <div className="ml-10 mr-3 mb-2 p-4 bg-card border border-border rounded-xl space-y-2">
                <p className="text-xs text-muted-foreground">Need help? Check our FAQ or reach out to us.</p>
                <div className="space-y-2">
                  <div className="p-2 bg-secondary rounded-lg">
                    <p className="text-xs font-medium text-foreground">How to generate images?</p>
                    <p className="text-[10px] text-muted-foreground">Go to Studio tab, enter a prompt and tap Generate.</p>
                  </div>
                  <div className="p-2 bg-secondary rounded-lg">
                    <p className="text-xs font-medium text-foreground">How to earn credits?</p>
                    <p className="text-[10px] text-muted-foreground">Watch rewarded ads or sell prompts in the marketplace.</p>
                  </div>
                  <div className="p-2 bg-secondary rounded-lg">
                    <p className="text-xs font-medium text-foreground">How to sell prompts?</p>
                    <p className="text-[10px] text-muted-foreground">Go to Marketplace, tap + to list your prompt for sale.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Feedback section */}
            {id === 'feedback' && activeSection === 'feedback' && (
              <div className="ml-10 mr-3 mb-2 p-4 bg-card border border-border rounded-xl space-y-3">
                <p className="text-xs text-muted-foreground">Tell us what you think. We read every message.</p>
                <textarea
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground outline-none resize-none"
                  placeholder="Your feedback..."
                />
                <button
                  onClick={async () => {
                    if (!feedbackText.trim() || !profile) return;
                    setSendingFeedback(true);
                    const { error } = await supabase.from('feedback').insert({ user_id: profile.id, message: feedbackText.trim() });
                    setSendingFeedback(false);
                    if (error) { toast.error('Failed to send'); return; }
                    toast.success('Feedback sent! Thank you 🙏');
                    setFeedbackText('');
                  }}
                  disabled={sendingFeedback || !feedbackText.trim()}
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
                >
                  {sendingFeedback ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>
            )}
          </div>
        ))}

        <div className="pt-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full py-3.5 px-3 rounded-xl hover:bg-card transition-colors"
          >
            <LogOut size={18} className="text-destructive" />
            <span className="text-sm font-medium text-destructive">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}