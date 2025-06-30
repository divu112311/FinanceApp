import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
    if (user && isSupabaseConfigured) {
      fetchLearningData();
    } else if (user) {
      // Set demo data if user is logged in but Supabase is not configured
      setDemoLearningData();
    }
  }, [user]);

  const setDemoLearningData = () => {
    // Create demo modules
    const demoModules: LearningModule[] = [
      {
        id: 'demo-module-1',
        title: 'Introduction to Budgeting',
        description: 'Learn the fundamentals of creating and maintaining a personal budget. This module covers the 50/30/20 rule, tracking expenses, and setting realistic financial goals.',
        content_type: 'course',
        difficulty: 'Beginner',
        category: 'Budgeting',
        duration_minutes: 30,
        xp_reward: 50,
        required_level: 1,
        prerequisites: [],
        prerequisites_new: null,
        tags: ['budgeting', 'basics', 'money-management'],
        is_featured: true,
        is_active: true,
        content_data: {
          sections: [
            {
              title: 'Understanding Your Cash Flow',
              content: 'The foundation of any budget is understanding your cash flow - how much money comes in and goes out each month. Start by tracking all income sources and categorizing your expenses for at least 30 days.'
            },
            {
              title: 'The 50/30/20 Framework',
              content: 'A simple but effective budgeting framework is the 50/30/20 rule. Allocate 50% of your after-tax income to needs, 30% to wants, and 20% to savings and debt repayment.'
            },
            {
              title: 'Zero-Based Budgeting',
              content: 'In zero-based budgeting, you assign every dollar of income to a specific category until your income minus your expenses equals zero. This doesn\'t mean spending everything - savings and investments are categories too.'
            }
          ]
        },
        progress: {
          id: 'demo-progress-1',
          status: 'completed',
          progress_percentage: 100,
          time_spent_minutes: 30,
          completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          started_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        }
      },
      {
        id: 'demo-module-2',
        title: 'Emergency Fund Essentials',
        description: 'Understand the importance of emergency funds and learn how to build one. Discover how much you need and where to keep your emergency savings.',
        content_type: 'article',
        difficulty: 'Beginner',
        category: 'Savings',
        duration_minutes: 20,
        xp_reward: 40,
        required_level: 1,
        prerequisites: [],
        prerequisites_new: null,
        tags: ['emergency-fund', 'savings', 'financial-security'],
        is_featured: false,
        is_active: true,
        content_data: {
          sections: [
            {
              title: 'Why You Need an Emergency Fund',
              content: 'An emergency fund is your financial buffer against unexpected events like job loss, medical emergencies, or car repairs. Without this safety net, you\'re forced to rely on credit cards or loans, potentially creating a cycle of debt.'
            },
            {
              title: 'How Much to Save',
              content: 'The general recommendation is 3-6 months of essential expenses. Start with a mini emergency fund of $1,000 while paying off high-interest debt, then build toward your full target.'
            },
            {
              title: 'Where to Keep Your Emergency Fund',
              content: 'Your emergency fund should be liquid (easily accessible) but not too accessible (to avoid temptation). High-yield savings accounts are ideal - they offer better returns than traditional savings accounts while maintaining FDIC insurance and liquidity.'
            }
          ]
        },
        progress: {
          id: 'demo-progress-2',
          status: 'in_progress',
          progress_percentage: 60,
          time_spent_minutes: 12,
          started_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      },
      {
        id: 'demo-module-3',
        title: 'Investment Basics',
        description: 'Get started with investing by learning about different asset classes, risk tolerance, and diversification strategies.',
        content_type: 'video',
        difficulty: 'Intermediate',
        category: 'Investing',
        duration_minutes: 45,
        xp_reward: 75,
        required_level: 2,
        prerequisites: ['demo-module-1'],
        prerequisites_new: null,
        tags: ['investing', 'stocks', 'portfolio'],
        is_featured: false,
        is_active: true,
        content_data: {},
        progress: {
          id: 'demo-progress-3',
          status: 'not_started',
          progress_percentage: 0,
          time_spent_minutes: 0
        }
      },
      {
        id: 'demo-module-4',
        title: 'Financial Fundamentals Quiz',
        description: 'Test your knowledge of essential financial concepts and identify areas for further learning.',
        content_type: 'quiz',
        difficulty: 'Beginner',
        category: 'General',
        duration_minutes: 10,
        xp_reward: 50,
        required_level: 1,
        prerequisites: [],
        prerequisites_new: null,
        tags: ['quiz', 'assessment', 'basics'],
        is_featured: false,
        is_active: true,
        content_data: {
          questions: [
            {
              question_text: "What does the 50/30/20 budgeting rule recommend for needs?",
              options: ["30% of income", "50% of income", "20% of income", "70% of income"],
              correct_answer: "50% of income",
              explanation: "The 50/30/20 rule suggests allocating 50% of your after-tax income to needs, 30% to wants, and 20% to savings and debt repayment."
            },
            {
              question_text: "Which of these is typically considered a 'need' in budgeting?",
              options: ["Netflix subscription", "Housing costs", "Dining out", "New clothes"],
              correct_answer: "Housing costs",
              explanation: "Needs are expenses that are essential for living, such as housing, utilities, groceries, and basic transportation."
            },
            {
              question_text: "What is the recommended minimum amount for an emergency fund?",
              options: ["$100", "$500", "1 month of expenses", "3-6 months of expenses"],
              correct_answer: "3-6 months of expenses",
              explanation: "Financial experts generally recommend having 3-6 months of essential expenses saved in an emergency fund."
            },
            {
              question_text: "Which type of account typically offers the highest interest rate?",
              options: ["Checking account", "Traditional savings account", "High-yield savings account", "Money market account"],
              correct_answer: "High-yield savings account",
              explanation: "High-yield savings accounts, often offered by online banks, typically provide much higher interest rates than traditional bank accounts."
            },
            {
              question_text: "What is the first recommended step in creating a financial plan?",
              options: ["Investing in stocks", "Creating a budget", "Opening a credit card", "Taking out a loan"],
              correct_answer: "Creating a budget",
              explanation: "A budget is the foundation of any financial plan, as it helps you understand your income, expenses, and where your money is going."
            }
          ]
        },
        progress: {
          id: 'demo-progress-4',
          status: 'not_started',
          progress_percentage: 0,
          time_spent_minutes: 0
        }
      }
    ];
    
    // Create demo learning path
    const demoPath: LearningPath = {
      path_id: 'demo-path-1',
      name: 'Financial Foundation Path',
      description: 'Build a strong foundation in personal finance fundamentals',
      target_audience: 'Beginner',
      estimated_duration: 105, // Sum of all module durations
      completion_badge_id: null,
      is_featured: true,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Create demo path modules
    const demoPathModules: LearningPathModule[] = [
      {
        path_module_id: 'demo-path-module-1',
        path_id: 'demo-path-1',
        module_id: 'demo-module-1',
        sequence_order: 1,
        is_required: true,
        unlock_conditions: {},
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        path_module_id: 'demo-path-module-2',
        path_id: 'demo-path-1',
        module_id: 'demo-module-2',
        sequence_order: 2,
        is_required: true,
        unlock_conditions: {},
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        path_module_id: 'demo-path-module-3',
        path_id: 'demo-path-1',
        module_id: 'demo-module-4',
        sequence_order: 3,
        is_required: true,
        unlock_conditions: {},
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        path_module_id: 'demo-path-module-4',
        path_id: 'demo-path-1',
        module_id: 'demo-module-3',
        sequence_order: 4,
        is_required: false,
        unlock_conditions: {},
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    // Create demo user profile
    const demoProfile: UserProfile = {
      financial_experience: 'Beginner',
      learning_style: 'Visual',
      time_availability: '30min',
      interests: ['budgeting', 'saving', 'investing']
    };
    
    // Create progress map
    const progressMap = new Map<string, UserProgress>();
    demoModules.forEach(module => {
      if (module.progress) {
        progressMap.set(module.id, module.progress);
      }
    });
    
    // Set state
    setModules(demoModules);
    setUserProgress(progressMap);
    setLearningPaths([demoPath]);
    setPathModules(demoPathModules);
    setUserProfile(demoProfile);
    setLoading(false);
  };

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
      // Fall back to demo data on error
      setDemoLearningData();
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
      // If Supabase is not configured, update local state only
      if (!isSupabaseConfigured) {
        const module = modules.find(m => m.id === moduleId);
        if (!module) return null;
        
        const newProgress: UserProgress = {
          id: `local-progress-${Date.now()}`,
          status: 'in_progress',
          progress_percentage: 0,
          time_spent_minutes: 0,
          started_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          path_id: pathId
        };
        
        // Update local state
        setUserProgress(prev => new Map(prev.set(moduleId, newProgress)));
        
        // Update modules
        setModules(prev => prev.map(module => 
          module.id === moduleId 
            ? { ...module, progress: newProgress }
            : module
        ));
        
        return newProgress;
      }

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
      
      // If Supabase is not configured, update local state only
      if (!isSupabaseConfigured) {
        const existingProgress = userProgress.get(moduleId);
        
        const newProgress: UserProgress = {
          id: existingProgress?.id || `local-progress-${Date.now()}`,
          status: isCompleted ? 'completed' : 'in_progress',
          progress_percentage: progressPercentage,
          time_spent_minutes: (existingProgress?.time_spent_minutes || 0) + timeSpent,
          last_accessed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          started_at: existingProgress?.started_at || new Date().toISOString(),
          completed_at: isCompleted ? new Date().toISOString() : undefined,
          path_id: existingProgress?.path_id
        };
        
        // Update local state
        setUserProgress(prev => new Map(prev.set(moduleId, newProgress)));
        
        // Update modules
        setModules(prev => prev.map(module => 
          module.id === moduleId 
            ? { ...module, progress: newProgress }
            : module
        ));
        
        return newProgress;
      }

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