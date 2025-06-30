import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  X, 
  Clock, 
  Award, 
  ArrowRight, 
  ArrowLeft,
  Brain,
  Target,
  Zap,
  Star,
  Trophy,
  Sparkles
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface QuizQuestion {
  id?: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  points?: number;
  concept_id?: string;
}

interface QuizInterfaceProps {
  moduleId: string;
  moduleTitle: string;
  user: User;
  onComplete: (score: number, xpEarned: number, results: any[]) => void;
  onClose: () => void;
  questions?: QuizQuestion[];
  isLoading?: boolean;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({
  moduleId,
  moduleTitle,
  user,
  onComplete,
  onClose,
  questions: providedQuestions,
  isLoading = false
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    console.log('=== QUIZ INTERFACE MOUNTED ===');
    console.log('Module ID:', moduleId);
    console.log('Module Title:', moduleTitle);
    console.log('Provided Questions:', providedQuestions);
    
    if (providedQuestions && providedQuestions.length > 0) {
      console.log('Using provided questions');
      setQuestions(providedQuestions);
      setUserAnswers(new Array(providedQuestions.length).fill(''));
      setResults(new Array(providedQuestions.length).fill(null));
      setLoading(false);
      return;
    }
    
    // If this is the budgeting mastery quiz, use hardcoded questions
    if (moduleId === 'budgeting-mastery-quiz') {
      const budgetingQuestions = getBudgetingQuizQuestions();
      setQuestions(budgetingQuestions);
      setUserAnswers(new Array(budgetingQuestions.length).fill(''));
      setResults(new Array(budgetingQuestions.length).fill(null));
      setLoading(false);
      return;
    }
    
    // Otherwise fetch from database
    fetchQuizQuestions();
  }, [moduleId, providedQuestions]);

