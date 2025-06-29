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
  prerequisites_new: any; // New field for enhanced prerequisites
  tags: string[];
  is_featured: boolean;
  is_active: boolean; // New field
  content_data: any; // New field for structured content
  progress?: UserProgress;
}

interface UserProgress {
  id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  time_spent_minutes: number;
  completed_at?: string;
  started_at?: string;
  path_id?: string; // New field for learning path association
  updated_at?: string; // New field
}

interface LearningPath {
  path_id: string; // Updated field name
  name: string;
  description: string;
  target_audience: string; // New field
  estimated_duration: number; // New field
  completion_badge_id: string | null; // New field
  is_featured: boolean; // New field
  created_at: string;
  updated_at: string;
}

interface LearningPathModule {
  path_module_id: string;
  path_id: string;
  module_id: string;
  sequence_order: number;
  is_required: boolean;
  unlock_conditions: any;
  created_at: string;
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
  const [pathModules, setPathModules] = useState<LearningPathModule[]>([]);
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
      console.log('=== FETCHING LEARNING DATA ===');
      
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('User profile:', profileData);
      setUserProfile(profileData);

      // Fetch all active learning modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('learning_modules')
        .select('*')
        .eq('is_active', true) // Only fetch active modules
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: true });

      if (modulesError) {
        console.error('Error fetching modules:', modulesError);
        throw modulesError;
      }

      console.log('Learning modules fetched:', modulesData?.length);

      // Fetch user progress
      const { data: progressData } = await supabase
        .from('user_learning_progress')
        .select('*')
        .eq('user_id', user.id);

      console.log('User progress fetched:', progressData?.length);

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

      console.log('Modules with progress:', modulesWithProgress.length);
      setModules(modulesWithProgress);
      setUserProgress(progressMap);

      // Fetch learning paths (new structure)
      const { data: pathsData } = await supabase
        .from('learning_paths_new')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: true });

      setLearningPaths(pathsData || []);

      // Fetch learning path modules (junction table)
      const { data: pathModulesData } = await supabase
        .from('learning_path_modules')
        .select('*')
        .order('sequence_order', { ascending: true });

      setPathModules(pathModulesData || []);

    } catch (error) {
      console.error('Error fetching learning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startModule = async (moduleId: string, pathId?: string) => {
    if (!user) return;

    console.log('=== STARTING MODULE ===');
    console.log('Module ID:', moduleId);
    console.log('Path ID:', pathId);
    console.log('User ID:', user.id);

    try {
      // Check if progress already exists
      const { data: existingProgress } = await supabase
        .from('user_learning_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('module_id', moduleId)
        .maybeSingle();

      console.log('Existing progress:', existingProgress);

      if (existingProgress) {
        console.log('Progress already exists, updating last_accessed_at');
        const { data, error } = await supabase
          .from('user_learning_progress')
          .update({
            last_accessed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            path_id: pathId || existingProgress.path_id, // Update path_id if provided
          })
          .eq('user_id', user.id)
          .eq('module_id', moduleId)
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
            updated_at: new Date().toISOString(),
            path_id: pathId || null,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating progress:', error);
          throw error;
        }

        console.log('Progress created:', data);

        // Update local state
        setUserProgress(prev => new Map(prev.set(moduleId, data)));
        
        // Update modules
        setModules(prev => prev.map(module => 
          module.id === moduleId 
            ? { ...module, progress: data }
            : module
        ));

        return data;
      }
    } catch (error) {
      console.error('Error starting module:', error);
      return null;
    }
  };

  const updateProgress = async (moduleId: string, progressPercentage: number, timeSpent: number = 0) => {
    if (!user) return;

    console.log('=== UPDATING PROGRESS ===');
    console.log('Module ID:', moduleId);
    console.log('Progress:', progressPercentage);
    console.log('Time spent:', timeSpent);

    try {
      const isCompleted = progressPercentage >= 100;
      const updateData: any = {
        status: isCompleted ? 'completed' : 'in_progress',
        progress_percentage: progressPercentage,
        time_spent_minutes: timeSpent,
        last_accessed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isCompleted) {
        updateData.completed_at = new Date().toISOString();
      }

      console.log('Update data:', updateData);

      const { data, error } = await supabase
        .from('user_learning_progress')
        .update(updateData)
        .eq('user_id', user.id)
        .eq('module_id', moduleId)
        .select()
        .single();

      if (error) {
        console.error('Error updating progress:', error);
        throw error;
      }

      console.log('Progress updated:', data);

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
      console.error('Error updating progress:', error);
      return null;
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
    }).slice(0, 9);
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

  const getPathModules = (pathId: string) => {
    const pathModuleIds = pathModules
      .filter(pm => pm.path_id === pathId)
      .sort((a, b) => a.sequence_order - b.sequence_order)
      .map(pm => pm.module_id);

    return modules.filter(module => pathModuleIds.includes(module.id));
  };

  return {
    modules,
    userProgress,
    learningPaths,
    pathModules,
    userProfile,
    loading,
    startModule,
    updateProgress,
    getPersonalizedModules,
    getRecommendedModules,
    getCompletedModules,
    getInProgressModules,
    getOverallProgress,
    getPathModules,
    refetch: fetchLearningData
  };
};