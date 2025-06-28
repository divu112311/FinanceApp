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
  required_level: number;
  prerequisites: string[];
  tags: string[];
  is_featured: boolean;
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
  id: string;
  name: string;
  description: string;
  module_ids: string[];
  is_active: boolean;
}

interface UserProfile {
  age_range?: string;
  income_range?: string;
  financial_experience?: string;
  primary_goals?: string[];
  learning_style?: string;
  time_availability?: string;
  interests?: string[];
}

export const useLearning = (user: User | null) => {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [userProgress, setUserProgress] = useState<Map<string, UserProgress>>(new Map());
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLearningData();
    }
  }, [user]);

  const fetchLearningData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setUserProfile(profileData);

      // Fetch all learning modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('learning_modules')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: true });

      if (modulesError) throw modulesError;

      // Fetch user progress
      const { data: progressData } = await supabase
        .from('user_learning_progress')
        .select('*')
        .eq('user_id', user.id);

      // Create progress map
      const progressMap = new Map<string, UserProgress>();
      progressData?.forEach(progress => {
        progressMap.set(progress.module_id, progress);
      });

      // Combine modules with progress
      const modulesWithProgress = modulesData?.map(module => ({
        ...module,
        progress: progressMap.get(module.id)
      })) || [];

      setModules(modulesWithProgress);
      setUserProgress(progressMap);

      // Fetch learning paths
      const { data: pathsData } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      setLearningPaths(pathsData || []);

    } catch (error) {
      console.error('Error fetching learning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startModule = async (moduleId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_learning_progress')
        .upsert({
          user_id: user.id,
          module_id: moduleId,
          status: 'in_progress',
          progress_percentage: 0,
          started_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setUserProgress(prev => new Map(prev.set(moduleId, data)));
      
      // Update modules
      setModules(prev => prev.map(module => 
        module.id === moduleId 
          ? { ...module, progress: data }
          : module
      ));

      return data;
    } catch (error) {
      console.error('Error starting module:', error);
      return null;
    }
  };

  const updateProgress = async (moduleId: string, progressPercentage: number, timeSpent: number = 0) => {
    if (!user) return;

    try {
      const isCompleted = progressPercentage >= 100;
      const updateData: any = {
        user_id: user.id,
        module_id: moduleId,
        status: isCompleted ? 'completed' : 'in_progress',
        progress_percentage: progressPercentage,
        time_spent_minutes: timeSpent,
        last_accessed_at: new Date().toISOString()
      };

      if (isCompleted) {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('user_learning_progress')
        .upsert(updateData)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setUserProgress(prev => new Map(prev.set(moduleId, data)));
      
      // Update modules
      setModules(prev => prev.map(module => 
        module.id === moduleId 
          ? { ...module, progress: data }
          : module
      ));

      // If completed, award XP
      if (isCompleted) {
        const module = modules.find(m => m.id === moduleId);
        if (module) {
          await awardXP(module.xp_reward);
        }
      }

      return data;
    } catch (error) {
      console.error('Error updating progress:', error);
      return null;
    }
  };

  const awardXP = async (points: number) => {
    if (!user) return;

    try {
      // Get current XP
      const { data: currentXP } = await supabase
        .from('xp')
        .select('points')
        .eq('user_id', user.id)
        .single();

      const newPoints = (currentXP?.points || 0) + points;

      await supabase
        .from('xp')
        .update({ points: newPoints })
        .eq('user_id', user.id);

    } catch (error) {
      console.error('Error awarding XP:', error);
    }
  };

  const getPersonalizedModules = () => {
    if (!userProfile) return [];

    return modules.filter(module => {
      // Filter based on user's financial experience
      if (userProfile.financial_experience === 'Beginner' && module.difficulty === 'Advanced') {
        return false;
      }
      
      // Filter based on user's interests
      if (userProfile.interests && userProfile.interests.length > 0) {
        const hasMatchingTag = module.tags.some(tag => 
          userProfile.interests!.some(interest => 
            tag.toLowerCase().includes(interest.toLowerCase()) ||
            interest.toLowerCase().includes(tag.toLowerCase())
          )
        );
        if (hasMatchingTag) return true;
      }

      // Filter based on user's goals
      if (userProfile.primary_goals && userProfile.primary_goals.length > 0) {
        const hasMatchingGoal = userProfile.primary_goals.some(goal =>
          module.category.toLowerCase().includes(goal.toLowerCase()) ||
          module.tags.some(tag => tag.toLowerCase().includes(goal.toLowerCase()))
        );
        if (hasMatchingGoal) return true;
      }

      // Include featured modules for beginners
      if (userProfile.financial_experience === 'Beginner' && module.is_featured) {
        return true;
      }

      return false;
    }).slice(0, 4); // Limit to 4 personalized modules
  };

  const getRecommendedModules = () => {
    return modules.filter(module => {
      // Don't recommend completed modules
      if (module.progress?.status === 'completed') return false;
      
      // Don't recommend modules that are too advanced
      const userLevel = Math.floor(((userProgress.size * 50) || 0) / 100) + 1;
      if (module.required_level > userLevel) return false;

      return true;
    }).slice(0, 8);
  };

  const getCompletedModules = () => {
    return modules.filter(module => module.progress?.status === 'completed');
  };

  const getInProgressModules = () => {
    return modules.filter(module => module.progress?.status === 'in_progress');
  };

  const getOverallProgress = () => {
    const totalModules = modules.length;
    const completedModules = getCompletedModules().length;
    const inProgressModules = getInProgressModules().length;
    
    return {
      total: totalModules,
      completed: completedModules,
      inProgress: inProgressModules,
      percentage: totalModules > 0 ? (completedModules / totalModules) * 100 : 0
    };
  };

  return {
    modules,
    userProgress,
    learningPaths,
    userProfile,
    loading,
    startModule,
    updateProgress,
    getPersonalizedModules,
    getRecommendedModules,
    getCompletedModules,
    getInProgressModules,
    getOverallProgress,
    refetch: fetchLearningData
  };
};