  useEffect(() => {
    if (!quizCompleted) {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quizCompleted]);

  const getBudgetingQuizQuestions = (): QuizQuestion[] => {
    return [
      {
        question_text: 'What does the 50/30/20 budgeting rule recommend for needs?',
        options: ['30% of income', '50% of income', '20% of income', '70% of income'],
        correct_answer: '50% of income',
        explanation: 'The 50/30/20 rule suggests allocating 50% of your after-tax income to needs, 30% to wants, and 20% to savings and debt repayment.',
        points: 5
      },
      {
        question_text: 'Which of the following is considered a "need" in budgeting?',
        options: ['Netflix subscription', 'Housing costs', 'Dining out', 'New clothes'],
        correct_answer: 'Housing costs',
        explanation: 'Housing costs (rent/mortgage, utilities) are essential needs, while entertainment subscriptions and dining out are typically categorized as wants.',
        points: 5
      },
      {
        question_text: 'What is zero-based budgeting?',
        options: [
          'Spending zero money each month', 
          'Assigning every dollar of income to a specific purpose', 
          'Having zero debt', 
          'Saving zero money'
        ],
        correct_answer: 'Assigning every dollar of income to a specific purpose',
        explanation: 'Zero-based budgeting means giving every dollar a job so your income minus your expenses equals zero. This doesn\'t mean spending everything, but rather allocating all income to categories including savings and investments.',
        points: 5
      },
      {
        question_text: 'Which budgeting method is best for variable income?',
        options: [
          'Envelope system', 
          'Pay yourself first', 
          'Zero-based budgeting', 
          'Priority-based budgeting'
        ],
        correct_answer: 'Priority-based budgeting',
        explanation: 'Priority-based budgeting works well for variable income because it focuses on covering essential expenses first, then moving down your priority list as more income becomes available.',
        points: 5
      },
      {
        question_text: 'What is the envelope budgeting system?',
        options: [
          'Putting your budget in an envelope and mailing it to yourself', 
          'Allocating cash to different envelopes for different spending categories', 
          'Saving money in envelopes', 
          'Paying bills with envelopes'
        ],
        correct_answer: 'Allocating cash to different envelopes for different spending categories',
        explanation: 'The envelope system involves putting cash into physical or digital envelopes labeled for different spending categories. When an envelope is empty, you stop spending in that category until the next budget period.',
        points: 5
      }
    ];
  };

  const fetchQuizQuestions = async () => {
    console.log('=== FETCHING QUIZ QUESTIONS ===');
    console.log('Module ID:', moduleId);
    
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('module_id', moduleId)
        .order('created_at');

      console.log('Quiz questions response:', { data, error });

      if (error) {
        console.error('Error fetching quiz questions:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('No quiz questions found for module:', moduleId);
        // Use default questions if none found
        const defaultQuestions = [
          {
            question_text: "What does the 50/30/20 budgeting rule recommend for needs?",
            options: ["30% of income", "50% of income", "20% of income", "70% of income"],
            correct_answer: "50% of income",
            explanation: "The 50/30/20 rule suggests allocating 50% of your after-tax income to needs, 30% to wants, and 20% to savings and debt repayment.",
            points: 10
          },
          {
            question_text: "Which of these is typically considered a 'need' in budgeting?",
            options: ["Netflix subscription", "Housing costs", "Dining out", "New clothes"],
            correct_answer: "Housing costs",
            explanation: "Needs are expenses that are essential for living, such as housing, utilities, groceries, and basic transportation.",
            points: 10
          },
          {
            question_text: "What is the recommended minimum amount for an emergency fund?",
            options: ["$100", "$500", "1 month of expenses", "3-6 months of expenses"],
            correct_answer: "3-6 months of expenses",
            explanation: "Financial experts generally recommend having 3-6 months of essential expenses saved in an emergency fund.",
            points: 10
          },
          {
            question_text: "Which type of account typically offers the highest interest rate?",
            options: ["Checking account", "Traditional savings account", "High-yield savings account", "Money market account"],
            correct_answer: "High-yield savings account",
            explanation: "High-yield savings accounts, often offered by online banks, typically provide much higher interest rates than traditional bank accounts.",
            points: 10
          },
          {
            question_text: "What is the first recommended step in creating a financial plan?",
            options: ["Investing in stocks", "Creating a budget", "Opening a credit card", "Taking out a loan"],
            correct_answer: "Creating a budget",
            explanation: "A budget is the foundation of any financial plan, as it helps you understand your income, expenses, and where your money is going.",
            points: 10
          }
        ];
        setQuestions(defaultQuestions);
        setUserAnswers(new Array(defaultQuestions.length).fill(''));
        setResults(new Array(defaultQuestions.length).fill(null));
        setLoading(false);
        return;
      }

      const formattedQuestions = data.map(q => {
        let options = [];
        try {
          // Handle different option formats
          if (typeof q.options === 'string') {
            options = JSON.parse(q.options);
          } else if (Array.isArray(q.options)) {
            options = q.options;
          } else {
            console.warn('Invalid options format for question:', q.id);
            options = [];
          }
        } catch (e) {
          console.error('Error parsing options for question:', q.id, e);
          options = [];
        }

        return {
          ...q,
          options
        };
      });

      console.log('Formatted questions:', formattedQuestions);
      setQuestions(formattedQuestions);
      setUserAnswers(new Array(formattedQuestions.length).fill(''));
      setResults(new Array(formattedQuestions.length).fill(null));
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
      // Use default questions if fetch fails
      const defaultQuestions = [
        {
          question_text: "What does the 50/30/20 budgeting rule recommend for needs?",
          options: ["30% of income", "50% of income", "20% of income", "70% of income"],
          correct_answer: "50% of income",
          explanation: "The 50/30/20 rule suggests allocating 50% of your after-tax income to needs, 30% to wants, and 20% to savings and debt repayment.",
          points: 10
        },
        {
          question_text: "Which of these is typically considered a 'need' in budgeting?",
          options: ["Netflix subscription", "Housing costs", "Dining out", "New clothes"],
          correct_answer: "Housing costs",
          explanation: "Needs are expenses that are essential for living, such as housing, utilities, groceries, and basic transportation.",
          points: 10
        },
        {
          question_text: "What is the recommended minimum amount for an emergency fund?",
          options: ["$100", "$500", "1 month of expenses", "3-6 months of expenses"],
          correct_answer: "3-6 months of expenses",
          explanation: "Financial experts generally recommend having 3-6 months of essential expenses saved in an emergency fund.",
          points: 10
        },
        {
          question_text: "Which type of account typically offers the highest interest rate?",
          options: ["Checking account", "Traditional savings account", "High-yield savings account", "Money market account"],
          correct_answer: "High-yield savings account",
          explanation: "High-yield savings accounts, often offered by online banks, typically provide much higher interest rates than traditional bank accounts.",
          points: 10
        },
        {
          question_text: "What is the first recommended step in creating a financial plan?",
          options: ["Investing in stocks", "Creating a budget", "Opening a credit card", "Taking out a loan"],
          correct_answer: "Creating a budget",
          explanation: "A budget is the foundation of any financial plan, as it helps you understand your income, expenses, and where your money is going.",
          points: 10
        }
      ];
      setQuestions(defaultQuestions);
      setUserAnswers(new Array(defaultQuestions.length).fill(''));
      setResults(new Array(defaultQuestions.length).fill(null));
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    console.log('=== ANSWER SELECTED ===');
    console.log('Selected answer:', answer);
    console.log('Show explanation:', showExplanation);
    
    if (showExplanation) {
      console.log('Explanation already shown, ignoring click');
      return;
    }
    
    setSelectedAnswer(answer);
    console.log('Answer set to:', answer);
  };

  const handleSubmitAnswer = () => {
    console.log('=== SUBMITTING ANSWER ===');
    console.log('Selected answer:', selectedAnswer);
    console.log('Show explanation:', showExplanation);
    
    if (!selectedAnswer || showExplanation) {
      console.log('No answer selected or explanation already shown');
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    console.log('Current question:', currentQuestion);
    console.log('Correct answer:', currentQuestion.correct_answer);
    
    const correct = selectedAnswer === currentQuestion.correct_answer;
    console.log('Answer is correct:', correct);
    
    setIsCorrect(correct);
    setShowExplanation(true);
    
    // Update user answers
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setUserAnswers(newAnswers);
    console.log('Updated user answers:', newAnswers);

    // Update results
    const newResults = [...results];
    newResults[currentQuestionIndex] = {
      questionId: currentQuestion.id || `q-${currentQuestionIndex}`,
      question: currentQuestion,
      userAnswer: selectedAnswer,
      isCorrect: correct
    };
    setResults(newResults);

    if (correct) {
      const newScore = score + (currentQuestion.points || 10);
      setScore(newScore);
      console.log('Score updated to:', newScore);
    }
  };

  const handleNextQuestion = () => {
    console.log('=== NEXT QUESTION CLICKED ===');
    console.log('Current index:', currentQuestionIndex);
    console.log('Total questions:', questions.length);
    
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      console.log('Moving to question:', nextIndex);
      
      // Move to next question and reset state
      setCurrentQuestionIndex(nextIndex);
      
      // Check if next question was already answered
      const nextAnswer = userAnswers[nextIndex];
      if (nextAnswer) {
        // Question was already answered, show the answer and explanation
        setSelectedAnswer(nextAnswer);
        setShowExplanation(true);
        const nextQuestion = questions[nextIndex];
        setIsCorrect(nextAnswer === nextQuestion.correct_answer);
      } else {
        // Fresh question, reset everything
        setSelectedAnswer('');
        setShowExplanation(false);
        setIsCorrect(false);
      }
      
      console.log('State updated for question:', nextIndex);
    } else {
      console.log('Quiz completed - all questions answered');
      completeQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    console.log('=== PREVIOUS QUESTION ===');
    
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      console.log('Moving to question:', prevIndex);
      
      setCurrentQuestionIndex(prevIndex);
      
      // Check if this question was already answered
      const prevAnswer = userAnswers[prevIndex];
      if (prevAnswer) {
        setSelectedAnswer(prevAnswer);
        setShowExplanation(true);
        const prevQuestion = questions[prevIndex];
        setIsCorrect(prevAnswer === prevQuestion.correct_answer);
      } else {
        setSelectedAnswer('');
        setShowExplanation(false);
        setIsCorrect(false);
      }
    }
  };

  const completeQuiz = () => {
    console.log('=== COMPLETING QUIZ ===');
    console.log('Final score:', score);
    console.log('User answers:', userAnswers);
    console.log('Results:', results);
    
    setQuizCompleted(true);
    
    const correctAnswers = userAnswers.filter((answer, index) => 
      answer === questions[index]?.correct_answer
    ).length;
    
    const finalScore = Math.round((correctAnswers / questions.length) * 100);
    const xpEarned = Math.round(score * (finalScore / 100));
    
    console.log('Final calculations:', {
      correctAnswers,
      totalQuestions: questions.length,
      finalScore,
      xpEarned
    });
    
    setTimeout(() => {
      onComplete(finalScore, xpEarned, results.filter(r => r !== null));
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading || loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-8 shadow-2xl"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-[#2A6F68] border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-center text-gray-600 font-medium">Loading your quiz...</p>
        </motion.div>
      </motion.div>
    );
  }

  if (questions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl"
        >
          <div className="text-center">
            <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Quiz Available</h3>
            <p className="text-gray-600 mb-6">This module doesn't have quiz questions yet.</p>
            <button
              onClick={onClose}
              className="bg-[#2A6F68] text-white px-6 py-3 rounded-lg hover:bg-[#235A54] transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
      >
        {!quizCompleted ? (
          <>
            {/* Compact Header - Fixed Height */}
            <div className="bg-gradient-to-r from-[#2A6F68] to-[#B76E79] p-4 text-white flex-shrink-0 rounded-t-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{moduleTitle}</h2>
                    <p className="text-white/80 text-xs">Interactive Quiz</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 bg-white/20 rounded px-2 py-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(timeElapsed)}</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-white/20 rounded px-2 py-1">
                    <Target className="h-3 w-3" />
                    <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-white/20 rounded px-2 py-1">
                    <Zap className="h-3 w-3 text-yellow-300" />
                    <span>{score} points</span>
                  </div>
                </div>
              </div>
              
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Main Content Area - Flexible Height */}
            <div className="flex-1 p-6 flex flex-col min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col min-h-0"
                >
                  {/* Question - Fixed Height */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">
                      {currentQuestion.question_text}
                    </h3>
                  </div>
                  
                  {/* Answer Options - Flexible but Constrained */}
                  <div className="flex-1 min-h-0">
                    <div className="space-y-2 mb-4">
                      {currentQuestion.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(option)}
                          disabled={showExplanation}
                          className={`w-full p-3 text-left rounded-lg border-2 transition-all duration-300 text-sm ${
                            selectedAnswer === option
                              ? showExplanation
                                ? option === currentQuestion.correct_answer
                                  ? 'border-green-500 bg-green-50 text-green-800'
                                  : 'border-red-500 bg-red-50 text-red-800'
                                : 'border-[#2A6F68] bg-[#2A6F68]/5 text-[#2A6F68]'
                              : showExplanation && option === currentQuestion.correct_answer
                              ? 'border-green-500 bg-green-50 text-green-800'
                              : 'border-gray-200 hover:border-[#2A6F68]/30 hover:bg-gray-50 text-gray-700'
                          } ${showExplanation ? 'cursor-default' : 'cursor-pointer hover:scale-[1.01]'}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{option}</span>
                            {showExplanation && (
                              <>
                                {option === currentQuestion.correct_answer && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                                {selectedAnswer === option && option !== currentQuestion.correct_answer && (
                                  <X className="h-4 w-4 text-red-600" />
                                )}
                              </>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Explanation - Constrained Height */}
                    <AnimatePresence>
                      {showExplanation && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`p-3 rounded-lg border-2 ${
                            isCorrect 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            {isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <X className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <h4 className={`font-bold mb-1 text-sm ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                                {isCorrect ? '🎉 Correct!' : '💡 Learning Opportunity'}
                              </h4>
                              <p className={`text-xs leading-relaxed ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                {currentQuestion.explanation}
                              </p>
                              {isCorrect && (
                                <div className="flex items-center space-x-1 mt-2 bg-green-200 rounded px-2 py-1 w-fit">
                                  <Sparkles className="h-3 w-3 text-green-700" />
                                  <span className="text-green-700 font-medium text-xs">+{currentQuestion.points || 10} points!</span>
                                </div>
                              )}
                              {currentQuestion.concept_id && (
                                <div className="mt-2 text-xs text-gray-500">
                                  This question tests your knowledge of a specific financial concept.
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Navigation - Fixed at Bottom */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 mt-auto">
                    <button
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-100 text-sm"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </button>

                    {!showExplanation ? (
                      <button
                        onClick={handleSubmitAnswer}
                        disabled={!selectedAnswer}
                        className="bg-gradient-to-r from-[#2A6F68] to-[#B76E79] text-white px-5 py-2 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
                      >
                        Submit Answer
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuestion}
                        className="flex items-center space-x-2 bg-gradient-to-r from-[#2A6F68] to-[#B76E79] text-white px-5 py-2 rounded-lg hover:shadow-lg transition-all font-medium text-sm"
                      >
                        <span>{currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        ) : (
          /* Quiz Results - Full Height */
          <div className="p-8 text-center h-full flex flex-col justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#2A6F68] to-[#B76E79] rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz Completed! 🎉</h3>
            <p className="text-gray-600 mb-6">Excellent work on completing the quiz</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6 max-w-sm mx-auto">
              <div className="bg-[#2A6F68]/10 rounded-xl p-4">
                <div className="text-2xl font-bold text-[#2A6F68] mb-1">
                  {Math.round((userAnswers.filter((answer, index) => 
                    answer === questions[index]?.correct_answer
                  ).length / questions.length) * 100)}%
                </div>
                <div className="text-gray-600 text-sm">Final Score</div>
              </div>
              <div className="bg-[#B76E79]/10 rounded-xl p-4">
                <div className="text-2xl font-bold text-[#B76E79] mb-1">{score}</div>
                <div className="text-gray-600 text-sm">XP Earned</div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-[#2A6F68] to-[#B76E79] text-white px-8 py-3 rounded-lg hover:shadow-lg transition-all font-medium"
            >
              Continue Learning Journey
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default QuizInterface;