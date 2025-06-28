import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  CheckCircle, 
  Star, 
  Shield, 
  TrendingUp, 
  Users, 
  Award, 
  Zap,
  Target,
  PiggyBank,
  Brain,
  BarChart3,
  Menu,
  X,
  Play,
  Quote,
  ChevronDown,
  DollarSign,
  Clock,
  Smartphone,
  Lock,
  Globe,
  MessageCircle
} from 'lucide-react';
import doughjoMascot from '../assets/doughjo-mascot.png';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');

  const features = [
    {
      icon: Brain,
      title: "AI Financial Sensei",
      description: "Get personalized financial advice from your AI mentor who understands your goals and guides your journey.",
      color: "from-purple-400 to-purple-600"
    },
    {
      icon: Target,
      title: "Smart Goal Tracking",
      description: "Set, track, and achieve your financial goals with intelligent progress monitoring and milestone celebrations.",
      color: "from-blue-400 to-blue-600"
    },
    {
      icon: BarChart3,
      title: "Real-Time Insights",
      description: "Connect your accounts for live financial health scores, spending analysis, and personalized recommendations.",
      color: "from-green-400 to-green-600"
    },
    {
      icon: Award,
      title: "Gamified Learning",
      description: "Master financial concepts through interactive quizzes, earn XP, and progress through belt rankings.",
      color: "from-orange-400 to-orange-600"
    },
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your data is protected with 256-bit encryption, read-only access, and SOC 2 compliance.",
      color: "from-red-400 to-red-600"
    },
    {
      icon: Zap,
      title: "Instant Automation",
      description: "Automate your savings, investments, and bill payments with intelligent financial workflows.",
      color: "from-yellow-400 to-yellow-600"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer",
      avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150",
      content: "DoughJo helped me save $15,000 for my house down payment in just 8 months. The AI guidance was like having a personal financial advisor.",
      rating: 5
    },
    {
      name: "Marcus Johnson",
      role: "Marketing Director",
      avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
      content: "The gamification aspect made learning about investing actually fun. I went from financial novice to confident investor.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Teacher",
      avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
      content: "Finally paid off my student loans using DoughJo's debt strategy recommendations. The progress tracking kept me motivated.",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: { monthly: 0, annual: 0 },
      description: "Perfect for beginners starting their financial journey",
      features: [
        "Basic goal tracking",
        "Educational content library",
        "Community access",
        "Mobile app",
        "Email support"
      ],
      popular: false,
      cta: "Get Started Free"
    },
    {
      name: "Sensei",
      price: { monthly: 12, annual: 120 },
      description: "Advanced features for serious wealth builders",
      features: [
        "Everything in Starter",
        "AI Financial Advisor",
        "Bank account integration",
        "Advanced analytics",
        "Personalized recommendations",
        "Priority support",
        "Investment tracking"
      ],
      popular: true,
      cta: "Start Free Trial"
    },
    {
      name: "Master",
      price: { monthly: 25, annual: 250 },
      description: "Premium experience for financial mastery",
      features: [
        "Everything in Sensei",
        "1-on-1 expert consultations",
        "Custom financial planning",
        "Tax optimization strategies",
        "Estate planning guidance",
        "White-glove onboarding",
        "24/7 phone support"
      ],
      popular: false,
      cta: "Contact Sales"
    }
  ];

  const stats = [
    { number: "50K+", label: "Active Users" },
    { number: "$2.5M+", label: "Money Saved" },
    { number: "4.9/5", label: "App Rating" },
    { number: "95%", label: "Goal Success Rate" }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-10 h-10 bg-gradient-to-br from-[#2A6F68] to-[#B76E79] rounded-full flex items-center justify-center p-1"
              >
                <img 
                  src={doughjoMascot} 
                  alt="DoughJo" 
                  className="w-full h-full object-contain rounded-full"
                />
              </motion.div>
              <span className="text-2xl font-serif font-bold text-[#333333]">DoughJo</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-[#2A6F68] transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-[#2A6F68] transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-[#2A6F68] transition-colors">Reviews</a>
              <a href="#about" className="text-gray-600 hover:text-[#2A6F68] transition-colors">About</a>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={onSignIn}
                  className="text-[#2A6F68] hover:text-[#235A54] font-medium transition-colors"
                >
                  Sign In
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onGetStarted}
                  className="bg-gradient-to-r from-[#2A6F68] to-[#B76E79] text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Get Started Free
                </motion.button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-200"
            >
              <div className="px-4 py-4 space-y-4">
                <a href="#features" className="block text-gray-600 hover:text-[#2A6F68] transition-colors">Features</a>
                <a href="#pricing" className="block text-gray-600 hover:text-[#2A6F68] transition-colors">Pricing</a>
                <a href="#testimonials" className="block text-gray-600 hover:text-[#2A6F68] transition-colors">Reviews</a>
                <a href="#about" className="block text-gray-600 hover:text-[#2A6F68] transition-colors">About</a>
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <button
                    onClick={onSignIn}
                    className="block w-full text-left text-[#2A6F68] font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={onGetStarted}
                    className="block w-full bg-gradient-to-r from-[#2A6F68] to-[#B76E79] text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Get Started Free
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-[#2A6F68] rounded-full"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-[#B76E79] rounded-full"></div>
          <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-[#2A6F68] rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center space-x-2 bg-[#2A6F68]/10 text-[#2A6F68] px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Award className="h-4 w-4" />
                <span>Trusted by 50,000+ users</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-serif font-bold text-[#333333] mb-6 leading-tight">
                Master Your Money with Your
                <span className="bg-gradient-to-r from-[#2A6F68] to-[#B76E79] bg-clip-text text-transparent"> AI Sensei</span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Transform your financial future with personalized AI guidance, smart goal tracking, and gamified learning. 
                Join thousands who've mastered the art of money management.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onGetStarted}
                  className="bg-gradient-to-r from-[#2A6F68] to-[#B76E79] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
                >
                  <span>Start Your Journey Free</span>
                  <ArrowRight className="h-5 w-5" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border-2 border-[#2A6F68] text-[#2A6F68] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#2A6F68] hover:text-white transition-all flex items-center justify-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Watch Demo</span>
                </motion.button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Hero Image/Animation */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-[#2A6F68] to-[#B76E79] rounded-3xl p-8 shadow-2xl">
                <div className="bg-white rounded-2xl p-6 space-y-4">
                  {/* Mock App Interface */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#2A6F68] to-[#B76E79] rounded-full flex items-center justify-center p-1">
                      <img 
                        src={doughjoMascot} 
                        alt="DoughJo" 
                        className="w-full h-full object-contain rounded-full"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Financial Health Score</h3>
                      <p className="text-sm text-gray-600">Your progress this month</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800">Overall Score</span>
                      <span className="text-2xl font-bold text-green-600">87/100</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '87%' }}
                        transition={{ duration: 2, delay: 1 }}
                        className="bg-green-500 h-2 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-lg font-bold text-blue-600">$12,450</div>
                      <div className="text-xs text-blue-800">Emergency Fund</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="text-lg font-bold text-purple-600">Level 8</div>
                      <div className="text-xs text-purple-800">Green Belt</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageCircle className="h-4 w-4 text-[#2A6F68]" />
                      <span className="text-sm font-medium text-gray-900">Sensei's Advice</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      "Great progress on your emergency fund! Consider increasing your investment allocation to 70/30 for better long-term growth."
                    </p>
                  </div>
                </div>

                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-4 -right-4 bg-white rounded-full p-3 shadow-lg"
                >
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  className="absolute -bottom-4 -left-4 bg-white rounded-full p-3 shadow-lg"
                >
                  <Target className="h-6 w-6 text-[#B76E79]" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-[#2A6F68] mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-serif font-bold text-[#333333] mb-4">
              Everything You Need to Master Money
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to transform your financial habits and accelerate your wealth-building journey.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-all"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#333333] mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-serif font-bold text-[#333333] mb-4">
              Loved by Financial Warriors Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See how DoughJo has transformed thousands of financial journeys
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-8 relative"
              >
                <Quote className="h-8 w-8 text-[#2A6F68] mb-4" />
                
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.content}"</p>

                <div className="flex items-center space-x-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-[#333333]">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-serif font-bold text-[#333333] mb-4">
              Choose Your Training Path
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Start free and upgrade as you advance in your financial mastery
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-white rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedPlan === 'monthly'
                    ? 'bg-[#2A6F68] text-white'
                    : 'text-gray-600 hover:text-[#2A6F68]'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedPlan('annual')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedPlan === 'annual'
                    ? 'bg-[#2A6F68] text-white'
                    : 'text-gray-600 hover:text-[#2A6F68]'
                }`}
              >
                Annual
                <span className="ml-2 bg-green-100 text-green-600 px-2 py-1 rounded text-xs">Save 17%</span>
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-2xl p-8 shadow-sm border-2 transition-all hover:shadow-lg ${
                  plan.popular 
                    ? 'border-[#2A6F68] relative' 
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-[#2A6F68] text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-[#333333] mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-[#333333]">
                      ${plan.price[selectedPlan]}
                    </span>
                    {plan.price[selectedPlan] > 0 && (
                      <span className="text-gray-600">
                        /{selectedPlan === 'monthly' ? 'month' : 'year'}
                      </span>
                    )}
                  </div>

                  {selectedPlan === 'annual' && plan.price.annual > 0 && (
                    <div className="text-sm text-green-600 font-medium">
                      Save ${(plan.price.monthly * 12) - plan.price.annual} per year
                    </div>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onGetStarted}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-[#2A6F68] to-[#B76E79] text-white hover:shadow-lg'
                      : 'border-2 border-[#2A6F68] text-[#2A6F68] hover:bg-[#2A6F68] hover:text-white'
                  }`}
                >
                  {plan.cta}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#2A6F68] to-[#B76E79] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-4xl font-serif font-bold mb-4">
              Ready to Master Your Financial Future?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of users who've transformed their relationship with money. 
              Start your journey today with our free plan.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGetStarted}
                className="bg-white text-[#2A6F68] px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
              >
                <span>Start Free Today</span>
                <ArrowRight className="h-5 w-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-[#2A6F68] transition-all"
              >
                Schedule Demo
              </motion.button>
            </div>

            <div className="flex items-center justify-center space-x-6 mt-8 text-sm text-white/80">
              <div className="flex items-center space-x-1">
                <Lock className="h-4 w-4" />
                <span>Bank-level security</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Setup in 2 minutes</span>
              </div>
              <div className="flex items-center space-x-1">
                <Smartphone className="h-4 w-4" />
                <span>Mobile & web app</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#333333] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#2A6F68] to-[#B76E79] rounded-full flex items-center justify-center p-1">
                  <img 
                    src={doughjoMascot} 
                    alt="DoughJo" 
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
                <span className="text-2xl font-serif font-bold">DoughJo</span>
              </div>
              <p className="text-gray-400">
                Your AI Financial Sensei for mastering money management and building wealth.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#2A6F68] transition-colors cursor-pointer">
                  <Globe className="h-4 w-4" />
                </div>
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#2A6F68] transition-colors cursor-pointer">
                  <Users className="h-4 w-4" />
                </div>
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#2A6F68] transition-colors cursor-pointer">
                  <MessageCircle className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2024 DoughJo. All rights reserved.</p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <span className="text-gray-400 text-sm">Made with ❤️ for financial warriors</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;