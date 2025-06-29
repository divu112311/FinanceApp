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

### 🧠 AI Learning System
- **Personalized Learning Path**: AI-generated lessons tailored to your financial situation
- **Daily Practice**: New content generated daily based on your progress and needs
- **Interactive Quizzes**: Test your knowledge with AI-generated quizzes
- **Progress Tracking**: Track your learning journey with XP rewards and achievements

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
- OpenAI API key or OpenRouter API key

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
```

4. Set up Supabase:
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key from Settings > API
   - The database migrations will run automatically
   - Deploy the Edge Functions (see below)
   - Add your OpenAI API key or OpenRouter API key to Supabase secrets

5. Deploy the Edge Functions:
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the functions
supabase functions deploy chat-ai
supabase functions deploy generate-learning-content
supabase functions deploy generate-quiz-questions
supabase functions deploy generate-article-content

# Set the API key as a secret (choose one)
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
# OR
supabase secrets set OPENROUTER_API_KEY=your_openrouter_api_key_here
```

6. Start the development server:
```bash
npm run dev
```

## AI Learning System

The AI Learning System is a core feature of DoughJo that provides personalized financial education:

### How It Works

1. **Content Generation**: The system analyzes the user's financial data (accounts, transactions, goals) and generates personalized learning content using AI.

2. **Daily Practice**: Each user receives a daily practice module tailored to their financial situation and learning progress.

3. **Varied Content Types**: The system creates different types of content:
   - Articles with practical financial advice
   - Quizzes to test knowledge and reinforce learning
   - Interactive exercises for hands-on practice

4. **Progress Tracking**: The system tracks user progress, awards XP, and adapts future content based on performance.

### Technical Implementation

#### Database Schema

- **learning_modules**: Stores all learning content
  - `id`: Unique identifier
  - `title`: Module title
  - `description`: Brief description
  - `content_type`: 'article', 'quiz', 'interactive', etc.
  - `difficulty`: 'Beginner', 'Intermediate', 'Advanced'
  - `category`: Topic category
  - `duration_minutes`: Estimated completion time
  - `xp_reward`: XP awarded for completion
  - `content_data`: JSON containing the actual content
  - `is_active`: Whether the module is active
  - `created_at`: Creation timestamp

- **user_learning_progress**: Tracks user progress through modules
  - `id`: Unique identifier
  - `user_id`: User ID
  - `module_id`: Module ID
  - `status`: 'not_started', 'in_progress', 'completed'
  - `progress_percentage`: Completion percentage
  - `time_spent_minutes`: Time spent on the module
  - `completed_at`: Completion timestamp
  - `started_at`: Start timestamp
  - `updated_at`: Last update timestamp

#### Edge Functions

- **generate-learning-content**: Generates personalized learning modules based on user data
- **generate-quiz-questions**: Creates quiz questions for a specific topic and difficulty
- **generate-article-content**: Produces article content for a specific topic and difficulty

#### Frontend Integration

The system is integrated into the Finance Kata section of the app, where users can:
- See their daily practice
- Access all available lessons
- Track their learning progress
- Earn XP for completing modules

### Configuring the AI Learning System

1. **Set up API Keys**:
   - OpenAI API key: `supabase secrets set OPENAI_API_KEY=your_key_here`
   - OR OpenRouter API key: `supabase secrets set OPENROUTER_API_KEY=your_key_here`

2. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy generate-learning-content
   supabase functions deploy generate-quiz-questions
   supabase functions deploy generate-article-content
   ```

3. **Schedule Content Generation** (optional):
   - Set up a cron job to call the `generate-learning-content` function daily
   - Example using GitHub Actions or similar CI/CD service:
   ```yaml
   name: Generate Learning Content
   on:
     schedule:
       - cron: '0 4 * * *'  # Run at 4 AM UTC daily
   jobs:
     generate:
       runs-on: ubuntu-latest
       steps:
         - name: Call Generate Learning Content Function
           run: |
             curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-learning-content" \
             -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
             -H "Content-Type: application/json" \
             --data '{"userId": "system", "generateForAllUsers": true}'
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

## License

This project is licensed under the MIT License.