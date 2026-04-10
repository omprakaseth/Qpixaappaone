import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppState } from '@/context/AppContext';
import { toast } from 'sonner';

export interface CartItem {
  id: string;
  prompt_id: string;
  created_at: string;
  prompt?: {
    id: string;
    title: string;
    preview_image: string | null;
    price: number;
    creator_name?: string;
  };
}

export function useCart() {
  const { user } = useAppState();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('cart_items')
      .select('id, prompt_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data && data.length > 0) {
      // Fetch prompt details for each cart item
      const promptIds = data.map(d => d.prompt_id);
      const { data: prompts } = await supabase
        .from('marketplace_prompts')
        .select('id, title, preview_image, price')
        .in('id', promptIds);
      
      const promptMap = new Map(prompts?.map(p => [p.id, p]) || []);
      setItems(data.map(d => ({
        ...d,
        prompt: promptMap.get(d.prompt_id) ? {
          ...promptMap.get(d.prompt_id)!,
        } : undefined,
      })));
    } else {
      setItems([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = useCallback(async (promptId: string) => {
    if (!user) return false;
    const { error } = await supabase
      .from('cart_items')
      .insert({ user_id: user.id, prompt_id: promptId });
    if (error) {
      if (error.code === '23505') {
        toast.info('Already in cart');
      }
      return false;
    }
    toast.success('Added to cart!');
    await fetchCart();
    return true;
  }, [user, fetchCart]);

  const removeFromCart = useCallback(async (promptId: string) => {
    if (!user) return;
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .eq('prompt_id', promptId);
    setItems(prev => prev.filter(i => i.prompt_id !== promptId));
    toast.success('Removed from cart');
  }, [user]);

  const isInCart = useCallback((promptId: string) => {
    return items.some(i => i.prompt_id === promptId);
  }, [items]);

  const clearCart = useCallback(async () => {
    if (!user) return;
    await supabase.from('cart_items').delete().eq('user_id', user.id);
    setItems([]);
  }, [user]);

  return { items, loading, addToCart, removeFromCart, isInCart, clearCart, refresh: fetchCart, count: items.length };
}
