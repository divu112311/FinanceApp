import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Target, DollarSign, Calendar } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    ageRange: '',
    incomeRange: '',
    financialGoals: ''
  });

  const steps = [
    {
      id: 'age',
      title: 'How old are you?',
      subtitle: 'This helps me tailor advice to your life stage',
      icon: Calendar,
      options: [
        { value: '18-24', label: '18-24 years old' },
        { value: '25-30', label: '25-30 years old' },
        { value: '31-35', label: '31-35 years old' },
        { value: '36-40', label: '36-40 years old' },
        { value: '40+', label: '40+ years old' }
      ]
    },
    {
      id: 'income',
      title: 'What\'s your annual income range?',
      subtitle: 'This helps me understand your financial capacity',
      icon: DollarSign,
      options: [
        { value: 'under-30k', label: 'Under $30,000' },
        { value: '30k-50k', label: '$30,000 - $50,000' },
        { value: '50k-75k', label: '$50,000 - $75,000' },
        { value: '75k-100k', label: '$75,000 - $100,000' },
        { value: '100k-150k', label: '$100,000 - $150,000' },
        { value: '150k+', label: '$150,000+' }
      ]
    },
    {
      id: 'goals',
      title: 'What are your main financial goals?',
      subtitle: 'I\'ll help you create a plan to achieve them',
      icon: Target,
      options: [
        { value: 'emergency-fund', label: 'Build an emergency fund' },
        { value: 'debt-payoff', label: 'Pay off debt' },
        { value: 'save-house', label: 'Save for a house' },
        { value: 'invest-future', label: 'Invest for the future' },
        { value: 'retirement', label: 'Plan for retirement' },
        { value: 'travel', label: 'Save for travel' }
      ]
    }
  ];

  const currentStepData = steps[currentStep];

  const handleOptionSelect = (value: string) => {
    const field = currentStepData.id === 'age' ? 'ageRange' : 
                  currentStepData.id === 'income' ? 'incomeRange' : 'financialGoals';
    
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      const token = localStorage.getItem('luxefi-token');
      await fetch('http://localhost:3001/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      onComplete();
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      onComplete(); // Complete anyway for demo
    }
  };

  const getCurrentValue = () => {
    const field = currentStepData.id === 'age' ? 'ageRange' : 
                  currentStepData.id === 'income' ? 'incomeRange' : 'financialGoals';
    return formData[field];
  };

  const isStepComplete = () => !!getCurrentValue();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl"
      >
        {/* Progress Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-serif font-bold text-[#333333]">
              Let's get to know you
            </h2>
            <span className="text-sm text-gray-600">
              {currentStep + 1} of {steps.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              className="bg-[#2A6F68] h-2 rounded-full transition-all duration-500"
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#2A6F68]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <currentStepData.icon className="h-8 w-8 text-[#2A6F68]" />
                </div>
                <h3 className="text-2xl font-bold text-[#333333] mb-2">
                  {currentStepData.title}
                </h3>
                <p className="text-gray-600">
                  {currentStepData.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                {currentStepData.options.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOptionSelect(option.value)}
                    className={`p-4 text-left rounded-lg border-2 transition-all ${
                      getCurrentValue() === option.value
                        ? 'border-[#2A6F68] bg-[#2A6F68]/5 text-[#2A6F68]'
                        : 'border-gray-200 hover:border-gray-300 text-[#333333]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option.label}</span>
                      {getCurrentValue() === option.value && (
                        <Check className="h-5 w-5 text-[#2A6F68]" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-[#333333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={nextStep}
            disabled={!isStepComplete()}
            className="flex items-center space-x-2 bg-[#2A6F68] text-white px-6 py-2 rounded-lg hover:bg-[#235A54] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>
              {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
            </span>
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OnboardingFlow;