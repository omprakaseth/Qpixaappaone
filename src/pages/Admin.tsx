import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Flag, Coins, ArrowLeft, Shield, BarChart3, Bell, Settings, Megaphone, Zap, Menu, X, ShieldCheck, ChevronLeft } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminContent from '@/components/admin/AdminContent';
import AdminReports from '@/components/admin/AdminReports';
import AdminCredits from '@/components/admin/AdminCredits';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import AdminNotifications from '@/components/admin/AdminNotifications';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminPrompts from '@/components/admin/AdminPrompts';
import AdminStudioAPI from '@/components/admin/AdminStudioAPI';
import AdminAdsManager from '@/components/admin/AdminAdsManager';
import AdminManagement from '@/components/admin/AdminManagement';
import AdminProfileCard from '@/components/admin/AdminProfileCard';

const ALL_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'content', label: 'Posts', icon: FileText },
  { id: 'prompts', label: 'Prompts', icon: Megaphone },
  { id: 'reports', label: 'Reports', icon: Flag },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'studio-api', label: 'Studio API', icon: Zap },
  { id: 'ads', label: 'Ads Manager', icon: Coins },
  { id: 'credits', label: 'Credits', icon: Coins },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Admin() {
  const { isAdmin, isSuperAdmin, loading, user, recheck } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'dashboard';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [allowedTabs, setAllowedTabs] = useState<string[]>(ALL_TABS.map(t => t.id));
  const [permsLoaded, setPermsLoaded] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const scrollPositions = useRef<Record<string, number>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleHashChange = (e: HashChangeEvent) => {
      if (hasUnsavedChanges) {
        // Revert URL temporarily
        const oldURL = new URL(e.oldURL);
        window.history.replaceState(null, '', oldURL.hash || '#dashboard');
        
        const newHash = new URL(e.newURL).hash.replace('#', '');
        setPendingTab(newHash || 'dashboard');
        setShowConfirmDialog(true);
        return;
      }
      
      // Save scroll position for current tab before switching
      if (contentRef.current) {
        scrollPositions.current[activeTab] = contentRef.current.scrollTop;
      }

      const hash = window.location.hash.replace('#', '');
      const nextTab = hash || 'dashboard';
      setActiveTab(nextTab);
      
      // Restore scroll position
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = scrollPositions.current[nextTab] || 0;
        }
      }, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [hasUnsavedChanges, activeTab]);

  useEffect(() => {
    const loadPerms = async () => {
      if (isSuperAdmin || !user) {
        setAllowedTabs(ALL_TABS.map(t => t.id));
        setPermsLoaded(true);
        return;
      }
      const { data } = await supabase
        .from('admin_permissions')
        .select('allowed_tabs')
        .eq('user_id', user.id)
        .single();
      if (data?.allowed_tabs) {
        setAllowedTabs(data.allowed_tabs);
      } else {
        setAllowedTabs(ALL_TABS.map(t => t.id));
      }
      setPermsLoaded(true);
    };
    if (isAdmin) loadPerms();
  }, [isAdmin, isSuperAdmin, user]);

  const tabs = [
    ...ALL_TABS.filter(t => isSuperAdmin || allowedTabs.includes(t.id)),
    ...(isSuperAdmin ? [{ id: 'admin-mgmt', label: 'Admin Mgmt', icon: ShieldCheck }] : []),
  ];

  if (loading || (isAdmin && !permsLoaded)) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminLogin onSuccess={recheck} />;
  }

  const handleNavigate = (tab: string) => {
    if (hasUnsavedChanges) {
      setPendingTab(tab);
      setShowConfirmDialog(true);
      return;
    }
    if (isSuperAdmin || allowedTabs.includes(tab)) {
      window.location.hash = tab;
    }
  };

  const handleBack = () => {
    const hash = window.location.hash.replace('#', '');
    if (hash && hash !== 'dashboard') {
      // If we are on a sub-tab, go back in history
      window.history.back();
      // If history back didn't change the hash (e.g. first page), go to dashboard
      setTimeout(() => {
        if (window.location.hash.replace('#', '') === hash) {
          handleNavigate('dashboard');
        }
      }, 50);
    } else {
      // If already on dashboard or no hash, go to app
      navigate('/');
    }
  };

  const confirmNavigation = () => {
    setHasUnsavedChanges(false);
    setShowConfirmDialog(false);
    if (pendingTab) {
      window.location.hash = pendingTab;
      setPendingTab(null);
    }
  };

  const cancelNavigation = () => {
    setShowConfirmDialog(false);
    setPendingTab(null);
  };

  const renderContent = () => {
    if (!isSuperAdmin && activeTab !== 'dashboard' && !allowedTabs.includes(activeTab)) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Shield size={40} className="text-muted-foreground mb-3" />
          <p className="text-foreground font-semibold">Access Restricted</p>
          <p className="text-sm text-muted-foreground mt-1">You don't have permission to access this section.</p>
        </div>
      );
    }

    const commonProps = { setHasUnsavedChanges };

    switch (activeTab) {
      case 'dashboard': return <AdminDashboard onNavigate={handleNavigate} />;
      case 'users': return <AdminUsers {...commonProps} />;
      case 'content': return <AdminContent {...commonProps} />;
      case 'prompts': return <AdminPrompts {...commonProps} />;
      case 'reports': return <AdminReports {...commonProps} />;
      case 'analytics': return <AdminAnalytics {...commonProps} />;
      case 'notifications': return <AdminNotifications {...commonProps} />;
      case 'studio-api': return <AdminStudioAPI {...commonProps} />;
      case 'ads': return <AdminAdsManager {...commonProps} />;
      case 'credits': return <AdminCredits {...commonProps} />;
      case 'settings': return <AdminSettings {...commonProps} />;
      case 'admin-mgmt': return isSuperAdmin ? <AdminManagement {...commonProps} /> : <AdminDashboard onNavigate={handleNavigate} />;
      default: return <AdminDashboard onNavigate={handleNavigate} />;
    }
  };

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">Q</span>
          <span className="text-lg font-bold text-foreground">pixa</span>
        </div>
        {activeTab !== 'dashboard' && (
          <button 
            onClick={handleBack}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Back to Dashboard"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { handleNavigate(t.id); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <t.icon size={17} />
            {t.label}
          </button>
        ))}
      </nav>
      {user && (
        <AdminProfileCard email={user.email || ''} isSuperAdmin={isSuperAdmin} />
      )}
      <div className="p-3 border-t border-border">
        <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
          <ArrowLeft size={17} />
          Back to App
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <div className="hidden md:flex w-56 border-r border-border bg-card flex-col z-20">
        <SidebarContent />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {activeTab !== 'dashboard' && (
            <button onClick={handleBack} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary active:scale-95 transition-all">
              <ChevronLeft size={22} className="text-foreground" />
            </button>
          )}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary">
            {mobileMenuOpen ? <X size={20} className="text-foreground" /> : <Menu size={20} className="text-foreground" />}
          </button>
        </div>
        <span className="text-sm font-bold text-foreground truncate">{tabs.find(t => t.id === activeTab)?.label}</span>
        <div className="w-12" /> {/* Spacer for centering */}
      </div>

      {/* Desktop Header with Back Button */}
      <div className="hidden md:flex fixed top-0 left-56 right-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 items-center gap-4">
        {activeTab !== 'dashboard' && (
          <button onClick={handleBack} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary active:scale-95 transition-all">
            <ChevronLeft size={20} className="text-foreground" />
          </button>
        )}
        <h1 className="text-xl font-bold text-foreground">{tabs.find(t => t.id === activeTab)?.label}</h1>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 h-full bg-card flex flex-col animate-in slide-in-from-left-4 duration-200" onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </div>
        </div>
      )}

      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 md:pt-24 pt-20 relative animate-in fade-in duration-300"
      >
        {renderContent()}
      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-foreground mb-2">Unsaved Changes</h3>
            <p className="text-sm text-muted-foreground mb-6">You have unsaved changes. Are you sure you want to go back?</p>
            <div className="flex gap-3">
              <button 
                onClick={cancelNavigation}
                className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={confirmNavigation}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}