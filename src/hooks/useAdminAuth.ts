"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const check = async (session: any) => {
    if (!session?.user) {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setUser(null);
      setLoading(false);
      return;
    }
    setUser(session.user);

    if (session.user.email === 'qpixerapp@gmail.com' || session.user.email === 'omprakashseth248@gmail.com') {
      setIsAdmin(true);
      setIsSuperAdmin(true);
      setLoading(false);
      return;
    }

    const [adminResult, superResult] = await Promise.all([
      supabase.rpc('has_role', { _user_id: session.user.id, _role: 'admin' }),
      supabase.rpc('is_super_admin', { _user_id: session.user.id }),
    ]);

    setIsAdmin(!!adminResult.data);
    setIsSuperAdmin(!!superResult.data);
    setLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      check(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const recheck = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    check(session);
  };

  return { isAdmin, isSuperAdmin, loading, user, recheck };
}
