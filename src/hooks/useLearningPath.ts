import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface LearningModule {
  id: string;
  title: string;
  description: string;
  content_type: 'video' | 'article' | 'course' | 'quiz' | 'interactive';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  duration_minutes: number;
  xp_reward: number;
  content_data: any;
  progress?: UserProgress;
}

interface UserProgress {
  id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  time_spent_minutes: number;
  completed_at?: string;
  started_at?: string;
}

interface LearningPath {
  path_id: string;
  name: string;
  description: string;
  target_audience: string;
  estimated_duration: number;
  completion_badge_id?: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  modules: LearningModule[];
}

export const useLearningPath = (user: User | null) => {
  const [currentPath, setCurrentPath] = useState<LearningPath | null>(null);
  const [todaysModule, setTodaysModule] = useState<LearningModule | null>(null);
  const [upcomingModules, setUpcomingModules] = useState<LearningModule[]>([]);
  const [completedModules, setCompletedModules] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (user) {
      fetchLearningPath();
    } else {
      setCurrentPath(null);
      setTodaysModule(null);
      setUpcomingModules([]);
      setCompletedModules([]);
      setLoading(false);
    }
  }, [user, refreshTrigger]);

  const fetchLearningPath = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      console.log('Fetching learning path for user:', user.id);
      
      // Get the user's most recent learning path
      const { data: pathData, error: pathError } = await supabase
        .from('learning_paths_new')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (pathError) {
        throw pathError;
      }
      
      if (!pathData || pathData.length === 0) {
        console.log('No learning path found, generating one...');
        await generateLearningPath();
        return;
      }
      
      const path = pathData[0];
      console.log('Found learning path:', path.path_id);
      
      // Get modules for this path
      const { data: pathModulesData, error: modulesError } = await supabase
        .from('learning_path_modules')
        .select(`
          *,
          module:module_id(*)
        `)
        .eq('path_id', path.path_id)
        .order('sequence_order', { ascending: true });
      
      if (modulesError) {
        throw modulesError;
      }
      
      if (!pathModulesData || pathModulesData.length === 0) {
        console.log('No modules found in path, generating new content...');
        await generateLearningPath();
        return;
      }
      
      // Get user progress for these modules
      const moduleIds = pathModulesData.map(pm => pm.module_id);
      
      const { data: progressData, error: progressError } = await supabase
        .from('user_learning_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('module_id', moduleIds);
      
      if (progressError) {
        throw progressError;
      }
      
      // Create a map of module ID to progress
      const progressMap = new Map();
      if (progressData) {
        progressData.forEach(progress => {
          progressMap.set(progress.module_id, progress);
        });
      }
      
      // Combine modules with progress
      const modules = pathModulesData.map(pm => {
        const module = pm.module;
        const progress = progressMap.get(pm.module_id);
        
        return {
          ...module,
          progress: progress || null
        };
      });
      
      // Categorize modules
      const completed = modules.filter(m => m.progress?.status === 'completed');
      const inProgress = modules.filter(m => m.progress?.status === 'in_progress');
      const notStarted = modules.filter(m => !m.progress || m.progress.status === 'not_started');
      
      // Set today's module (first in-progress or first not-started)
      const today = inProgress.length > 0 ? inProgress[0] : (notStarted.length > 0 ? notStarted[0] : null);
      
      // Set upcoming modules (remaining not-started modules)
      const upcoming = notStarted.filter(m => m !== today);
      
      // Update state
      setCurrentPath({
        ...path,
        modules
      });
      setTodaysModule(today);
      setUpcomingModules(upcoming);
      setCompletedModules(completed);
      
    } catch (err: any) {
      console.error('Error fetching learning path:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateLearningPath = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      console.log('Generating new learning path for user:', user.id);
      
      const { data, error } = await supabase.functions.invoke('generate-learning-content', {
        body: { userId: user.id }
      });
      
      if (error) {
        throw error;
      }
      
      console.log('Learning path generated successfully:', data);
      
      // Refresh to load the new path
      setRefreshTrigger(prev => prev + 1);
      
    } catch (err: any) {
      console.error('Error generating learning path:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const startModule = async (moduleId: string) => {
    if (!user) return null;

    try {
      console.log('Starting module:', moduleId);
      
      // Check if progress already exists
      const { data: existingProgress } = await supabase
        .from('user_learning_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('module_id', moduleId)
        .maybeSingle();
      
      if (existingProgress) {
        console.log('Progress already exists, updating last_accessed_at');
        const { data, error } = await supabase
          .from('user_learning_progress')
          .update({
            last_accessed_at: new Date().toISOString(),
            status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id)
          .select()
          .single();
        
        if (error) throw error;
        
        // Update local state
        if (todaysModule?.id === moduleId) {
          setTodaysModule(prev => prev ? { ...prev, progress: data } : null);
        }
        
        return data;
      } else {
        console.log('Creating new progress record');
        const { data, error } = await supabase
          .from('user_learning_progress')
          .insert({
            user_id: user.id,
            module_id: moduleId,
            status: 'in_progress',
            progress_percentage: 0,
            started_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Update local state
        if (todaysModule?.id === moduleId) {
          setTodaysModule(prev => prev ? { ...prev, progress: data } : null);
        }
        
        return data;
      }
    } catch (error) {
      console.error('Error starting module:', error);
      return null;
    }
  };

  const completeModule = async (moduleId: string, timeSpent: number = 0) => {
    if (!user) return null;

    try {
      console.log('Completing module:', moduleId);
      
      // Find the module to get its XP reward
      const module = currentPath?.modules.find(m => m.id === moduleId);
      
      // Update progress to completed
      const { data, error } = await supabase
        .from('user_learning_progress')
        .upsert({
          user_id: user.id,
          module_id: moduleId,
          status: 'completed',
          progress_percentage: 100,
          time_spent_minutes: timeSpent,
          completed_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state
      if (todaysModule?.id === moduleId) {
        // Move from today's module to completed
        const completedModule = { ...todaysModule, progress: data };
        setCompletedModules(prev => [...prev, completedModule]);
        
        // Set next module as today's module
        if (upcomingModules.length > 0) {
          setTodaysModule(upcomingModules[0]);
          setUpcomingModules(prev => prev.slice(1));
        } else {
          setTodaysModule(null);
        }
      }
      
      // Record user action
      await supabase
        .from('user_actions')
        .insert({
          user_id: user.id,
          action_type: 'module_completed',
          action_data: {
            module_id: moduleId,
            module_title: module?.title,
            xp_earned: module?.xp_reward || 0
          },
          source: 'user_initiated'
        });
      
      return {
        progress: data,
        xpEarned: module?.xp_reward || 0
      };
    } catch (error) {
      console.error('Error completing module:', error);
      return null;
    }
  };

  const getOverallProgress = () => {
    if (!currentPath) return { percentage: 0, completed: 0, total: 0 };
    
    const total = currentPath.modules.length;
    const completed = completedModules.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    return { percentage, completed, total };
  };

  return {
    currentPath,
    todaysModule,
    upcomingModules,
    completedModules,
    loading,
    error,
    startModule,
    completeModule,
    generateLearningPath,
    getOverallProgress,
    refresh: () => setRefreshTrigger(prev => prev + 1)
  };
};