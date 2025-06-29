import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface FeaturedModule {
  id: string;
  title: string;
  description: string;
  content_type: 'video' | 'article' | 'course' | 'quiz' | 'interactive';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  duration_minutes: number;
  xp_reward: number;
  created_at: string;
  is_featured: boolean;
  content_data: any;
  progress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    progress_percentage: number;
  };
}

export const useFeaturedLearning = (user: User | null) => {
  const [featuredModule, setFeaturedModule] = useState<FeaturedModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      fetchFeaturedLearning();
    }
  }, [user]);

  const fetchFeaturedLearning = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      // First check if we have a featured module in the database
      const { data: featuredData, error: featuredError } = await supabase
        .from('learning_modules')
        .select('*, user_learning_progress(*)')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (featuredError) {
        console.error('Error fetching featured module:', featuredError);
        throw featuredError;
      }
      
      // Check if we need to generate a new featured module
      // (if none exists or it's older than 1 week)
      const shouldGenerateNew = !featuredData || featuredData.length === 0 || 
        (featuredData.length > 0 && 
          new Date().getTime() - new Date(featuredData[0].created_at).getTime() > 7 * 24 * 60 * 60 * 1000);
      
      if (shouldGenerateNew) {
        console.log('Generating new featured learning content...');
        await generateFeaturedLearning();
        
        // Fetch the newly generated content
        const { data: newFeaturedData } = await supabase
          .from('learning_modules')
          .select('*, user_learning_progress(*)')
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (newFeaturedData && newFeaturedData.length > 0) {
          const module = newFeaturedData[0];
          const progress = module.user_learning_progress?.find(p => p.user_id === user.id);
          
          setFeaturedModule({
            ...module,
            progress: progress || null
          });
        }
      } else if (featuredData && featuredData.length > 0) {
        const module = featuredData[0];
        const progress = module.user_learning_progress?.find(p => p.user_id === user.id);
        
        setFeaturedModule({
          ...module,
          progress: progress || null
        });
      }
      
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error in fetchFeaturedLearning:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateFeaturedLearning = async () => {
    if (!user) return;

    setGenerating(true);
    setError(null);
    try {
      // Get current date for weekly theme
      const now = new Date();
      const weekNumber = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
      
      // Generate a weekly theme based on week number
      const themes = [
        'Budgeting Basics',
        'Emergency Fund Strategies',
        'Debt Management',
        'Investment Fundamentals',
        'Retirement Planning',
        'Credit Score Optimization',
        'Tax Planning Strategies',
        'Real Estate Investing',
        'Side Hustle Ideas',
        'Financial Independence',
        'Insurance Planning',
        'Estate Planning',
      ];
      
      const weeklyTheme = themes[weekNumber % themes.length];
      
      // Generate content based on the weekly theme
      const featuredContent = generateContentForTheme(weeklyTheme);
      
      // Store the generated content in the database
      const { data, error } = await supabase
        .from('learning_modules')
        .insert({
          title: featuredContent.title,
          description: featuredContent.description,
          content_type: featuredContent.content_type,
          difficulty: featuredContent.difficulty,
          category: featuredContent.category,
          duration_minutes: featuredContent.duration_minutes,
          xp_reward: featuredContent.xp_reward,
          required_level: 1,
          content_data: {
            ...featuredContent.content_data,
            generated_by: 'featured_learning_system',
            generated_at: new Date().toISOString(),
            weekly_theme: weeklyTheme,
            week_number: weekNumber
          },
          is_featured: true,
          is_active: true,
          tags: [weeklyTheme.toLowerCase().replace(/\s+/g, '-'), 'featured', 'weekly']
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error storing featured module:', error);
        throw error;
      }
      
      // Update any previous featured modules to not be featured anymore
      await supabase
        .from('learning_modules')
        .update({ is_featured: false })
        .neq('id', data.id)
        .eq('is_featured', true);
      
      return data;
    } catch (err: any) {
      console.error('Error in generateFeaturedLearning:', err);
      setError(err.message);
      return null;
    } finally {
      setGenerating(false);
    }
  };

  // Generate content based on theme
  const generateContentForTheme = (theme: string) => {
    // This would ideally call an AI service, but for now we'll use predefined content
    const contentTypes = ['article', 'video', 'quiz', 'interactive', 'course'];
    const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
    
    // Deterministic "random" selection based on theme
    const themeHash = theme.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const contentType = contentTypes[themeHash % contentTypes.length];
    const difficulty = difficulties[Math.min(Math.floor(themeHash / 100) % difficulties.length, 1)]; // Favor beginner/intermediate
    
    // Base structure
    const content = {
      title: `Weekly Feature: ${theme}`,
      description: `This week's featured learning module focuses on ${theme.toLowerCase()}, providing you with practical strategies and actionable insights.`,
      content_type: contentType as 'article' | 'video' | 'course' | 'quiz' | 'interactive',
      difficulty: difficulty as 'Beginner' | 'Intermediate' | 'Advanced',
      category: theme.split(' ')[0],
      duration_minutes: 15 + (themeHash % 30), // 15-45 minutes
      xp_reward: 50 + (themeHash % 50), // 50-100 XP
      content_data: {}
    };
    
    // Generate content based on content type
    switch (contentType) {
      case 'article':
        content.content_data = {
          sections: [
            {
              title: `Understanding ${theme}`,
              content: `${theme} is a critical component of your financial journey. By mastering these concepts, you'll be better equipped to make informed decisions about your money and future.`
            },
            {
              title: 'Key Strategies',
              content: `When implementing ${theme.toLowerCase()} strategies, focus on consistency and long-term planning. Small, regular actions compound over time to create significant results.`
            },
            {
              title: 'Common Mistakes to Avoid',
              content: `Many people struggle with ${theme.toLowerCase()} because they overlook fundamental principles or try to implement advanced strategies before mastering the basics.`
            },
            {
              title: 'Next Steps',
              content: `After completing this module, consider setting up a specific action plan for implementing what you've learned about ${theme.toLowerCase()} in your own financial life.`
            }
          ]
        };
        break;
        
      case 'quiz':
        content.content_data = {
          questions: [
            {
              question_text: `What is the primary benefit of implementing ${theme} strategies?`,
              options: [
                "Immediate wealth creation", 
                "Long-term financial stability", 
                "Impressing friends and family", 
                "Avoiding all financial responsibility"
              ],
              correct_answer: "Long-term financial stability",
              explanation: `${theme} strategies are designed to create sustainable financial habits that lead to long-term stability and growth.`
            },
            {
              question_text: "Which of the following is a recommended first step?",
              options: [
                "Making complex investments", 
                "Taking on additional debt", 
                "Creating a clear plan with measurable goals", 
                "Ignoring your current financial situation"
              ],
              correct_answer: "Creating a clear plan with measurable goals",
              explanation: "Starting with a clear plan and measurable goals allows you to track progress and make adjustments as needed."
            },
            {
              question_text: "How often should you review your progress?",
              options: [
                "Never", 
                "Once a year", 
                "Monthly", 
                "Daily"
              ],
              correct_answer: "Monthly",
              explanation: "Monthly reviews provide enough frequency to catch issues early while not becoming overly time-consuming."
            },
            {
              question_text: "What role does automation play?",
              options: [
                "It's unnecessary", 
                "It's helpful but optional", 
                "It's essential for consistency", 
                "It's only for advanced users"
              ],
              correct_answer: "It's essential for consistency",
              explanation: "Automation removes the willpower element from financial decisions, ensuring consistent execution of your plan."
            },
            {
              question_text: "Which mindset is most conducive to success?",
              options: [
                "All-or-nothing thinking", 
                "Short-term focus", 
                "Comparing yourself to others", 
                "Progress over perfection"
              ],
              correct_answer: "Progress over perfection",
              explanation: "Focusing on consistent progress rather than perfection leads to sustainable long-term results."
            }
          ]
        };
        break;
        
      case 'interactive':
      case 'course':
      case 'video':
      default:
        // For other types, we'll use a simplified structure
        content.content_data = {
          summary: `This ${contentType} covers essential concepts related to ${theme}, providing practical guidance and actionable steps.`,
          key_points: [
            `Understanding the fundamentals of ${theme}`,
            `Implementing effective strategies for your situation`,
            `Avoiding common pitfalls and mistakes`,
            `Measuring progress and making adjustments`,
            `Building sustainable habits for long-term success`
          ],
          resources: [
            {
              title: `${theme} Worksheet`,
              type: 'worksheet',
              description: `A practical worksheet to help you implement ${theme} strategies`
            },
            {
              title: `${theme} Calculator`,
              type: 'calculator',
              description: `A tool to help you calculate the impact of your ${theme} decisions`
            }
          ]
        };
        break;
    }
    
    return content;
  };

  return {
    featuredModule,
    loading,
    generating,
    error,
    lastUpdated,
    fetchFeaturedLearning,
    generateFeaturedLearning
  };
};