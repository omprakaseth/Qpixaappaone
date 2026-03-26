import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Flag, Coins, ArrowLeft, Shield, BarChart3, Bell, Settings, Megaphone, Zap, Menu, X, ShieldCheck } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [allowedTabs, setAllowedTabs] = useState<string[]>(ALL_TABS.map(t => t.id));
  const [permsLoaded, setPermsLoaded] = useState(false);

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
    if (isSuperAdmin || allowedTabs.includes(tab)) {
      setActiveTab(tab);
    }
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

    switch (activeTab) {
      case 'dashboard': return <AdminDashboard onNavigate={handleNavigate} />;
      case 'users': return <AdminUsers />;
      case 'content': return <AdminContent />;
      case 'prompts': return <AdminPrompts />;
      case 'reports': return <AdminReports />;
      case 'analytics': return <AdminAnalytics />;
      case 'notifications': return <AdminNotifications />;
      case 'studio-api': return <AdminStudioAPI />;
      case 'ads': return <AdminAdsManager />;
      case 'credits': return <AdminCredits />;
      case 'settings': return <AdminSettings />;
      case 'admin-mgmt': return isSuperAdmin ? <AdminManagement /> : <AdminDashboard onNavigate={handleNavigate} />;
      default: return <AdminDashboard onNavigate={handleNavigate} />;
    }
  };

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">Q</span>
          <span className="text-lg font-bold text-foreground">pixa</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-auto ${isSuperAdmin ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'}`}>
            {isSuperAdmin ? 'Super Admin' : 'Admin'}
          </span>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); setMobileMenuOpen(false); }}
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
    <div className="h-screen bg-background flex">
      <div className="hidden md:flex w-56 border-r border-border bg-card flex-col">
        <SidebarContent />
      </div>

      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary">
          {mobileMenuOpen ? <X size={20} className="text-foreground" /> : <Menu size={20} className="text-foreground" />}
        </button>
        <span className="text-sm font-bold text-foreground">{tabs.find(t => t.id === activeTab)?.label}</span>
        <div className="w-9" />
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 h-full bg-card flex flex-col" onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-6 md:pt-6 pt-16">
        {renderContent()}
      </div>
    </div>
  );
}