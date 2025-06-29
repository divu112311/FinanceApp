import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useBankAccounts } from './useBankAccounts';
import { useGoals } from './useGoals';
import { useTransactions } from './useTransactions';
import { useUserProfile } from './useUserProfile';

interface AIGeneratedModule {
  id: string;
  title: string;
  description: string;
  content_type: 'video' | 'article' | 'course' | 'quiz' | 'interactive';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  duration_minutes: number;
  xp_reward: number;
  content_data: any;
  created_at: string;
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
  modules: AIGeneratedModule[];
  created_at: string;
}

export const useAILearning = (user: User | null) => {
  const [aiModules, setAIModules] = useState<AIGeneratedModule[]>([]);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { bankAccounts, totalBalance } = useBankAccounts(user);
  const { goals } = useGoals(user);
  const { transactions, getTotalSpending, getTotalIncome } = useTransactions(user);
  const { profile, extendedProfile } = useUserProfile(user);

  useEffect(() => {
    if (user && isSupabaseConfigured) {
      fetchAILearningContent();
    }
  }, [user]);

  const fetchAILearningContent = async () => {
    if (!user || !isSupabaseConfigured) {
      console.warn('Cannot fetch AI learning content: User not authenticated or Supabase not configured');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Fetching AI learning content for user:', user.id);
      
      // First check if we have AI-generated modules in the database
      const { data: modulesData, error: modulesError } = await supabase
        .from('learning_modules')
        .select('*, user_learning_progress(*)')
        .eq('content_data->generated_by', '"ai"')
        .order('created_at', { ascending: false });
      
      if (modulesError) {
        console.error('Error fetching AI modules:', modulesError);
        throw modulesError;
      }
      
      // Format modules with progress
      const formattedModules = modulesData?.map(module => {
        const progress = module.user_learning_progress?.find(p => p.user_id === user.id);
        return {
          ...module,
          progress: progress || null
        };
      }) || [];
      
      console.log(`Found ${formattedModules.length} AI-generated modules`);
      
      // Check if we need to generate new content (if none exists or it's older than 1 day)
      const shouldGenerateNew = formattedModules.length === 0 || 
        (formattedModules.length > 0 && 
          new Date().getTime() - new Date(formattedModules[0].created_at).getTime() > 24 * 60 * 60 * 1000);
      
      if (shouldGenerateNew) {
        console.log('Generating new AI learning content...');
        await generateAILearningContent();
        
        // Fetch the newly generated content
        const { data: newModulesData } = await supabase
          .from('learning_modules')
          .select('*, user_learning_progress(*)')
          .eq('content_data->generated_by', '"ai"')
          .order('created_at', { ascending: false });
        
        const newFormattedModules = newModulesData?.map(module => {
          const progress = module.user_learning_progress?.find(p => p.user_id === user.id);
          return {
            ...module,
            progress: progress || null
          };
        }) || [];
        
        setAIModules(newFormattedModules);
      } else {
        setAIModules(formattedModules);
      }
      
      // Fetch learning path
      const { data: pathData, error: pathError } = await supabase
        .from('learning_paths_new')
        .select('*')
        .eq('target_audience', extendedProfile?.financial_experience || 'Beginner')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!pathError && pathData && pathData.length > 0) {
        // Get modules for this path
        const { data: pathModulesData } = await supabase
          .from('learning_path_modules')
          .select('*, module:module_id(*)')
          .eq('path_id', pathData[0].path_id)
          .order('sequence_order', { ascending: true });
        
        if (pathModulesData) {
          const pathModules = pathModulesData.map(pm => {
            const progress = pm.module.user_learning_progress?.find(p => p.user_id === user.id);
            return {
              ...pm.module,
              progress: progress || null
            };
          });
          
          setLearningPath({
            ...pathData[0],
            modules: pathModules
          });
        }
      }
      
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error in fetchAILearningContent:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateAILearningContent = async () => {
    if (!user || !isSupabaseConfigured) {
      console.warn('Cannot generate AI learning content: User not authenticated or Supabase not configured');
      return null;
    }

    setGenerating(true);
    setError(null);
    try {
      console.log('Generating AI learning content for user:', user.id);
      
      // Call the Edge Function to generate content
      const { data, error } = await supabase.functions.invoke('generate-learning-content', {
        body: {
          userId: user.id
        },
      });

      if (error) {
        console.error('Error generating AI learning content:', error);
        throw new Error(`Failed to send a request to the Edge Function: ${error.message}`);
      }

      console.log('AI learning content generated:', data);
      return data;
    } catch (err: any) {
      console.error('Error in generateAILearningContent:', err);
      setError(err.message);
      
      // If the edge function fails, generate content locally
      const locallyGeneratedModules = generateLocalModules();
      
      // Try to store the locally generated modules
      try {
        for (const module of locallyGeneratedModules) {
          await supabase
            .from('learning_modules')
            .insert({
              title: module.title,
              description: module.description,
              content_type: module.content_type,
              difficulty: module.difficulty,
              category: module.category,
              duration_minutes: module.duration_minutes,
              xp_reward: module.xp_reward,
              required_level: 1,
              content_data: {
                ...module.content_data,
                generated_by: 'ai',
                generated_at: new Date().toISOString(),
                generated_locally: true
              },
              is_active: true
            });
        }
      } catch (insertError) {
        console.error('Error storing locally generated modules:', insertError);
      }
      
      return { modules: locallyGeneratedModules, generated: true, local: true };
    } finally {
      setGenerating(false);
    }
  };

  const generateLocalModules = (): AIGeneratedModule[] => {
    // Generate modules based on user data
    const modules: AIGeneratedModule[] = [];
    const now = new Date().toISOString();
    
    // Determine user's financial situation
    const hasAccounts = bankAccounts.length > 0;
    const hasGoals = goals.length > 0;
    const hasTransactions = transactions.length > 0;
    const financialExperience = extendedProfile?.financial_experience || 'Beginner';
    
    // 1. Always include a budgeting module
    modules.push({
      id: crypto.randomUUID(),
      title: "Smart Budgeting Strategies",
      description: "Learn practical budgeting methods that fit your lifestyle, including the 50/30/20 rule and zero-based budgeting techniques.",
      content_type: "article",
      difficulty: "Beginner",
      category: "Budgeting",
      duration_minutes: 15,
      xp_reward: 25,
      content_data: {
        generated_by: "ai",
        generated_at: now,
        sections: [
          {
            title: "Understanding the 50/30/20 Rule",
            content: "The 50/30/20 rule is a simple budgeting method that allocates 50% of your income to needs, 30% to wants, and 20% to savings and debt repayment. This balanced approach ensures you're covering essentials while still enjoying life and building financial security."
          },
          {
            title: "Zero-Based Budgeting",
            content: "Zero-based budgeting means giving every dollar a purpose until your income minus expenses equals zero. This doesn't mean spending everything – it means allocating all income to categories including savings and investments."
          },
          {
            title: "Tracking Your Spending",
            content: "The foundation of any budget is tracking your spending. Use categories that make sense for your lifestyle and review your spending weekly to stay on track."
          }
        ]
      },
      created_at: now
    });
    
    // 2. Add a module based on whether they have accounts
    if (!hasAccounts) {
      modules.push({
        id: crypto.randomUUID(),
        title: "Getting Started with Banking",
        description: "Learn how to choose the right bank accounts for your needs and how to use them effectively.",
        content_type: "article",
        difficulty: "Beginner",
        category: "Banking",
        duration_minutes: 12,
        xp_reward: 20,
        content_data: {
          generated_by: "ai",
          generated_at: now,
          sections: [
            {
              title: "Choosing the Right Checking Account",
              content: "Look for accounts with no monthly fees, no minimum balance requirements, and a large ATM network. Online banks often offer better terms than traditional banks."
            },
            {
              title: "High-Yield Savings Accounts",
              content: "Don't settle for the 0.01% interest rate at traditional banks. High-yield savings accounts can offer 10-20x more interest on your savings."
            },
            {
              title: "Setting Up Direct Deposit and Automatic Transfers",
              content: "Automate your finances by setting up direct deposit for your paycheck and automatic transfers to your savings accounts."
            }
          ]
        },
        created_at: now
      });
    } else {
      modules.push({
        id: crypto.randomUUID(),
        title: "Optimizing Your Bank Accounts",
        description: "Learn strategies to maximize the benefits of your existing accounts and minimize fees.",
        content_type: "article",
        difficulty: financialExperience === "Beginner" ? "Beginner" : "Intermediate",
        category: "Banking",
        duration_minutes: 18,
        xp_reward: 30,
        content_data: {
          generated_by: "ai",
          generated_at: now,
          sections: [
            {
              title: "Account Fee Audit",
              content: "Review all your accounts for hidden fees and consider switching to fee-free alternatives. Even small monthly fees add up to hundreds of dollars over time."
            },
            {
              title: "Interest Rate Optimization",
              content: "Compare your current savings interest rates to the best available rates. Moving your emergency fund to a high-yield savings account could earn you 10-20x more interest."
            },
            {
              title: "Strategic Account Structure",
              content: "Consider using multiple accounts for different purposes: checking for daily expenses, high-yield savings for emergency funds, and separate savings accounts for specific goals."
            }
          ]
        },
        created_at: now
      });
    }
    
    // 3. Add a module based on whether they have goals
    if (!hasGoals) {
      modules.push({
        id: crypto.randomUUID(),
        title: "Setting Effective Financial Goals",
        description: "Learn how to create SMART financial goals that motivate you and track your progress effectively.",
        content_type: "interactive",
        difficulty: "Beginner",
        category: "Goal Setting",
        duration_minutes: 20,
        xp_reward: 35,
        content_data: {
          generated_by: "ai",
          generated_at: now,
          sections: [
            {
              title: "The SMART Goal Framework",
              content: "Effective financial goals are Specific, Measurable, Achievable, Relevant, and Time-bound. Instead of 'save more money,' try 'save $5,000 for an emergency fund by December 31st.'"
            },
            {
              title: "Prioritizing Your Goals",
              content: "Not all financial goals are equal. Prioritize emergency savings and high-interest debt repayment before other goals like vacation funds or luxury purchases."
            },
            {
              title: "Tracking Progress and Staying Motivated",
              content: "Visual progress trackers, regular check-ins, and celebrating milestones are key to maintaining momentum toward your financial goals."
            }
          ]
        },
        created_at: now
      });
    } else {
      modules.push({
        id: crypto.randomUUID(),
        title: "Accelerating Your Financial Goals",
        description: "Advanced strategies to reach your financial goals faster and more efficiently.",
        content_type: "interactive",
        difficulty: financialExperience === "Beginner" ? "Beginner" : "Intermediate",
        category: "Goal Setting",
        duration_minutes: 25,
        xp_reward: 40,
        content_data: {
          generated_by: "ai",
          generated_at: now,
          sections: [
            {
              title: "The Power of Automation",
              content: "Set up automatic transfers to your goal accounts on payday. What happens first with your money tends to stick, while what happens last often falls by the wayside."
            },
            {
              title: "Finding Hidden Money",
              content: "Conduct a spending audit to identify 'money leaks' - small recurring expenses that add up over time. Redirecting these funds to your goals can accelerate progress significantly."
            },
            {
              title: "Using Windfalls Strategically",
              content: "Create a plan for how you'll allocate unexpected money like tax refunds, bonuses, or gifts. Consider the 50/30/20 rule: 50% toward goals, 30% to savings, and 20% for enjoyment."
            }
          ]
        },
        created_at: now
      });
    }
    
    // 4. Add a quiz module
    modules.push({
      id: crypto.randomUUID(),
      title: "Financial Fundamentals Quiz",
      description: "Test your knowledge of essential financial concepts and identify areas for further learning.",
      content_type: "quiz",
      difficulty: "Beginner",
      category: "General",
      duration_minutes: 10,
      xp_reward: 50,
      content_data: {
        generated_by: "ai",
        generated_at: now,
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
      created_at: now
    });
    
    // 5. Add a module based on transactions if available
    if (hasTransactions) {
      modules.push({
        id: crypto.randomUUID(),
        title: "Understanding Your Spending Patterns",
        description: "Learn to analyze your transaction history to identify patterns and opportunities for optimization.",
        content_type: "interactive",
        difficulty: financialExperience === "Beginner" ? "Beginner" : "Intermediate",
        category: "Spending Analysis",
        duration_minutes: 22,
        xp_reward: 35,
        content_data: {
          generated_by: "ai",
          generated_at: now,
          sections: [
            {
              title: "Categorizing Your Expenses",
              content: "Properly categorizing your expenses is the first step to understanding your spending. Create categories that are meaningful to you and your lifestyle."
            },
            {
              title: "Identifying Spending Trends",
              content: "Look for patterns in your spending over time. Do you spend more on weekends? At the beginning of the month? Understanding these patterns can help you plan better."
            },
            {
              title: "Finding Optimization Opportunities",
              content: "Compare your spending across categories to benchmarks. For example, housing should ideally be less than 30% of your income, while food might be 10-15%."
            }
          ]
        },
        created_at: now
      });
    }
    
    return modules;
  };

  const startModule = async (moduleId: string) => {
    if (!user || !isSupabaseConfigured) return null;

    try {
      console.log('Starting AI module:', moduleId);
      
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
        setAIModules(prev => prev.map(module => 
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
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Update local state
        setAIModules(prev => prev.map(module => 
          module.id === moduleId 
            ? { ...module, progress: data }
            : module
        ));
        
        return data;
      }
    } catch (error) {
      console.error('Error starting AI module:', error);
      return null;
    }
  };

  const completeModule = async (moduleId: string, timeSpent: number = 0) => {
    if (!user || !isSupabaseConfigured) return null;

    try {
      console.log('Completing AI module:', moduleId);
      
      // Find the module to get its XP reward
      const module = aiModules.find(m => m.id === moduleId);
      
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
      setAIModules(prev => prev.map(module => 
        module.id === moduleId 
          ? { ...module, progress: data }
          : module
      ));
      
      return {
        progress: data,
        xpEarned: module?.xp_reward || 0
      };
    } catch (error) {
      console.error('Error completing AI module:', error);
      return null;
    }
  };

  const generateQuizQuestions = async (topic: string, difficulty: string, count: number = 5) => {
    if (!user || !isSupabaseConfigured) return [];

    try {
      console.log('Generating quiz questions:', { topic, difficulty, count });
      
      // Call the Edge Function to generate quiz questions
      const { data, error } = await supabase.functions.invoke('generate-quiz-questions', {
        body: {
          userId: user.id,
          topic,
          difficulty,
          count
        },
      });

      if (error) {
        console.error('Error generating quiz questions:', error);
        throw error;
      }

      console.log('Generated quiz questions:', data);
      return data.questions;
    } catch (err) {
      console.error('Error in generateQuizQuestions:', err);
      
      // Fallback to local generation
      return generateLocalQuizQuestions(topic, difficulty, count);
    }
  };

  const generateLocalQuizQuestions = (topic: string, difficulty: string, count: number = 5) => {
    // Default questions based on topic
    const defaultQuestions = {
      budgeting: [
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
          question_text: "What is zero-based budgeting?",
          options: [
            "Spending zero money each month", 
            "Assigning every dollar of income to a specific purpose", 
            "Having zero debt", 
            "Saving zero money"
          ],
          correct_answer: "Assigning every dollar of income to a specific purpose",
          explanation: "Zero-based budgeting means giving every dollar a job so your income minus your expenses equals zero. This doesn't mean spending everything, but rather allocating all income to categories including savings and investments."
        },
        {
          question_text: "Which budgeting method is best for variable income?",
          options: [
            "Envelope system", 
            "Pay yourself first", 
            "Zero-based budgeting", 
            "Priority-based budgeting"
          ],
          correct_answer: "Priority-based budgeting",
          explanation: "Priority-based budgeting works well for variable income because it focuses on covering essential expenses first, then moving down your priority list as more income becomes available."
        },
        {
          question_text: "What is the envelope budgeting system?",
          options: [
            "Putting your budget in an envelope and mailing it to yourself", 
            "Allocating cash to different envelopes for different spending categories", 
            "Saving money in envelopes", 
            "Paying bills with envelopes"
          ],
          correct_answer: "Allocating cash to different envelopes for different spending categories",
          explanation: "The envelope system involves putting cash into physical or digital envelopes labeled for different spending categories. When an envelope is empty, you stop spending in that category until the next budget period."
        }
      ],
      investing: [
        {
          question_text: "What is diversification in investing?",
          options: ["Buying only one stock", "Spreading investments across different assets", "Investing only in bonds", "Day trading"],
          correct_answer: "Spreading investments across different assets",
          explanation: "Diversification means spreading your investments across different asset classes, sectors, and securities to reduce risk."
        },
        {
          question_text: "Which investment typically has higher risk but potentially higher returns?",
          options: ["Savings account", "Government bonds", "Stocks", "CDs"],
          correct_answer: "Stocks",
          explanation: "Stocks generally offer higher potential returns than bonds or savings accounts, but they also come with higher volatility and risk."
        },
        {
          question_text: "What is dollar-cost averaging?",
          options: ["Buying stocks at the lowest price", "Investing the same amount regularly", "Selling when prices are high", "Only investing in expensive stocks"],
          correct_answer: "Investing the same amount regularly",
          explanation: "Dollar-cost averaging involves investing a fixed amount of money at regular intervals, regardless of market conditions, which can help reduce the impact of market volatility."
        },
        {
          question_text: "What does 'risk tolerance' mean in investing?",
          options: ["How much money you can invest", "How much volatility you can handle", "How long you plan to invest", "How many stocks you own"],
          correct_answer: "How much volatility you can handle",
          explanation: "Risk tolerance refers to your ability and willingness to handle fluctuations in the value of your investments without making emotional decisions."
        },
        {
          question_text: "Which of these is generally considered the safest investment?",
          options: ["Cryptocurrency", "Individual stocks", "Real estate", "U.S. Treasury bonds"],
          correct_answer: "U.S. Treasury bonds",
          explanation: "U.S. Treasury bonds are backed by the full faith and credit of the U.S. government and are considered among the safest investments available."
        }
      ],
      savings: [
        {
          question_text: "How many months of expenses should an emergency fund typically cover?",
          options: ["1-2 months", "3-6 months", "12 months", "24 months"],
          correct_answer: "3-6 months",
          explanation: "Financial experts generally recommend having 3-6 months of living expenses saved in an emergency fund to cover unexpected situations."
        },
        {
          question_text: "Where should you keep your emergency fund?",
          options: ["Stock market", "High-yield savings account", "Under your mattress", "Cryptocurrency"],
          correct_answer: "High-yield savings account",
          explanation: "Emergency funds should be easily accessible and safe, making high-yield savings accounts ideal due to their liquidity and FDIC protection."
        },
        {
          question_text: "What is the recommended minimum savings rate for financial health?",
          options: ["5% of income", "10% of income", "15% of income", "20% of income"],
          correct_answer: "20% of income",
          explanation: "Financial experts typically recommend saving at least 20% of your income, which includes both emergency savings and retirement contributions."
        },
        {
          question_text: "Which saving strategy is most effective for most people?",
          options: ["Saving whatever is left at the end of the month", "Cutting all discretionary spending", "Paying yourself first", "Keeping all savings in cash"],
          correct_answer: "Paying yourself first",
          explanation: "Paying yourself first means automatically transferring money to savings as soon as you get paid, before you have a chance to spend it on other things."
        },
        {
          question_text: "What is a sinking fund?",
          options: ["An emergency fund", "A retirement account", "Money set aside for a specific planned expense", "A type of investment"],
          correct_answer: "Money set aside for a specific planned expense",
          explanation: "A sinking fund is money you set aside regularly for a specific planned expense, like holiday gifts, car repairs, or annual insurance premiums."
        }
      ],
      credit: [
        {
          question_text: "What factor has the biggest impact on your credit score?",
          options: ["Credit utilization", "Payment history", "Length of credit history", "Types of credit"],
          correct_answer: "Payment history",
          explanation: "Payment history accounts for about 35% of your credit score, making it the most important factor in determining your creditworthiness."
        },
        {
          question_text: "What is the recommended credit utilization ratio?",
          options: ["Below 10%", "Below 30%", "Below 50%", "Below 70%"],
          correct_answer: "Below 30%",
          explanation: "Credit experts recommend keeping your credit utilization below 30% of your available credit limit, with below 10% being even better."
        },
        {
          question_text: "How long does a late payment typically stay on your credit report?",
          options: ["1 year", "3 years", "7 years", "10 years"],
          correct_answer: "7 years",
          explanation: "Late payments generally remain on your credit report for seven years from the date of the delinquency."
        },
        {
          question_text: "What is a good credit score range?",
          options: ["300-579", "580-669", "670-739", "740-850"],
          correct_answer: "740-850",
          explanation: "Credit scores range from 300-850, with 740-850 considered very good to exceptional, qualifying you for the best rates and terms."
        },
        {
          question_text: "How often can you check your own credit report for free without affecting your score?",
          options: ["Once a year", "Once every 6 months", "Once a month", "As often as you want"],
          correct_answer: "As often as you want",
          explanation: "Checking your own credit report is considered a 'soft inquiry' and doesn't affect your credit score, so you can check it as often as you want."
        }
      ],
      general: [
        {
          question_text: "What percentage of your income should you aim to save each month?",
          options: ["5%", "10%", "20%", "50%"],
          correct_answer: "20%",
          explanation: "Financial experts typically recommend saving at least 20% of your income, which includes both emergency savings and retirement contributions."
        },
        {
          question_text: "Which of these is the best first step in financial planning?",
          options: ["Investing in stocks", "Creating a budget", "Buying insurance", "Getting a credit card"],
          correct_answer: "Creating a budget",
          explanation: "Creating a budget is the foundation of financial planning as it helps you understand your income, expenses, and spending patterns."
        },
        {
          question_text: "What is compound interest?",
          options: ["Interest paid only on the principal", "Interest paid on both principal and accumulated interest", "A fixed interest rate", "Interest that decreases over time"],
          correct_answer: "Interest paid on both principal and accumulated interest",
          explanation: "Compound interest is when you earn interest on both your initial investment (the principal) and on the interest you've already earned, creating a snowball effect over time."
        },
        {
          question_text: "Which of these is generally NOT considered a liquid asset?",
          options: ["Checking account", "Savings account", "Money market account", "Real estate"],
          correct_answer: "Real estate",
          explanation: "Liquid assets can be quickly converted to cash without significant loss of value. Real estate typically takes time to sell and may have transaction costs, making it less liquid."
        },
        {
          question_text: "What is the rule of 72 used for?",
          options: ["Calculating monthly loan payments", "Estimating how long it takes money to double", "Determining retirement age", "Setting a budget"],
          correct_answer: "Estimating how long it takes money to double",
          explanation: "The Rule of 72 is a simple way to determine how long an investment will take to double given a fixed annual rate of interest. You divide 72 by the annual rate of return."
        }
      ]
    };
    
    // Select questions based on topic
    let questions = defaultQuestions.general;
    if (topic.toLowerCase().includes('budget')) {
      questions = defaultQuestions.budgeting;
    } else if (topic.toLowerCase().includes('invest')) {
      questions = defaultQuestions.investing;
    } else if (topic.toLowerCase().includes('sav')) {
      questions = defaultQuestions.savings;
    } else if (topic.toLowerCase().includes('credit')) {
      questions = defaultQuestions.credit;
    }
    
    // Return the requested number of questions
    return questions.slice(0, count);
  };

  const generateArticleContent = async (topic: string, difficulty: string) => {
    if (!user || !isSupabaseConfigured) return null;

    try {
      console.log('Generating article content:', { topic, difficulty });
      
      // Call the Edge Function to generate article content
      const { data, error } = await supabase.functions.invoke('generate-article-content', {
        body: {
          userId: user.id,
          topic,
          difficulty
        },
      });

      if (error) {
        console.error('Error generating article content:', error);
        throw error;
      }

      console.log('Generated article content:', data);
      return data.content;
    } catch (err) {
      console.error('Error in generateArticleContent:', err);
      
      // Fallback to local generation
      return generateLocalArticleContent(topic, difficulty);
    }
  };

  const generateLocalArticleContent = (topic: string, difficulty: string) => {
    // Default content based on topic
    const defaultContent = {
      budgeting: {
        title: "Mastering Your Budget: A Practical Guide",
        sections: [
          {
            title: "Understanding Your Cash Flow",
            content: "The foundation of any budget is understanding your cash flow - how much money comes in and goes out each month. Start by tracking all income sources and categorizing your expenses for at least 30 days. This baseline will reveal your actual spending patterns rather than what you think they are."
          },
          {
            title: "The 50/30/20 Framework",
            content: "A simple but effective budgeting framework is the 50/30/20 rule. Allocate 50% of your after-tax income to needs (housing, utilities, groceries, transportation), 30% to wants (dining out, entertainment, hobbies), and 20% to savings and debt repayment. This balanced approach ensures you're covering essentials while still enjoying life and building financial security."
          },
          {
            title: "Zero-Based Budgeting",
            content: "In zero-based budgeting, you assign every dollar of income to a specific category until your income minus your expenses equals zero. This doesn't mean spending everything - savings and investments are categories too. The key benefit is intentionality: every dollar has a purpose."
          },
          {
            title: "Practical Implementation",
            content: "Choose a budgeting method that fits your personality. Tech-savvy individuals might prefer apps like YNAB or Mint, while others might prefer spreadsheets or the envelope system. The best budget is one you'll actually use consistently."
          }
        ]
      },
      investing: {
        title: "Investment Fundamentals: Building Wealth Systematically",
        sections: [
          {
            title: "The Power of Compound Interest",
            content: "Albert Einstein allegedly called compound interest the eighth wonder of the world. When you invest, you earn returns not just on your initial investment, but also on the accumulated interest over time. This creates an exponential growth curve that accelerates as time passes."
          },
          {
            title: "Asset Allocation Basics",
            content: "Asset allocation - how you divide your investments among stocks, bonds, and other asset classes - is responsible for about 90% of your portfolio's volatility. Your ideal allocation depends on your time horizon, risk tolerance, and financial goals."
          },
          {
            title: "Index Fund Investing",
            content: "For most investors, low-cost index funds are the most efficient way to invest. Rather than trying to pick winning stocks or time the market (which even professionals struggle to do consistently), index funds give you broad market exposure with minimal fees."
          },
          {
            title: "Dollar-Cost Averaging",
            content: "Investing a fixed amount regularly, regardless of market conditions, is called dollar-cost averaging. This strategy removes the emotional component of investing and prevents the common mistake of buying high and selling low."
          }
        ]
      },
      savings: {
        title: "Strategic Saving: Beyond the Basics",
        sections: [
          {
            title: "Emergency Fund Fundamentals",
            content: "Before focusing on other financial goals, establish an emergency fund covering 3-6 months of essential expenses. Keep this money in a high-yield savings account where it's liquid but still earning some return."
          },
          {
            title: "The Savings Rate Imperative",
            content: "Your savings rate - the percentage of income you save - is the most important factor in building wealth. Even small increases in your savings rate can dramatically accelerate your progress toward financial independence."
          },
          {
            title: "Automating Your Savings",
            content: "Set up automatic transfers to your savings accounts on payday. This 'pay yourself first' approach ensures saving happens before discretionary spending and removes the willpower element from the equation."
          },
          {
            title: "Strategic Savings Buckets",
            content: "Beyond your emergency fund, create separate savings 'buckets' for different goals with different time horizons. Short-term goals (under 3 years) should stay in cash equivalents, while medium-term goals (3-7 years) might include some conservative investments."
          }
        ]
      },
      credit: {
        title: "Mastering Your Credit: Building and Maintaining Excellent Credit",
        sections: [
          {
            title: "Understanding Credit Scores",
            content: "Your credit score is a numerical representation of your creditworthiness, typically ranging from 300-850. The main factors affecting your score are payment history (35%), credit utilization (30%), length of credit history (15%), new credit (10%), and credit mix (10%)."
          },
          {
            title: "Strategic Credit Card Usage",
            content: "Used responsibly, credit cards can be powerful financial tools. Pay your balance in full each month, keep utilization below 30% (ideally below 10%), and choose cards with rewards that match your spending patterns."
          },
          {
            title: "Building Credit from Scratch",
            content: "If you're new to credit, start with a secured credit card or become an authorized user on someone else's account. Make small purchases and pay them off immediately to establish a positive payment history."
          },
          {
            title: "Monitoring and Protecting Your Credit",
            content: "Regularly check your credit reports from all three bureaus for errors or fraudulent activity. You're entitled to free weekly reports from AnnualCreditReport.com. Consider freezing your credit when you're not actively applying for new credit to prevent identity theft."
          }
        ]
      },
      general: {
        title: "Financial Wellness: A Holistic Approach",
        sections: [
          {
            title: "The Financial Wellness Framework",
            content: "Financial wellness goes beyond just having money - it's about having security, freedom of choice, and the ability to absorb financial shocks. The key components are spending less than you earn, having adequate protection, debt management, saving for goals, and investing for the future."
          },
          {
            title: "The Wealth-Building Formula",
            content: "Building wealth comes down to a simple formula: Earn more, spend less, and invest the difference wisely. While simple in concept, each component requires specific strategies and consistent execution."
          },
          {
            title: "Financial Decision-Making",
            content: "Many financial decisions involve tradeoffs between present and future benefits. Developing a decision-making framework that aligns with your values helps ensure your financial choices support your long-term goals while still allowing you to enjoy the present."
          },
          {
            title: "The Psychology of Money",
            content: "Our financial behaviors are driven more by psychology than by math. Understanding your money scripts - unconscious beliefs about money formed in childhood - can help you identify and change patterns that may be hindering your financial progress."
          }
        ]
      }
    };
    
    // Select content based on topic
    let content = defaultContent.general;
    if (topic.toLowerCase().includes('budget')) {
      content = defaultContent.budgeting;
    } else if (topic.toLowerCase().includes('invest')) {
      content = defaultContent.investing;
    } else if (topic.toLowerCase().includes('sav')) {
      content = defaultContent.savings;
    } else if (topic.toLowerCase().includes('credit')) {
      content = defaultContent.credit;
    }
    
    return content;
  };

  const getTodaysPractice = () => {
    // Return the most recent AI-generated module that's not completed
    const incompleteModules = aiModules.filter(module => 
      !module.progress || module.progress.status !== 'completed'
    );
    
    if (incompleteModules.length > 0) {
      return incompleteModules[0];
    }
    
    // If all modules are completed, return the most recent one
    return aiModules.length > 0 ? aiModules[0] : null;
  };

  const getRecommendedModules = () => {
    // Return modules that match user's financial situation
    const userExperience = extendedProfile?.financial_experience || 'Beginner';
    
    return aiModules.filter(module => {
      // Don't recommend completed modules
      if (module.progress?.status === 'completed') return false;
      
      // Match difficulty to user experience
      if (userExperience === 'Beginner' && module.difficulty !== 'Beginner') return false;
      if (userExperience === 'Intermediate' && module.difficulty === 'Advanced') return false;
      
      return true;
    });
  };

  const getCompletedModules = () => {
    return aiModules.filter(module => 
      module.progress?.status === 'completed'
    );
  };

  const getInProgressModules = () => {
    return aiModules.filter(module => 
      module.progress?.status === 'in_progress'
    );
  };

  const getOverallProgress = () => {
    const totalModules = aiModules.length;
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
    aiModules,
    learningPath,
    loading,
    generating,
    error,
    lastUpdated,
    fetchAILearningContent,
    generateAILearningContent,
    startModule,
    completeModule,
    generateQuizQuestions,
    generateArticleContent,
    getTodaysPractice,
    getRecommendedModules,
    getCompletedModules,
    getInProgressModules,
    getOverallProgress
  };
};