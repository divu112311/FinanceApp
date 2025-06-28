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
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  points: number;
}

interface QuizInterfaceProps {
  moduleId: string;
  moduleTitle: string;
  user: User;
  onComplete: (score: number, xpEarned: number) => void;
  onClose: () => void;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({
  moduleId,
  moduleTitle,
  user,
  onComplete,
  onClose
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

  useEffect(() => {
    fetchQuizQuestions();
  }, [moduleId]);

  useEffect(() => {
    if (!quizCompleted) {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quizCompleted]);

  const fetchQuizQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('module_id', moduleId)
        .order('created_at');

      if (error) throw error;

      const formattedQuestions = data?.map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]')
      })) || [];

      setQuestions(formattedQuestions);
      setUserAnswers(new Array(formattedQuestions.length).fill(''));
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (showExplanation) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || showExplanation) return;

    const currentQuestion = questions[currentQuestionIndex];
    const correct = selectedAnswer === currentQuestion.correct_answer;
    
    setIsCorrect(correct);
    setShowExplanation(true);
    
    // Update user answers
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setUserAnswers(newAnswers);

    if (correct) {
      setScore(prev => prev + currentQuestion.points);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(userAnswers[currentQuestionIndex + 1] || '');
      setShowExplanation(false);
      setIsCorrect(false);
    } else {
      completeQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(userAnswers[currentQuestionIndex - 1] || '');
      setShowExplanation(!!userAnswers[currentQuestionIndex - 1];
      setIsCorrect(userAnswers[currentQuestionIndex - 1] === questions[currentQuestionIndex - 1]?.correct_answer);
    }
  };

  const completeQuiz = () => {
    setQuizCompleted(true);
    const correctAnswers = userAnswers.filter((answer, index) => 
      answer === questions[index]?.correct_answer
    ).length;
    
    const finalScore = Math.round((correctAnswers / questions.length) * 100);
    const xpEarned = Math.round(score * (finalScore / 100));
    
    setTimeout(() => {
      onComplete(finalScore, xpEarned);
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
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
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Quiz Available</h3>
            <p className="text-gray-600 mb-6">This module doesn't have quiz questions yet.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="bg-[#2A6F68] text-white px-6 py-3 rounded-lg hover:bg-[#235A54] transition-colors font-medium"
            >
              Close
            </motion.button>
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
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
      >
        {/* Enhanced Header */}
        <div className="bg-gradient-to-br from-[#2A6F68] via-[#2A6F68] to-[#B76E79] p-8 text-white relative overflow-hidden">
          {/* Background Animation */}
          <div className="absolute inset-0">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full"
            />
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.1, 0.15, 0.1]
              }}
              transition={{ 
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full"
            />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"
                >
                  <Brain className="h-6 w-6" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold">{moduleTitle}</h2>
                  <p className="text-white/80">Interactive Quiz</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-3 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="h-6 w-6" />
              </motion.button>
            </div>
            
            <div className="flex items-center justify-between text-sm mb-4">
              <div className="flex items-center space-x-6">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-2"
                >
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{formatTime(timeElapsed)}</span>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-2"
                >
                  <Target className="h-4 w-4" />
                  <span className="font-medium">Question {currentQuestionIndex + 1} of {questions.length}</span>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-2"
                >
                  <Zap className="h-4 w-4 text-yellow-300" />
                  <span className="font-medium">{score} points</span>
                </motion.div>
              </div>
            </div>
            
            {/* Enhanced Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="bg-white h-3 rounded-full relative overflow-hidden"
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <motion.div
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Quiz Content */}
        <div className="p-8">
          {!quizCompleted ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Question */}
                <div className="mb-8">
                  <motion.h3 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-bold text-gray-900 mb-6 leading-relaxed"
                  >
                    {currentQuestion.question_text}
                  </motion.h3>
                  
                  {/* Answer Options */}
                  <div className="space-y-4">
                    {currentQuestion.options.map((option, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: showExplanation ? 1 : 1.02, x: showExplanation ? 0 : 5 }}
                        whileTap={{ scale: showExplanation ? 1 : 0.98 }}
                        onClick={() => handleAnswerSelect(option)}
                        disabled={showExplanation}
                        className={`w-full p-6 text-left rounded-2xl border-2 transition-all duration-300 ${
                          selectedAnswer === option
                            ? showExplanation
                              ? option === currentQuestion.correct_answer
                                ? 'border-green-500 bg-green-50 text-green-800 shadow-lg'
                                : 'border-red-500 bg-red-50 text-red-800 shadow-lg'
                              : 'border-[#2A6F68] bg-[#2A6F68]/5 text-[#2A6F68] shadow-lg'
                            : showExplanation && option === currentQuestion.correct_answer
                            ? 'border-green-500 bg-green-50 text-green-800 shadow-lg'
                            : 'border-gray-200 hover:border-[#2A6F68]/30 hover:bg-gray-50 text-gray-700'
                        } ${showExplanation ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-lg">{option}</span>
                          {showExplanation && (
                            <>
                              {option === currentQuestion.correct_answer && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 200 }}
                                >
                                  <CheckCircle className="h-6 w-6 text-green-600" />
                                </motion.div>
                              )}
                              {selectedAnswer === option && option !== currentQuestion.correct_answer && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 200 }}
                                >
                                  <X className="h-6 w-6 text-red-600" />
                                </motion.div>
                              )}
                            </>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Enhanced Explanation */}
                <AnimatePresence>
                  {showExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className={`p-6 rounded-2xl mb-8 border-2 ${
                        isCorrect 
                          ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200' 
                          : 'bg-gradient-to-r from-red-50 to-red-100 border-red-200'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                        >
                          {isCorrect ? (
                            <CheckCircle className="h-8 w-8 text-green-600 mt-1 flex-shrink-0" />
                          ) : (
                            <X className="h-8 w-8 text-red-600 mt-1 flex-shrink-0" />
                          )}
                        </motion.div>
                        <div className="flex-1">
                          <motion.h4 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className={`text-xl font-bold mb-3 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}
                          >
                            {isCorrect ? '🎉 Excellent!' : '💡 Learning Opportunity'}
                          </motion.h4>
                          <motion.p 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className={`text-base leading-relaxed ${isCorrect ? 'text-green-700' : 'text-red-700'}`}
                          >
                            {currentQuestion.explanation}
                          </motion.p>
                          {isCorrect && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.5 }}
                              className="flex items-center space-x-2 mt-4 bg-green-200 rounded-lg px-4 py-2 w-fit"
                            >
                              <Sparkles className="h-5 w-5 text-green-700" />
                              <span className="text-green-700 font-semibold">+{currentQuestion.points} points earned!</span>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Enhanced Navigation */}
                <div className="flex items-center justify-between">
                  <motion.button
                    whileHover={{ scale: 1.05, x: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-xl hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="font-medium">Previous</span>
                  </motion.button>

                  {!showExplanation ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSubmitAnswer}
                      disabled={!selectedAnswer}
                      className="bg-gradient-to-r from-[#2A6F68] to-[#B76E79] text-white px-8 py-3 rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                    >
                      Submit Answer
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleNextQuestion}
                      className="flex items-center space-x-2 bg-gradient-to-r from-[#2A6F68] to-[#B76E79] text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
                    >
                      <span>{currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}</span>
                      <ArrowRight className="h-5 w-5" />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            /* Enhanced Quiz Results */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="w-32 h-32 bg-gradient-to-br from-[#2A6F68] to-[#B76E79] rounded-full flex items-center justify-center mx-auto mb-8 relative"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-gradient-to-br from-[#2A6F68] to-[#B76E79] rounded-full"
                />
                <Trophy className="h-16 w-16 text-white relative z-10" />
              </motion.div>
              
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-gray-900 mb-3"
              >
                Quiz Completed! 🎉
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 mb-8 text-lg"
              >
                Excellent work on completing the quiz
              </motion.p>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-br from-[#2A6F68]/10 to-[#2A6F68]/20 rounded-2xl p-6 border border-[#2A6F68]/20"
                >
                  <div className="text-4xl font-bold text-[#2A6F68] mb-2">
                    {Math.round((userAnswers.filter((answer, index) => 
                      answer === questions[index]?.correct_answer
                    ).length / questions.length) * 100)}%
                  </div>
                  <div className="text-gray-600 font-medium">Final Score</div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="bg-gradient-to-br from-[#B76E79]/10 to-[#B76E79]/20 rounded-2xl p-6 border border-[#B76E79]/20"
                >
                  <div className="text-4xl font-bold text-[#B76E79] mb-2">{score}</div>
                  <div className="text-gray-600 font-medium">XP Earned</div>
                </motion.div>
              </div>
              
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="bg-gradient-to-r from-[#2A6F68] to-[#B76E79] text-white px-10 py-4 rounded-xl hover:shadow-lg transition-all font-semibold text-lg"
              >
                Continue Learning Journey
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuizInterface;