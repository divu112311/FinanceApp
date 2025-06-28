# DoughJo - Your AI Financial Sensei

A sophisticated AI-powered personal finance application featuring your friendly martial arts mascot, DoughJo! Master the ancient art of money management with modern AI wisdom.

## Features

### 🥋 AI Financial Sensei
- **Conversational Interface**: Train with Sensei DoughJo through natural language chat
- **Context-Aware AI**: OpenAI GPT-4 integration with full financial context and chat history
- **Personalized Wisdom**: Ancient financial wisdom meets modern AI for personalized advice

### 💰 Financial Mastery
- **Goal Tracking**: Visual progress tracking for your financial quests
- **Smart Insights**: AI-generated spending analysis and recommendations
- **Warrior Profiles**: Comprehensive user management with XP and belt rankings

### 🎮 Dojo Progression System
- **XP System**: Earn experience points for financial interactions and training
- **Belt Rankings**: Progress from White Belt to Grand Master based on engagement
- **Achievement Badges**: Unlock rewards for reaching financial milestones
- **Progress Visualization**: Beautiful progress bars and achievement animations

### 🎨 Dojo Design
- **Martial Arts Aesthetic**: Clean, disciplined design inspired by traditional dojos
- **Mascot Integration**: DoughJo appears throughout the app as your guide
- **Sophisticated Typography**: Playfair Display headlines with Inter body text
- **Micro-interactions**: Smooth animations and hover states throughout
- **Responsive Layout**: Mobile-first design that scales beautifully

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Backend**: Supabase (Database + Auth + Edge Functions)
- **AI**: OpenAI GPT-4 API via Supabase Edge Functions
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React + Custom DoughJo Mascot

## Getting Started

### Prerequisites
- Node.js 18+ 
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd doughjo-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual values:
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

4. Set up Supabase:
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key from Settings > API
   - The database migrations will run automatically
   - Deploy the Edge Function (see below)
   - Add your OpenAI API key to Supabase secrets

5. Deploy the Edge Function:
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy chat-ai

# Set the OpenAI API key as a secret
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

6. Start the development server:
```bash
npm run dev
```

## The DoughJo Way

### Belt Ranking System
Progress through traditional martial arts belt rankings:
- **White Belt** (Levels 1-4): Beginning your financial journey
- **Yellow Belt** (Levels 5-9): Learning the basics
- **Green Belt** (Levels 10-14): Building good habits
- **Blue Belt** (Levels 15-19): Developing discipline
- **Brown Belt** (Levels 20-29): Advanced techniques
- **Black Belt** (Levels 30-39): Mastery of fundamentals
- **Master** (Levels 40-49): Teaching others
- **Grand Master** (Level 50+): True financial wisdom

### DoughJo's Wisdom
Your AI sensei provides guidance based on:
- Ancient financial principles
- Modern investment strategies
- Your personal goals and progress
- Martial arts philosophy applied to money management

### Training Philosophy
- **Discipline**: Consistent habits build wealth
- **Balance**: Harmony between saving and enjoying life
- **Patience**: Long-term thinking for lasting results
- **Wisdom**: Learning from both success and failure
- **Strength**: Building financial resilience

## Architecture

### Frontend Structure
```
src/
├── components/
│   ├── LoginForm.tsx          # Dojo entrance
│   ├── ChatInterface.tsx      # Training with Sensei DoughJo
│   ├── Dashboard.tsx          # Financial progress overview
│   └── OnboardingFlow.tsx     # Initial assessment
├── hooks/
│   ├── useAuth.ts            # Authentication logic
│   ├── useChat.ts            # Chat with AI sensei
│   ├── useGoals.ts           # Financial quest management
│   └── useUserProfile.ts     # User profile & XP
├── lib/
│   └── supabase.ts           # Supabase client configuration
└── App.tsx                   # Main dojo application
```

### Database Schema
- **users**: Warrior profiles and authentication
- **goals**: Financial quests and objectives
- **chat_logs**: Complete training conversation history
- **xp**: Progression system (points, badges, belt ranks)

### Edge Functions
- **chat-ai**: Handles OpenAI API integration with full user context

## Key Features Explained

### Conversational AI Sensei
The heart of DoughJo is the conversational interface where users train with Sensei DoughJo through natural language. The AI has access to:
- Complete user financial profile and belt rank
- Real-time goal progress and targets
- Full conversation history for context continuity
- User XP level and achievement data
- Personalized financial advice based on martial arts philosophy

### Context-Aware Training
Every AI response is generated with full context including:
- User demographics and financial situation
- Current belt rank and XP level
- Progress toward financial quests
- Previous training sessions for continuity
- Personalized advice combining ancient wisdom with modern strategy

### Progression System
Users earn XP for various training activities:
- Completing registration: +100 XP (Welcome badge)
- Each chat interaction: +5 XP
- Setting up financial quests: +50 XP
- Reaching milestones: Variable XP

Belt ranks increase based on total XP, with visual feedback throughout the dojo.

## Sensei DoughJo's Teachings

### Core Principles
1. **"The way of the warrior is to stop trouble before it starts"** - Emergency fund wisdom
2. **"A thousand-mile journey begins with a single step"** - Starting small with investments
3. **"The bamboo that bends is stronger than the oak that resists"** - Adapting to market changes
4. **"Empty your cup so that it may be filled"** - Learning new financial concepts
5. **"The best time to plant a tree was 20 years ago. The second best time is now"** - Starting to invest

### Training Methods
- **Kata Practice**: Repetitive good financial habits
- **Sparring**: Discussing financial scenarios and solutions
- **Meditation**: Mindful spending and reflection
- **Forms**: Structured approaches to budgeting and investing
- **Philosophy**: Understanding the deeper meaning of financial wellness

## Troubleshooting

### Common Issues

**1. "Invalid URL" Error**
- Make sure your `.env` file has valid Supabase credentials
- Check that URLs start with `https://` and contain `.supabase.co`

**2. Sensei Not Responding**
- Verify OpenAI API key is set in Supabase secrets
- Check Edge Function deployment status
- Look at browser console for error messages

**3. Database Connection Issues**
- Confirm Supabase project is active
- Check that RLS policies are properly configured
- Verify user authentication is working

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## The DoughJo Philosophy

*"In the dojo of finance, every dollar is a student, every decision a lesson, and every goal a belt to earn. Train with discipline, invest with wisdom, and let compound interest be your greatest technique."*

**- Sensei DoughJo** 🥋💰

## License

This project is licensed under the MIT License.