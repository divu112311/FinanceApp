import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useBankAccounts } from './useBankAccounts';
import { useGoals } from './useGoals';
import { useTransactions } from './useTransactions';

interface SmartWin {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  type: 'savings' | 'spending' | 'investment' | 'goal' | 'opportunity';
  impact: number | null;
  actionable: boolean;
  action_text: string | null;
  created_at: string;
  expires_at: string | null;
}

export const useSmartWins = (user: User | null) => {
  const [smartWins, setSmartWins] = useState<SmartWin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { bankAccounts, totalBalance } = useBankAccounts(user);
  const { goals } = useGoals(user);
  const { transactions, getTransactionsByCategory, getTotalSpending, getTotalIncome } = useTransactions(user);

  useEffect(() => {
    if (user) {
      fetchSmartWins();
    }
  }, [user]);

  const fetchSmartWins = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      console.log('Fetching smart wins for user:', user.id);
      
      // Check if smart_wins table exists
      const { count, error: tableCheckError } = await supabase
        .from('smart_wins')
        .select('*', { count: 'exact', head: true });
      
      // If table doesn't exist, generate wins algorithmically
      if (tableCheckError) {
        console.log('Smart wins table not found, generating algorithmically');
        const generatedWins = generateSmartWins();
        setSmartWins(generatedWins);
        setLastUpdated(new Date());
        setLoading(false);
        return;
      }

      // Table exists, fetch from database
      const { data, error } = await supabase
        .from('smart_wins')
        .select('*')
        .eq('user_id', user.id)
        .is('expires_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching smart wins:', error);
        setError(error.message);
        // Fall back to algorithmic generation
        const generatedWins = generateSmartWins();
        setSmartWins(generatedWins);
      } else {
        console.log(`Fetched ${data?.length || 0} smart wins`);
        
        // If no wins in database or wins are outdated, generate new ones
        if (!data || data.length === 0) {
          console.log('No smart wins found, generating new ones');
          const generatedWins = generateSmartWins();
          setSmartWins(generatedWins);
          
          // Try to store generated wins if table exists
          try {
            const winsToInsert = generatedWins.map(win => ({
              ...win,
              user_id: user.id
            }));
            
            await supabase
              .from('smart_wins')
              .insert(winsToInsert);
          } catch (insertError) {
            console.error('Error storing generated wins:', insertError);
          }
        } else {
          // Check if wins need to be refreshed (Monday 8am)
          const shouldRefresh = checkIfWinsNeedRefresh(data[0].created_at);
          
          if (shouldRefresh) {
            console.log('Smart wins are outdated, generating new ones');
            const generatedWins = generateSmartWins();
            setSmartWins(generatedWins);
            
            // Update database with new wins
            try {
              // First expire old wins
              await supabase
                .from('smart_wins')
                .update({ expires_at: new Date().toISOString() })
                .eq('user_id', user.id)
                .is('expires_at', null);
              
              // Then insert new wins
              const winsToInsert = generatedWins.map(win => ({
                ...win,
                user_id: user.id
              }));
              
              await supabase
                .from('smart_wins')
                .insert(winsToInsert);
            } catch (updateError) {
              console.error('Error updating smart wins:', updateError);
            }
          } else {
            setSmartWins(data);
          }
        }
      }
      
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error in fetchSmartWins:', err);
      setError(err.message);
      // Fall back to algorithmic generation
      const generatedWins = generateSmartWins();
      setSmartWins(generatedWins);
    } finally {
      setLoading(false);
    }
  };

  // Check if wins need to be refreshed (every Monday at 8am)
  const checkIfWinsNeedRefresh = (createdAt: string): boolean => {
    const now = new Date();
    const created = new Date(createdAt);
    const daysSinceCreation = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    
    // If more than 7 days old, refresh
    if (daysSinceCreation >= 7) return true;
    
    // If it's Monday and the wins were not created today
    if (now.getDay() === 1 && now.getHours() >= 8) {
      const createdDay = created.getDate();
      const createdMonth = created.getMonth();
      const createdYear = created.getFullYear();
      
      const todayDay = now.getDate();
      const todayMonth = now.getMonth();
      const todayYear = now.getFullYear();
      
      // If not created today, refresh
      if (createdDay !== todayDay || createdMonth !== todayMonth || createdYear !== todayYear) {
        return true;
      }
    }
    
    return false;
  };

  // Generate smart wins algorithmically based on user data
  const generateSmartWins = (): SmartWin[] => {
    const wins: SmartWin[] = [];
    const now = new Date();

    // 1. Check for excess checking balance
    const checkingAccounts = bankAccounts.filter(acc => 
      acc.type === 'depository' && 
      (acc.account_subtype === 'checking' || acc.subtype === 'checking')
    );
    
    const totalChecking = checkingAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    
    if (totalChecking > 5000) {
      wins.push({
        id: crypto.randomUUID(), // Generate UUID client-side
        title: "Optimize Excess Cash",
        description: `Move $${Math.floor((totalChecking - 3000) / 100) * 100} from checking to high-yield savings for better returns`,
        type: 'opportunity',
        impact: Math.floor((totalChecking - 3000) * 0.04), // Assuming 4% APY difference
        actionable: true,
        action_text: "Set up transfer",
        created_at: now.toISOString(),
        expires_at: null
      });
    }

    // 2. Check for spending optimization
    if (transactions.length > 0) {
      const categories = getTransactionsByCategory();
      
      // Find subscription or recurring expenses
      const subscriptionCategories = ['Subscription', 'Entertainment', 'Recreation'];
      const subscriptionTransactions = transactions.filter(t => 
        t.amount > 0 && // Spending only
        subscriptionCategories.some(cat => 
          t.category?.includes(cat) || 
          t.name?.toLowerCase().includes('subscription') ||
          t.name?.toLowerCase().includes('netflix') ||
          t.name?.toLowerCase().includes('spotify') ||
          t.name?.toLowerCase().includes('hulu')
        )
      );
      
      if (subscriptionTransactions.length > 0) {
        const potentialSavings = Math.min(
          subscriptionTransactions.reduce((sum, t) => sum + t.amount, 0) * 0.3,
          80
        );
        
        if (potentialSavings > 20) {
          wins.push({
            id: crypto.randomUUID(), // Generate UUID client-side
            title: "Review Subscriptions",
            description: `Most people save $${Math.floor(potentialSavings)}-${Math.floor(potentialSavings * 1.5)}/month by auditing recurring subscriptions`,
            type: 'spending',
            impact: potentialSavings * 12, // Annual savings
            actionable: true,
            action_text: "Review subscriptions",
            created_at: now.toISOString(),
            expires_at: null
          });
        }
      }
      
      // Find high spending category
      if (categories.length > 0) {
        const topCategory = categories[0];
        const monthlyIncome = getTotalIncome();
        
        if (topCategory.amount > monthlyIncome * 0.2) {
          wins.push({
            id: crypto.randomUUID(), // Generate UUID client-side
            title: `Reduce ${topCategory.category} Spending`,
            description: `Cutting ${topCategory.category} spending by 15% would save you $${Math.floor(topCategory.amount * 0.15)} monthly`,
            type: 'spending',
            impact: Math.floor(topCategory.amount * 0.15 * 12), // Annual savings
            actionable: true,
            action_text: "See spending breakdown",
            created_at: now.toISOString(),
            expires_at: null
          });
        }
      }
    }

    // 3. Check for goal automation opportunity
    if (goals.length > 0) {
      const totalMonthlyGoalAmount = goals.reduce((sum, goal) => {
        // Calculate monthly amount needed based on deadline
        if (goal.deadline || goal.target_date) {
          const deadline = new Date(goal.deadline || goal.target_date || '');
          const monthsRemaining = Math.max(1, Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
          const amountRemaining = (goal.target_amount || 0) - (goal.saved_amount || goal.current_amount || 0);
          return sum + (amountRemaining / monthsRemaining);
        }
        return sum;
      }, 0);
      
      if (totalMonthlyGoalAmount > 100) {
        wins.push({
          id: crypto.randomUUID(), // Generate UUID client-side
          title: "Automate Goal Contributions",
          description: `Automatically save $${Math.ceil(totalMonthlyGoalAmount / 100) * 100} monthly to reach your goals faster`,
          type: 'goal',
          impact: null,
          actionable: true,
          action_text: "Set up automation",
          created_at: now.toISOString(),
          expires_at: null
        });
      }
    }

    // 4. Check for savings opportunity
    const savingsRate = getTotalIncome() > 0 
      ? ((getTotalIncome() - getTotalSpending()) / getTotalIncome()) * 100 
      : 0;
    
    if (savingsRate < 20 && getTotalIncome() > 0) {
      const targetSavings = getTotalIncome() * 0.2;
      const currentSavings = getTotalIncome() - getTotalSpending();
      const additionalSavingsNeeded = targetSavings - currentSavings;
      
      if (additionalSavingsNeeded > 100) {
        wins.push({
          id: crypto.randomUUID(), // Generate UUID client-side
          title: "Boost Your Savings Rate",
          description: `Saving an additional $${Math.ceil(additionalSavingsNeeded / 50) * 50}/month would get you to the recommended 20% savings rate`,
          type: 'savings',
          impact: Math.ceil(additionalSavingsNeeded / 50) * 50 * 12, // Annual impact
          actionable: true,
          action_text: "Create savings plan",
          created_at: now.toISOString(),
          expires_at: null
        });
      }
    }

    // 5. Check for investment opportunity
    if (totalBalance > 10000 && !bankAccounts.some(acc => acc.type === 'investment')) {
      wins.push({
        id: crypto.randomUUID(), // Generate UUID client-side
        title: "Start Investing",
        description: `Investing just 10% of your balance ($${Math.floor(totalBalance * 0.1)}) could yield $${Math.floor(totalBalance * 0.1 * 0.07)} annually at 7% average return`,
        type: 'investment',
        impact: Math.floor(totalBalance * 0.1 * 0.07), // Annual return
        actionable: true,
        action_text: "Explore investment options",
        created_at: now.toISOString(),
        expires_at: null
      });
    }

    // If we don't have enough wins, add some generic ones
    if (wins.length < 3) {
      if (wins.length < 1) {
        wins.push({
          id: crypto.randomUUID(), // Generate UUID client-side
          title: "Track Your Spending",
          description: "Most people find 10-15% in savings just by tracking expenses for 30 days",
          type: 'spending',
          impact: null,
          actionable: true,
          action_text: "Start tracking",
          created_at: now.toISOString(),
          expires_at: null
        });
      }
      
      if (wins.length < 2) {
        wins.push({
          id: crypto.randomUUID(), // Generate UUID client-side
          title: "Set Up Automatic Savings",
          description: "Automating your savings can increase your savings rate by up to 20%",
          type: 'savings',
          impact: null,
          actionable: true,
          action_text: "Set up automation",
          created_at: now.toISOString(),
          expires_at: null
        });
      }
      
      if (wins.length < 3) {
        wins.push({
          id: crypto.randomUUID(), // Generate UUID client-side
          title: "Create an Emergency Fund",
          description: "Start with $500 as a mini emergency fund to handle unexpected expenses",
          type: 'savings',
          impact: null,
          actionable: true,
          action_text: "Create fund",
          created_at: now.toISOString(),
          expires_at: null
        });
      }
    }

    return wins.slice(0, 3); // Return max 3 wins
  };

  return {
    smartWins,
    loading,
    error,
    lastUpdated,
    fetchSmartWins,
    refetch: fetchSmartWins
  };
};