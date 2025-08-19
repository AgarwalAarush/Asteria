# Environment Variables Setup

Create a `.env.local` file in the web directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database Configuration (for Prisma)
DATABASE_URL=your_postgresql_connection_string
DIRECT_URL=your_postgresql_direct_connection_string

# AI Configuration (for future use)
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional Features
RAG_ENABLED=false

# Development
NODE_ENV=development
```

## Getting Supabase Credentials

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization and give your project a name
4. Set a database password (save this!)
5. Choose a region close to your users
6. Click "Create new project"

### Step 2: Get Your Project Credentials
1. Once your project is created, go to **Settings > API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (the long string under "Project API keys")

### Step 3: Get Database Connection String
1. Go to **Settings > Database**
2. Scroll down to "Connection string"
3. Select "URI" tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with the database password you set in Step 1

### Step 4: Create .env.local File
Create a file called `.env.local` in your `web/` directory:

```bash
# Replace with your actual values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
DATABASE_URL=postgresql://postgres:your-password@db.your-project-id.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:your-password@db.your-project-id.supabase.co:5432/postgres
```

## Database Setup

After setting up your environment variables:

1. Run `npx prisma migrate dev` to create the database schema
2. Run `npx prisma generate` to generate the Prisma client
3. Restart your development server with `pnpm run dev`

## Troubleshooting

### "Your project's URL and API key are required" Error
- Make sure your `.env.local` file is in the `web/` directory
- Check that your environment variable names are exactly as shown above
- Restart your development server after creating/updating `.env.local`
- Verify your Supabase project is fully created (it takes a minute or two)

### Can't Connect to Database
- Double-check your database password
- Make sure you replaced `[YOUR-PASSWORD]` in the connection string
- Verify your project ID is correct in the URLs

The application should now work with your Supabase database!
