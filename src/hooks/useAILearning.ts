import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface UserKnowledge {
  knowledge_id: string;
  user_id: string;
  concept_id: string;
  proficiency_level: number;
  confidence_score: number;
  last_assessed: string;
  times_encountered: number;
  times_answered_correctly: number;
  concept: {
    concept_name: string;
    concept_category: string;
    difficulty_level: number;
  };
}

interface FinancialConcept {
  concept_id: string;
  concept_name: string;
  concept_category: string;
  difficulty_level: number;
  description: string;
  prerequisites: any[];
  related_concepts: any[];
}

interface CategoryKnowledge {
  concepts: {
    name: string;
    proficiency: number;
    confidence: number;
    id: string;
  }[];
  averageProficiency: number;
  totalConcepts: number;
}

export const useAILearning = (user: User | null) => {
  const [userKnowledge, setUserKnowledge] = useState<UserKnowledge[]>([]);
  const [concepts, setConcepts] = useState<FinancialConcept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && isSupabaseConfigured) {
      fetchKnowledgeData();
    } else {
      setLoading(false);
      setUserKnowledge(generateDemoKnowledge());
      setConcepts(generateDemoConcepts());
    }
  }, [user]);

  const fetchKnowledgeData = async () => {
    setLoading(true);
    try {
      // Fetch user knowledge areas with concept details
      const { data: knowledgeData, error: knowledgeError } = await supabase
        .from('user_knowledge_areas')
        .select(`
          *,
          concept:concept_id(
            concept_name,
            concept_category,
            difficulty_level
          )
        `)
        .eq('user_id', user?.id);

      if (knowledgeError) throw knowledgeError;
      
      // Fetch all financial concepts
      const { data: conceptsData, error: conceptsError } = await supabase
        .from('financial_concepts')
        .select('*');

      if (conceptsError) throw conceptsError;
      
      setUserKnowledge(knowledgeData || []);
      setConcepts(conceptsData || []);
    } catch (err: any) {
      console.error('Error fetching knowledge data:', err);
      setError(err.message);
      
      // Set demo data on error
      setUserKnowledge(generateDemoKnowledge());
      setConcepts(generateDemoConcepts());
    } finally {
      setLoading(false);
    }
  };

  const getKnowledgeByCategory = (): Record<string, CategoryKnowledge> => {
    const categories: Record<string, CategoryKnowledge> = {};
    
    userKnowledge.forEach(knowledge => {
      const category = knowledge.concept.concept_category;
      
      if (!categories[category]) {
        categories[category] = {
          concepts: [],
          averageProficiency: 0,
          totalConcepts: 0
        };
      }
      
      categories[category].concepts.push({
        name: knowledge.concept.concept_name,
        proficiency: knowledge.proficiency_level,
        confidence: knowledge.confidence_score,
        id: knowledge.concept_id
      });
      
      categories[category].totalConcepts++;
    });
    
    // Calculate average proficiency for each category
    Object.keys(categories).forEach(category => {
      const totalProficiency = categories[category].concepts.reduce(
        (sum, concept) => sum + concept.proficiency, 0
      );
      
      categories[category].averageProficiency = 
        totalProficiency / categories[category].totalConcepts;
    });
    
    return categories;
  };

  const getMasteredConcepts = () => {
    return userKnowledge.filter(k => k.proficiency_level >= 8);
  };

  const getStrugglingConcepts = () => {
    return userKnowledge.filter(
      k => k.proficiency_level <= 3 && k.times_encountered >= 3
    );
  };

  const getRecommendedConcepts = (limit: number = 5) => {
    // Get concepts that are not yet mastered but have been started
    const inProgressConcepts = userKnowledge.filter(
      k => k.proficiency_level < 8 && k.proficiency_level > 1
    );
    
    // Sort by a combination of proficiency and times encountered
    // Prioritize concepts that have been encountered more but still have low proficiency
    return inProgressConcepts
      .sort((a, b) => {
        const aScore = a.times_encountered / a.proficiency_level;
        const bScore = b.times_encountered / b.proficiency_level;
        return bScore - aScore;
      })
      .slice(0, limit);
  };

  const getNewConceptsToLearn = (limit: number = 5) => {
    // Get concepts that haven't been started yet
    const knownConceptIds = new Set(userKnowledge.map(k => k.concept_id));
    const newConcepts = concepts.filter(c => !knownConceptIds.has(c.concept_id));
    
    // Sort by difficulty level (easier first)
    return newConcepts
      .sort((a, b) => a.difficulty_level - b.difficulty_level)
      .slice(0, limit);
  };

  // Generate demo knowledge data for testing
  const generateDemoKnowledge = (): UserKnowledge[] => {
    return [
      {
        knowledge_id: 'k1',
        user_id: user?.id || 'demo',
        concept_id: 'c1',
        proficiency_level: 7,
        confidence_score: 0.8,
        last_assessed: new Date().toISOString(),
        times_encountered: 5,
        times_answered_correctly: 4,
        concept: {
          concept_name: 'Budgeting Basics',
          concept_category: 'Budgeting',
          difficulty_level: 1
        }
      },
      {
        knowledge_id: 'k2',
        user_id: user?.id || 'demo',
        concept_id: 'c2',
        proficiency_level: 5,
        confidence_score: 0.6,
        last_assessed: new Date().toISOString(),
        times_encountered: 3,
        times_answered_correctly: 2,
        concept: {
          concept_name: '50/30/20 Rule',
          concept_category: 'Budgeting',
          difficulty_level: 2
        }
      },
      {
        knowledge_id: 'k3',
        user_id: user?.id || 'demo',
        concept_id: 'c3',
        proficiency_level: 8,
        confidence_score: 0.9,
        last_assessed: new Date().toISOString(),
        times_encountered: 6,
        times_answered_correctly: 5,
        concept: {
          concept_name: 'Emergency Fund',
          concept_category: 'Savings',
          difficulty_level: 1
        }
      },
      {
        knowledge_id: 'k4',
        user_id: user?.id || 'demo',
        concept_id: 'c4',
        proficiency_level: 3,
        confidence_score: 0.4,
        last_assessed: new Date().toISOString(),
        times_encountered: 4,
        times_answered_correctly: 1,
        concept: {
          concept_name: 'Compound Interest',
          concept_category: 'Investing',
          difficulty_level: 2
        }
      },
      {
        knowledge_id: 'k5',
        user_id: user?.id || 'demo',
        concept_id: 'c5',
        proficiency_level: 6,
        confidence_score: 0.7,
        last_assessed: new Date().toISOString(),
        times_encountered: 4,
        times_answered_correctly: 3,
        concept: {
          concept_name: 'Credit Utilization',
          concept_category: 'Credit',
          difficulty_level: 2
        }
      }
    ];
  };

  // Generate demo concepts for testing
  const generateDemoConcepts = (): FinancialConcept[] => {
    return [
      {
        concept_id: 'c1',
        concept_name: 'Budgeting Basics',
        concept_category: 'Budgeting',
        difficulty_level: 1,
        description: 'Understanding the fundamentals of creating and maintaining a budget',
        prerequisites: [],
        related_concepts: []
      },
      {
        concept_id: 'c2',
        concept_name: '50/30/20 Rule',
        concept_category: 'Budgeting',
        difficulty_level: 2,
        description: 'Allocating 50% to needs, 30% to wants, and 20% to savings and debt repayment',
        prerequisites: ['c1'],
        related_concepts: []
      },
      {
        concept_id: 'c3',
        concept_name: 'Emergency Fund',
        concept_category: 'Savings',
        difficulty_level: 1,
        description: 'Setting aside 3-6 months of expenses for unexpected situations',
        prerequisites: [],
        related_concepts: []
      },
      {
        concept_id: 'c4',
        concept_name: 'Compound Interest',
        concept_category: 'Investing',
        difficulty_level: 2,
        description: 'Interest calculated on initial principal and accumulated interest',
        prerequisites: [],
        related_concepts: []
      },
      {
        concept_id: 'c5',
        concept_name: 'Credit Utilization',
        concept_category: 'Credit',
        difficulty_level: 2,
        description: 'The ratio of current credit card balances to credit limits',
        prerequisites: [],
        related_concepts: []
      },
      {
        concept_id: 'c6',
        concept_name: 'Index Funds',
        concept_category: 'Investing',
        difficulty_level: 3,
        description: 'Investment funds that track market indexes like S&P 500',
        prerequisites: ['c4'],
        related_concepts: []
      },
      {
        concept_id: 'c7',
        concept_name: 'Debt Avalanche',
        concept_category: 'Debt Management',
        difficulty_level: 2,
        description: 'Paying off debts with highest interest rates first',
        prerequisites: [],
        related_concepts: []
      }
    ];
  };

  return {
    userKnowledge,
    concepts,
    loading,
    error,
    getKnowledgeByCategory,
    getMasteredConcepts,
    getStrugglingConcepts,
    getRecommendedConcepts,
    getNewConceptsToLearn,
    refetch: fetchKnowledgeData
  };
};