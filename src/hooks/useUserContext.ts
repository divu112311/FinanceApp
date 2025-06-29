import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserContextItem {
  context_id: string;
  user_id: string;
  context_type: string;
  context_key: string;
  context_value: any;
  confidence_score: number;
  source: string;
  last_reinforced_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useUserContext = (user: User | null) => {
  const [contextItems, setContextItems] = useState<UserContextItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserContext();
    }
  }, [user]);

  const fetchUserContext = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Check if user_context table exists
      const { count, error: countError } = await supabase
        .from('user_context')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.log('user_context table not available:', countError);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_context')
        .select('*')
        .eq('user_id', user.id)
        .order('last_reinforced_at', { ascending: false });

      if (error) throw error;
      setContextItems(data || []);
    } catch (error) {
      console.error('Error fetching user context:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContextByType = (contextType: string) => {
    return contextItems.filter(item => item.context_type === contextType);
  };

  const getContextValue = (contextType: string, contextKey: string) => {
    const item = contextItems.find(
      item => item.context_type === contextType && item.context_key === contextKey
    );
    return item?.context_value;
  };

  const addContext = async (
    contextType: string,
    contextKey: string,
    contextValue: any,
    source: string = 'user_provided',
    confidenceScore: number = 1.0,
    expiresAt?: string
  ) => {
    if (!user) return null;

    try {
      // Check if context already exists
      const existingItem = contextItems.find(
        item => item.context_type === contextType && item.context_key === contextKey
      );

      if (existingItem) {
        // Update existing context
        const { data, error } = await supabase
          .from('user_context')
          .update({
            context_value: contextValue,
            confidence_score: confidenceScore,
            source,
            last_reinforced_at: new Date().toISOString(),
            expires_at: expiresAt,
            updated_at: new Date().toISOString()
          })
          .eq('context_id', existingItem.context_id)
          .select()
          .single();

        if (error) throw error;
        
        // Update local state
        setContextItems(prev => 
          prev.map(item => 
            item.context_id === existingItem.context_id ? data : item
          )
        );
        
        return data;
      } else {
        // Create new context
        const { data, error } = await supabase
          .from('user_context')
          .insert({
            user_id: user.id,
            context_type: contextType,
            context_key: contextKey,
            context_value: contextValue,
            confidence_score: confidenceScore,
            source,
            expires_at: expiresAt
          })
          .select()
          .single();

        if (error) throw error;
        
        // Update local state
        setContextItems(prev => [...prev, data]);
        
        return data;
      }
    } catch (error) {
      console.error('Error adding user context:', error);
      return null;
    }
  };

  const removeContext = async (contextId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_context')
        .delete()
        .eq('context_id', contextId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Update local state
      setContextItems(prev => prev.filter(item => item.context_id !== contextId));
      
      return true;
    } catch (error) {
      console.error('Error removing user context:', error);
      return false;
    }
  };

  const reinforceContext = async (contextId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_context')
        .update({
          last_reinforced_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('context_id', contextId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Update local state
      setContextItems(prev => 
        prev.map(item => 
          item.context_id === contextId 
            ? { ...item, last_reinforced_at: new Date().toISOString() } 
            : item
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error reinforcing user context:', error);
      return false;
    }
  };

  return {
    contextItems,
    loading,
    getContextByType,
    getContextValue,
    addContext,
    removeContext,
    reinforceContext,
    refetch: fetchUserContext
  };
};