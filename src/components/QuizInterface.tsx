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
    console.log('=== QUIZ INTERFACE MOUNTED ===');
    console.log('Module ID:', moduleId);
    console.log('Module Title:', moduleTitle);
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
        setQuestions([]);
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
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
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

    if (correct) {
      const newScore = score + currentQuestion.points;
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
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2A6F68] to-[#B76E79] p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{moduleTitle}</h2>
                <p className="text-white/80">Interactive Quiz</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex items-center justify-between text-sm mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 bg-white/20 rounded px-2 py-1">
                <Clock className="h-4 w-4" />
                <span>{formatTime(timeElapsed)}</span>
              </div>
              <div className="flex items-center space-x-1 bg-white/20 rounded px-2 py-1">
                <Target className="h-4 w-4" />
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              </div>
              <div className="flex items-center space-x-1 bg-white/20 rounded px-2 py-1">
                <Zap className="h-4 w-4 text-yellow-300" />
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

        {/* Quiz Content */}
        <div className="p-6">
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
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    {currentQuestion.question_text}
                  </h3>
                  
                  {/* Answer Options */}
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(option)}
                        disabled={showExplanation}
                        className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-300 ${
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
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                              {selectedAnswer === option && option !== currentQuestion.correct_answer && (
                                <X className="h-5 w-5 text-red-600" />
                              )}
                            </>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Explanation */}
                <AnimatePresence>
                  {showExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`p-4 rounded-xl mb-6 border-2 ${
                        isCorrect 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {isCorrect ? (
                          <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                        ) : (
                          <X className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                        )}
                        <div>
                          <h4 className={`font-bold mb-2 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                            {isCorrect ? '🎉 Correct!' : '💡 Learning Opportunity'}
                          </h4>
                          <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                            {currentQuestion.explanation}
                          </p>
                          {isCorrect && (
                            <div className="flex items-center space-x-2 mt-3 bg-green-200 rounded px-3 py-1 w-fit">
                              <Sparkles className="h-4 w-4 text-green-700" />
                              <span className="text-green-700 font-medium text-sm">+{currentQuestion.points} points!</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>

                  {!showExplanation ? (
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={!selectedAnswer}
                      className="bg-gradient-to-r from-[#2A6F68] to-[#B76E79] text-white px-6 py-2 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="flex items-center space-x-2 bg-gradient-to-r from-[#2A6F68] to-[#B76E79] text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all font-medium"
                    >
                      <span>{currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            /* Quiz Results */
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#2A6F68] to-[#B76E79] rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="h-12 w-12 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz Completed! 🎉</h3>
              <p className="text-gray-600 mb-6">Excellent work on completing the quiz</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
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
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuizInterface;