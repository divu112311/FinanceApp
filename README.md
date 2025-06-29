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

### 📚 Personalized Learning Path System
- **AI-Generated Content**: Customized learning modules based on user profile and financial data
- **Adaptive Learning**: Content difficulty adjusts based on user experience level
- **Mixed Content Types**: Articles, quizzes, videos, and interactive exercises
- **Progress Tracking**: Visual progress indicators and completion statistics
- **Scheduled Generation**: Automatic creation of new content when users complete their path
- **XP Rewards**: Earn experience points for completing learning modules

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
OPENROUTER_API_KEY=your_openrouter_api_key
```

4. Set up Supabase:
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key from Settings > API
   - The database migrations will run automatically
   - Deploy the Edge Functions (see below)
   - Add your OpenRouter API key to Supabase secrets

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
supabase functions deploy generate-learning-path
supabase functions deploy learning-progress
supabase functions deploy schedule-learning-content

# Set the OpenRouter API key as a secret
supabase secrets set OPENROUTER_API_KEY=your_openrouter_api_key_here
```

6. Start the development server:
```bash
npm run dev
```

## Learning Path System Configuration

### Database Schema

The learning system uses the following tables:

1. **learning_modules**: Stores all learning content
   - `id`: Unique identifier
   - `title`: Module title
   - `description`: Module description
   - `content_type`: Type of content (article, quiz, video, interactive)
   - `difficulty`: Difficulty level (Beginner, Intermediate, Advanced)
   - `category`: Content category (Budgeting, Investing, etc.)
   - `duration_minutes`: Estimated time to complete
   - `xp_reward`: XP points awarded for completion
   - `content_data`: JSON data containing the actual content

2. **learning_paths_new**: Stores learning paths
   - `path_id`: Unique identifier
   - `name`: Path name
   - `description`: Path description
   - `target_audience`: Target audience (can be user experience level or user ID)
   - `estimated_duration`: Total duration in minutes
   - `is_featured`: Whether this is a featured path

3. **learning_path_modules**: Junction table connecting paths to modules
   - `path_module_id`: Unique identifier
   - `path_id`: Reference to learning_paths_new
   - `module_id`: Reference to learning_modules
   - `sequence_order`: Order of modules in the path
   - `is_required`: Whether the module is required

4. **user_learning_progress**: Tracks user progress through modules
   - `id`: Unique identifier
   - `user_id`: Reference to users
   - `module_id`: Reference to learning_modules
   - `status`: Progress status (not_started, in_progress, completed)
   - `progress_percentage`: Percentage complete (0-100)
   - `time_spent_minutes`: Time spent on the module
   - `completed_at`: When the module was completed

### Scheduling Content Generation

The system includes a scheduler function that can be triggered in several ways:

1. **Manual Trigger**: Call the `schedule-learning-content` function with:
   ```json
   {
     "manualTrigger": true,
     "specificUserId": "optional-user-id"
   }
   ```

2. **Cron Job**: Set up a cron job to call the function daily:
   ```bash
   # Using Supabase CLI
   supabase functions schedule schedule-learning-content --cron "0 0 * * *" --body '{"manualTrigger": false}'
   ```

3. **User-Triggered**: Users can request new content by clicking the "Refresh" button in the UI, which calls the `generate-learning-path` function.

### AI Integration

The system uses OpenRouter API to generate personalized learning content. To customize the AI integration:

1. Edit the prompt in `generate-learning-path/index.ts` to adjust the content generation
2. Modify the `generateDefaultModules` function to change the fallback content
3. Update the model selection in the OpenRouter API call:
   ```javascript
   model: 'meta-llama/llama-3.1-8b-instruct:free', // Change to your preferred model
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