import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Award, 
  CheckCircle, 
  BookOpen, 
  BarChart3,
  Zap,
  Target,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useAILearning } from '../hooks/useAILearning';

interface KnowledgeProgressViewProps {
  user: User;
}

const KnowledgeProgressView: React.FC<KnowledgeProgressViewProps> = ({ user }) => {
  const { 
    userKnowledge, 
    difficultyLevel, 
    loading, 
    getKnowledgeByCategory 
  } = useAILearning(user);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-[#2A6F68] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const knowledgeByCategory = getKnowledgeByCategory();
  const categories = Object.keys(knowledgeByCategory);
  
  // Map difficulty level to belt rank
  const getBeltRank = (level: number) => {
    if (level >= 9) return { name: "Master", color: "from-purple-400 to-purple-600", emoji: "👑" };
    if (level >= 7) return { name: "Black Belt", color: "from-gray-800 to-black", emoji: "🥋" };
    if (level >= 6) return { name: "Brown Belt", color: "from-amber-600 to-amber-800", emoji: "🤎" };
    if (level >= 5) return { name: "Blue Belt", color: "from-blue-400 to-blue-600", emoji: "💙" };
    if (level >= 4) return { name: "Green Belt", color: "from-green-400 to-green-600", emoji: "💚" };
    if (level >= 3) return { name: "Yellow Belt", color: "from-yellow-300 to-yellow-500", emoji: "💛" };
    if (level >= 2) return { name: "Orange Belt", color: "from-orange-300 to-orange-500", emoji: "🧡" };
    return { name: "White Belt", color: "from-gray-100 to-gray-300", emoji: "🤍" };
  };

  const beltRank = getBeltRank(difficultyLevel);
  
  // Get proficiency color
  const getProficiencyColor = (level: number) => {
    if (level >= 8) return "text-green-600";
    if (level >= 6) return "text-blue-600";
    if (level >= 4) return "text-yellow-600";
    if (level >= 2) return "text-orange-600";
    return "text-red-600";
  };
  
  // Get proficiency label
  const getProficiencyLabel = (level: number) => {
    if (level >= 8) return "Expert";
    if (level >= 6) return "Advanced";
    if (level >= 4) return "Intermediate";
    if (level >= 2) return "Basic";
    return "Novice";
  };

  return (
    <div className="space-y-6">
      {/* Knowledge Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2A6F68] to-[#B76E79] rounded-lg flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#333333]">Financial Knowledge</h2>
              <p className="text-gray-600">Your financial knowledge progression</p>
            </div>
          </div>
          <div className={`px-4 py-2 bg-gradient-to-r ${beltRank.color} text-white rounded-lg`}>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold">{beltRank.name}</span>
              <span className="text-2xl">{beltRank.emoji}</span>
            </div>
            <div className="text-xs text-center text-white/80">Level {difficultyLevel}</div>
          </div>
        </div>

        {/* Knowledge Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Knowledge Proficiency
            </span>
            <span className="text-sm font-medium text-[#2A6F68]">
              {difficultyLevel}/10
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(difficultyLevel / 10) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-3 rounded-full bg-gradient-to-r from-[#2A6F68] to-[#B76E79]"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Beginner</span>
            <span>Intermediate</span>
            <span>Advanced</span>
            <span>Expert</span>
          </div>
        </div>

        {/* Knowledge Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#2A6F68]/5 rounded-lg p-3 text-center">
            <div className="w-8 h-8 bg-[#2A6F68]/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <BookOpen className="h-4 w-4 text-[#2A6F68]" />
            </div>
            <div className="text-lg font-bold text-[#2A6F68]">{userKnowledge.length}</div>
            <div className="text-xs text-gray-600">Concepts Learned</div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Target className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-blue-600">{categories.length}</div>
            <div className="text-xs text-gray-600">Knowledge Areas</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-lg font-bold text-green-600">
              {userKnowledge.filter(k => k.proficiency_level >= 8).length}
            </div>
            <div className="text-xs text-gray-600">Mastered Concepts</div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Zap className="h-4 w-4 text-yellow-600" />
            </div>
            <div className="text-lg font-bold text-yellow-600">
              {userKnowledge.reduce((sum, k) => sum + k.times_encountered, 0)}
            </div>
            <div className="text-xs text-gray-600">Learning Interactions</div>
          </div>
        </div>
      </motion.div>

      {/* Knowledge Categories */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#333333]">Knowledge Areas</h3>
        
        {categories.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-[#333333] mb-2">No Knowledge Areas Yet</h3>
            <p className="text-gray-600 mb-4">
              Complete lessons and quizzes to build your financial knowledge profile.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category, index) => {
              const categoryData = knowledgeByCategory[category];
              const avgProficiency = categoryData.averageProficiency;
              const proficiencyColor = getProficiencyColor(avgProficiency);
              const proficiencyLabel = getProficiencyLabel(avgProficiency);
              
              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-5 shadow-sm border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#2A6F68]/10 rounded-lg flex items-center justify-center">
                        {category === 'Budgeting' && <BarChart3 className="h-5 w-5 text-[#2A6F68]" />}
                        {category === 'Investing' && <TrendingUp className="h-5 w-5 text-[#2A6F68]" />}
                        {category === 'Savings' && <Target className="h-5 w-5 text-[#2A6F68]" />}
                        {category === 'Debt Management' && <AlertTriangle className="h-5 w-5 text-[#2A6F68]" />}
                        {category === 'Credit' && <Award className="h-5 w-5 text-[#2A6F68]" />}
                        {category === 'Financial Planning' && <Lightbulb className="h-5 w-5 text-[#2A6F68]" />}
                        {!['Budgeting', 'Investing', 'Savings', 'Debt Management', 'Credit', 'Financial Planning'].includes(category) && 
                          <Brain className="h-5 w-5 text-[#2A6F68]" />
                        }
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#333333]">{category}</h4>
                        <div className="flex items-center space-x-1 text-xs">
                          <span className="text-gray-600">{categoryData.concepts.length} concepts</span>
                          <span className="text-gray-400">•</span>
                          <span className={proficiencyColor}>{proficiencyLabel}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${proficiencyColor}`}>
                        {avgProficiency.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Proficiency
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(avgProficiency / 10) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-2 rounded-full ${
                          avgProficiency >= 8 ? 'bg-green-500' :
                          avgProficiency >= 6 ? 'bg-blue-500' :
                          avgProficiency >= 4 ? 'bg-yellow-500' :
                          avgProficiency >= 2 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>
                  
                  {/* Concepts List */}
                  <div className="space-y-2">
                    {categoryData.concepts.slice(0, 3).map((concept, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{concept.name}</span>
                        <span className={getProficiencyColor(concept.proficiency)}>
                          {concept.proficiency}/10
                        </span>
                      </div>
                    ))}
                    
                    {categoryData.concepts.length > 3 && (
                      <div className="text-xs text-[#2A6F68] font-medium text-center mt-2">
                        +{categoryData.concepts.length - 3} more concepts
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Learning Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-[#2A6F68]/5 to-[#B76E79]/5 rounded-xl p-6 border border-[#2A6F68]/20"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-[#2A6F68] rounded-lg flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-[#2A6F68]">Learning Recommendations</h3>
        </div>
        
        <div className="space-y-3">
          {userKnowledge.length === 0 ? (
            <p className="text-gray-700">
              Complete lessons and quizzes to receive personalized learning recommendations based on your knowledge profile.
            </p>
          ) : (
            <>
              {userKnowledge.filter(k => k.proficiency_level <= 3 && k.times_encountered >= 2).length > 0 && (
                <div className="bg-white/60 rounded-lg p-4 border border-white/40">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Focus Areas</h4>
                      <p className="text-sm text-gray-700">
                        Consider reviewing these concepts you're still mastering:
                      </p>
                      <ul className="mt-2 space-y-1">
                        {userKnowledge
                          .filter(k => k.proficiency_level <= 3 && k.times_encountered >= 2)
                          .slice(0, 3)
                          .map((k, i) => (
                            <li key={i} className="text-sm text-orange-700 flex items-center space-x-1">
                              <span>•</span>
                              <span>{k.concept.concept_name}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white/60 rounded-lg p-4 border border-white/40">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-5 w-5 text-[#2A6F68] mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Next Level Concepts</h4>
                    <p className="text-sm text-gray-700">
                      Based on your current knowledge level, these concepts would be good to explore next:
                    </p>
                    <ul className="mt-2 space-y-1">
                      {difficultyLevel <= 3 ? (
                        <>
                          <li className="text-sm text-[#2A6F68] flex items-center space-x-1">
                            <span>•</span>
                            <span>Debt-to-Income Ratio</span>
                          </li>
                          <li className="text-sm text-[#2A6F68] flex items-center space-x-1">
                            <span>•</span>
                            <span>Credit Utilization</span>
                          </li>
                          <li className="text-sm text-[#2A6F68] flex items-center space-x-1">
                            <span>•</span>
                            <span>High-Yield Savings</span>
                          </li>
                        </>
                      ) : difficultyLevel <= 6 ? (
                        <>
                          <li className="text-sm text-[#2A6F68] flex items-center space-x-1">
                            <span>•</span>
                            <span>Index Fund Investing</span>
                          </li>
                          <li className="text-sm text-[#2A6F68] flex items-center space-x-1">
                            <span>•</span>
                            <span>Asset Allocation</span>
                          </li>
                          <li className="text-sm text-[#2A6F68] flex items-center space-x-1">
                            <span>•</span>
                            <span>Tax-Advantaged Accounts</span>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="text-sm text-[#2A6F68] flex items-center space-x-1">
                            <span>•</span>
                            <span>Tax-Loss Harvesting</span>
                          </li>
                          <li className="text-sm text-[#2A6F68] flex items-center space-x-1">
                            <span>•</span>
                            <span>Asset Location Optimization</span>
                          </li>
                          <li className="text-sm text-[#2A6F68] flex items-center space-x-1">
                            <span>•</span>
                            <span>Retirement Withdrawal Strategies</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
              
              {userKnowledge.filter(k => k.proficiency_level >= 8).length > 0 && (
                <div className="bg-white/60 rounded-lg p-4 border border-white/40">
                  <div className="flex items-start space-x-3">
                    <Award className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Mastered Concepts</h4>
                      <p className="text-sm text-gray-700">
                        You've demonstrated mastery in these financial concepts:
                      </p>
                      <ul className="mt-2 space-y-1">
                        {userKnowledge
                          .filter(k => k.proficiency_level >= 8)
                          .slice(0, 3)
                          .map((k, i) => (
                            <li key={i} className="text-sm text-green-700 flex items-center space-x-1">
                              <span>•</span>
                              <span>{k.concept.concept_name}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default KnowledgeProgressView;