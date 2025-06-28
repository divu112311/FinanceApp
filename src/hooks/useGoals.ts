import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Goal {
  id: string;
  user_id: string | null;
  name: string | null;
  target_amount: number | null;
  saved_amount: number | null;
  deadline: string | null;
  created_at: string | null;
}

export const useGoals = (user: User | null) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching goals:', error);
    } else {
      setGoals(data || []);
    }
    setLoading(false);
  };

  const createGoal = async (goal: Omit<Goal, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        ...goal,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating goal:', error);
      return null;
    }

    setGoals(prev => [data, ...prev]);
    return data;
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating goal:', error);
      return null;
    }

    setGoals(prev => prev.map(goal => goal.id === id ? data : goal));
    return data;
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting goal:', error);
      return false;
    }

    setGoals(prev => prev.filter(goal => goal.id !== id));
    return true;
  };

  return {
    goals,
    loading,
    createGoal,
    updateGoal,
    deleteGoal,
    refetch: fetchGoals,
  };
};