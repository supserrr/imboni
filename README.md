# Imboni - AI Vision Assistant

<div align="center">

**An AI-powered vision assistant designed to help blind and low vision users understand their surroundings through real-time visual analysis and audio descriptions.**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Development](#development)
- [Deployment](#deployment)
- [Accessibility](#accessibility)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

## 🎯 Overview

Imboni is an accessibility-focused web application that leverages AI vision models to provide real-time audio descriptions of a user's environment. The application uses live camera feeds to analyze scenes and delivers contextual information through text-to-speech, making visual information accessible to blind and low vision users.

### Key Capabilities

- **Real-time Visual Analysis**: Continuous scene understanding through camera feed
- **Interactive Queries**: Ask specific questions about the environment
- **Audio Narration**: Customizable text-to-speech with multiple voice options
- **Accessibility First**: Full keyboard navigation, screen reader support, and WCAG compliance
- **User Authentication**: Optional account system for saving analysis history

## ✨ Features

### Core Functionality

- 📹 **Live Camera Analysis** - Continuous real-time scene descriptions
- 💬 **Interactive Queries** - Ask questions about what the camera sees
- 🔊 **Text-to-Speech** - Automatic audio descriptions with customizable voice and speed
- ⚡ **Preset Questions** - Quick access to common queries
- 📊 **Analysis History** - Save and review past analyses (with authentication)
- 🎨 **Theme Support** - Light, dark, and system theme preferences
- 🌍 **Internationalization** - Multi-language support

### Accessibility Features

- ⌨️ **Full Keyboard Navigation** - Complete functionality without mouse
- 🗣️ **Screen Reader Support** - Comprehensive ARIA labels and announcements
- 🎨 **High Contrast Mode** - Respects system accessibility preferences
- 🎭 **Reduced Motion** - Honors user motion preferences
- 📱 **Large Touch Targets** - Minimum 44x44px for mobile accessibility

## 🛠️ Tech Stack

### Frontend

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Component library
- **Framer Motion** - Animations
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend & Services

- **Supabase** - Authentication and database
- **Moondream API** - Vision analysis
- **ElevenLabs** - Text-to-speech (optional)
- **Vercel** - Hosting and deployment

### Development Tools

- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **Git** - Version control

## 🚀 Getting Started

This guide will walk you through setting up the Imboni app from scratch, even if you're new to web development.

> **👨‍💻 Experienced Developer?** Jump to the [Quick Start](#-quick-start-for-experienced-developers) section below.

### ⚡ Quick Start for Experienced Developers

If you're familiar with Node.js and Next.js, here's the condensed setup:

```bash
# Clone and install
git clone https://github.com/supserrr/imboni
cd imboni
npm install

# Set up environment variables
cp .env.example .env.local  # If .env.example exists, or create .env.local manually
# Add your API keys to .env.local

# Start dev server
npm run dev
```

See the [Configuration](#-configuration) section for required environment variables.

---

### 📖 Detailed Installation Guide

**New to web development?** Follow this step-by-step guide. We'll explain everything!

> **📝 What You'll Be Doing:**
> 1. Installing Node.js (if needed)
> 2. Downloading the project code
> 3. Installing project dependencies
> 4. Getting API keys from online services
> 5. Setting up a configuration file
> 6. Starting the app on your computer
> 
> **⏱️ Estimated Time:** 30-45 minutes (depending on your experience level)
> 
> **💡 Don't Worry:** We'll guide you through each step with explanations!

### 📋 Prerequisites

Before you begin, you'll need to install a few tools on your computer. Don't worry if you don't have them yet - we'll show you how!

#### 1. Node.js and npm

**What is it?** Node.js is a JavaScript runtime that lets you run JavaScript on your computer. npm (Node Package Manager) comes with Node.js and is used to install project dependencies.

**How to check if you have it:**
1. Open your terminal (Mac/Linux) or Command Prompt (Windows)
2. Type: `node --version`
3. Press Enter
4. You should see a version number like `v18.0.0` or higher

**If you don't have Node.js:**
1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS (Long Term Support)** version (recommended)
3. Run the installer and follow the instructions
4. Restart your terminal/command prompt
5. Verify installation by running `node --version` again

**Verify npm is installed:**
```bash
npm --version
```
You should see a version number like `9.0.0` or higher.

#### 2. Git (Optional but Recommended)

**What is it?** Git is a version control system. You'll need it to clone (download) the repository.

**How to check if you have it:**
```bash
git --version
```

**If you don't have Git:**
- **Windows**: Download from [git-scm.com](https://git-scm.com/download/win)
- **Mac**: Usually pre-installed, or install via [git-scm.com](https://git-scm.com/download/mac)
- **Linux**: Run `sudo apt-get install git` (Ubuntu/Debian) or use your package manager

#### 3. API Keys and Services

You'll need accounts and API keys for these services:

- **Moondream API Key** - For vision analysis (required)
- **Supabase Project** - For authentication and database (required)
- **ElevenLabs API Key** - For text-to-speech (optional)

Don't worry - we'll show you how to get these in the setup steps below!

---

### 🛠️ Installation Guide

Follow these steps in order. If you get stuck, check the [Troubleshooting](#-troubleshooting) section at the bottom.

#### Step 1: Download the Project

**Option A: Using Git (Recommended)**

1. Open your terminal/command prompt
2. Navigate to where you want to save the project (e.g., your Desktop or Documents folder):
   ```bash
   cd ~/Desktop
   ```
   Or on Windows:
   ```bash
   cd C:\Users\YourName\Desktop
   ```

3. Clone the repository:
   ```bash
   git clone https://github.com/supserrr/imboni
   ```

4. Navigate into the project folder:
   ```bash
   cd imboni
   ```

**Option B: Download as ZIP**

1. Click the "Download ZIP" button on the repository page
2. Extract the ZIP file to your desired location
3. Open terminal/command prompt and navigate to the extracted folder:
   ```bash
   cd path/to/imboni
   ```

**Verify Step 1:**
You should now be in the `imboni` folder. Check by running:
```bash
ls
```
(Mac/Linux) or
```bash
dir
```
(Windows)

You should see files like `package.json`, `README.md`, and a `src` folder.

---

#### Step 2: Install Dependencies

**What are dependencies?** These are external libraries and tools the project needs to run. Think of them as ingredients for a recipe.

1. Make sure you're in the `imboni` folder (from Step 1)

2. Install all dependencies:
   ```bash
   npm install
   ```

   **What this does:** Downloads and installs all the packages listed in `package.json`. This may take 2-5 minutes depending on your internet speed.

   **What you'll see:** A lot of text scrolling by as packages are downloaded. This is normal! You'll see something like:
   ```
   added 1234 packages, and audited 1235 packages in 2m
   ```

3. **If you see errors:**
   - **"npm: command not found"** → Node.js isn't installed correctly. Reinstall Node.js.
   - **"EACCES" or permission errors** → Don't use `sudo`. Instead, fix npm permissions or use a Node version manager.
   - **Network errors** → Check your internet connection and try again.

**Verify Step 2:**
Check that a `node_modules` folder was created:
```bash
ls node_modules
```
You should see many folders (these are the installed packages).

---

#### Step 3: Get Your API Keys

Before the app can work, you need to set up API keys. These are like passwords that let the app access external services.

##### 3a. Get Moondream API Key (Required)

1. Go to [Moondream API](https://moondream.ai) or the Moondream API provider
2. Sign up for an account (if needed)
3. Navigate to your API keys section
4. Create a new API key
5. **Copy the API key** - you'll need it in the next step
   - It will look something like: `sk-xxxxxxxxxxxxxxxxxxxxx`
   - ⚠️ **Important:** Keep this secret! Don't share it publicly.

##### 3b. Set Up Supabase (Required)

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" and sign up (it's free)
3. Create a new project:
   - Choose a name (e.g., "imboni-app")
   - Set a database password (save this somewhere safe!)
   - Choose a region close to you
   - Wait for the project to be created (takes 1-2 minutes)

4. Get your project credentials:
   - Go to **Settings** → **API** in your Supabase dashboard
   - Find **Project URL** - copy this value
   - Find **anon/public key** - copy this value
   - ⚠️ **Important:** These are safe to use in your app (they're meant for client-side use)

5. Set up the database table (optional but recommended):
   - Go to **SQL Editor** in your Supabase dashboard
   - Click **New Query**
   - Copy the contents of `supabase/migrations/001_create_analysis_history.sql`
   - Paste it into the SQL editor
   - Click **Run** (or press Ctrl/Cmd + Enter)
   - You should see "Success. No rows returned"

##### 3c. Get ElevenLabs API Key (Optional)

Only needed if you want to use ElevenLabs for text-to-speech instead of the browser's built-in TTS.

1. Go to [elevenlabs.io](https://elevenlabs.io)
2. Sign up for an account
3. Go to your profile → API Key
4. Copy your API key

---

#### Step 4: Create Environment Variables File

**What are environment variables?** These are configuration settings stored in a file that the app reads when it starts. They're like a settings file.

1. In the `imboni` folder, you'll find a file called `.env.example` - this is a template!

2. **Easy way (Recommended):**
   - Copy the `.env.example` file and rename it to `.env.local`
   - **Mac/Linux:** `cp .env.example .env.local`
   - **Windows:** Copy `.env.example` in file explorer and rename it to `.env.local`
   - **Or manually:** Create a new file named `.env.local` (make sure it starts with a dot!)

3. Open `.env.local` in a text editor (Notepad, VS Code, etc.)

4. Replace the placeholder values with your actual API keys:

   ```env
   # Required: Vision Analysis API
   # Get this from Moondream API dashboard
   NEXT_PUBLIC_MOONDREAM_API_KEY=sk-your-actual-api-key-here
   NEXT_PUBLIC_MOONDREAM_API_URL=https://api.moondream.ai/v1

   # Required: Supabase Configuration
   # Get these from Supabase Dashboard → Settings → API
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

   # Optional: Text-to-Speech (ElevenLabs)
   # Only add this if you want to use ElevenLabs TTS
   # ELEVENLABS_API_KEY=your-elevenlabs-api-key-here

   # Optional: Push Notifications
   # Only add this if you're setting up push notifications
   # NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key-here
   ```

4. **Important:** 
   - Replace `sk-your-actual-api-key-here` with your actual Moondream API key
   - Replace `https://your-project-id.supabase.co` with your Supabase project URL
   - Replace `your-anon-key-here` with your Supabase anon key
   - Don't use quotes around the values
   - Don't leave any spaces around the `=` sign
   - Lines starting with `#` are comments (ignored by the app)

5. Save the file

**Example of what your `.env.local` should look like:**
```env
NEXT_PUBLIC_MOONDREAM_API_KEY=sk-abc123xyz789
NEXT_PUBLIC_MOONDREAM_API_URL=https://api.moondream.ai/v1
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Verify Step 4:**
Make sure the file is in the root of `imboni` folder (same level as `package.json`):
```bash
ls -la .env.local
```
(Mac/Linux) or check in your file explorer that `.env.local` exists in the `imboni` folder.

---

#### Step 5: Start the Development Server

**What is a development server?** This runs your app locally on your computer so you can test it before deploying it online.

1. Make sure you're in the `imboni` folder

2. Start the development server:
   ```bash
   npm run dev
   ```

3. **What you'll see:**
   - The app will start building (this takes 30-60 seconds the first time)
   - You'll see output like:
     ```
     ▲ Next.js 16.0.3
     - Local:        http://localhost:3000
     - Ready in 2.3s
     ```
   - The server is now running! 🎉

4. **Keep this terminal window open** - the server needs to keep running for the app to work.

**Verify Step 5:**
You should see "Ready" in the terminal. If you see errors, check the [Troubleshooting](#-troubleshooting) section.

---

#### Step 6: Open the App in Your Browser

1. Open your web browser (Chrome, Firefox, Safari, or Edge)

2. Go to: [http://localhost:3000](http://localhost:3000)
   - Type this in the address bar, or click the link
   - `localhost` means "this computer"
   - `3000` is the port number

3. **What you should see:**
   - The Imboni app homepage
   - If you see an error page, check the [Troubleshooting](#-troubleshooting) section

**🎉 Congratulations!** Your app is now running locally!

---

### ✅ Verification Checklist

After completing all steps, verify everything works:

- [ ] Node.js and npm are installed (`node --version` and `npm --version` work)
- [ ] Project folder exists and contains `package.json`
- [ ] Dependencies installed (`node_modules` folder exists)
- [ ] `.env.local` file exists with your API keys
- [ ] Development server starts without errors (`npm run dev`)
- [ ] App opens in browser at `http://localhost:3000`
- [ ] No error messages in the browser console (press F12 to open)

---

### 🐛 Troubleshooting

#### Problem: "node: command not found" or "npm: command not found"

**Solution:**
- Node.js isn't installed or isn't in your PATH
- Reinstall Node.js from [nodejs.org](https://nodejs.org/)
- Restart your terminal after installation
- On Mac/Linux, you might need to add Node.js to your PATH

#### Problem: "EACCES" or permission errors when running `npm install`

**Solution:**
- Don't use `sudo` with npm
- Fix npm permissions: `npm config set prefix ~/.npm-global`
- Or use a Node version manager like `nvm` or `n`

#### Problem: "Cannot find module" errors

**Solution:**
- Dependencies might not be installed correctly
- Delete `node_modules` folder and `package-lock.json`
- Run `npm install` again

#### Problem: App won't start - "Port 3000 is already in use"

**Solution:**
- Another app is using port 3000
- Option 1: Stop the other app using port 3000
- Option 2: Use a different port: `npm run dev -- -p 3001`
- Then open `http://localhost:3001` instead

#### Problem: "Invalid API key" or API errors

**Solution:**
- Check that your `.env.local` file has the correct API keys
- Make sure there are no extra spaces or quotes around the values
- Verify your API keys are still valid in the service dashboards
- Make sure the `.env.local` file is in the root folder (same level as `package.json`)

#### Problem: "Module not found" errors in the browser

**Solution:**
- Stop the development server (Ctrl+C)
- Delete `.next` folder (if it exists)
- Run `npm install` again
- Start the server again: `npm run dev`

#### Problem: Supabase connection errors

**Solution:**
- Verify your Supabase URL and anon key are correct in `.env.local`
- Check that your Supabase project is active (not paused)
- Make sure you copied the **anon/public** key, not the service role key
- Verify the database migration ran successfully

#### Problem: Camera not working

**Solution:**
- Make sure you're using HTTPS or localhost (camera requires secure context)
- Grant camera permissions in your browser
- Try a different browser (Chrome, Firefox, Safari)
- Check browser console for errors (F12 → Console tab)

#### Problem: Still stuck?

**Solution:**
- Check the browser console for error messages (F12 → Console)
- Check the terminal where `npm run dev` is running for error messages
- Make sure all prerequisites are installed correctly
- Verify your `.env.local` file format is correct
- Try deleting `node_modules` and `.next` folders, then run `npm install` again

---

### 📚 Next Steps

Once your app is running:

1. **Explore the app** - Try the different features
2. **Read the code** - Check out `src/app/page.tsx` to see how it works
3. **Make changes** - Edit files and see them update in real-time (hot reload)
4. **Check the docs** - See the [Documentation](./docs/README.md) for more details

### 💡 Tips for Beginners

- **Hot Reload:** When you save a file, the browser automatically refreshes with your changes
- **Terminal Commands:** 
  - `Ctrl+C` stops the development server
  - `Ctrl+L` clears the terminal (Mac/Linux)
  - `cls` clears the terminal (Windows)
- **File Structure:** Most of your code will be in the `src` folder
- **Environment Variables:** Never commit `.env.local` to Git (it's already in `.gitignore`)

## 📁 Project Structure

```
imboni/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication routes
│   │   ├── (marketing)/       # Marketing pages
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Dashboard pages
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── forms/            # Form components
│   │   └── solutions/        # Feature-specific components
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities and services
│   │   ├── services/         # API service clients
│   │   ├── supabase/         # Supabase configuration
│   │   └── utils/            # Helper functions
│   └── types/                # TypeScript type definitions
├── supabase/
│   └── migrations/           # Database migrations
├── docs/                     # Documentation
│   ├── deployment/           # Deployment guides
│   └── README.md             # Documentation index
├── public/                   # Static assets
├── .env.local               # Environment variables (not in git)
├── LICENSE                  # MIT License
└── README.md                # This file
```

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_MOONDREAM_API_KEY` | Yes | Moondream API key for vision analysis |
| `NEXT_PUBLIC_MOONDREAM_API_URL` | No | Moondream API endpoint (defaults to `https://api.moondream.ai/v1`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `ELEVENLABS_API_KEY` | No | ElevenLabs API key for TTS |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No | VAPID public key for push notifications |

### Database Schema

The application uses an optional `analysis_history` table in Supabase:

```sql
CREATE TABLE analysis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_data TEXT,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

See `supabase/migrations/001_create_analysis_history.sql` for the complete migration.

## 💻 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Keyboard Shortcuts

- **Space** - Start/Resume camera analysis
- **Escape** - Stop camera
- **P** - Pause analysis
- **Q** - Focus query input

### Code Style

- Follow TypeScript best practices
- Use ESLint for code quality
- Follow the existing component structure
- Maintain accessibility standards (WCAG 2.1 AA)

## 🚢 Deployment

### Vercel Deployment

This project is optimized for deployment on Vercel. See the [deployment documentation](./docs/deployment/vercel-deployment.md) for detailed instructions.

**Quick Deploy:**

1. Push code to GitHub/GitLab/Bitbucket
2. Import repository in [Vercel](https://vercel.com)
3. Configure environment variables
4. Deploy

### Environment Variables for Production

Ensure all required environment variables are set in your Vercel project settings for:
- Production
- Preview
- Development

See the [deployment checklist](./docs/deployment/deployment-checklist.md) for a complete guide.

## ♿ Accessibility

This application is designed with accessibility as a core principle:

- **WCAG 2.1 AA Compliance** - Meets international accessibility standards
- **Screen Reader Support** - Comprehensive ARIA labels and live regions
- **Keyboard Navigation** - All functionality accessible via keyboard
- **High Contrast** - Respects system accessibility preferences
- **Reduced Motion** - Honors user motion preferences
- **Semantic HTML** - Proper HTML structure for assistive technologies

## 🤝 Contributing

This is a student project for a summative assignment. Contributions and feedback are welcome!

### Development Guidelines

1. Follow the existing code style and structure
2. Maintain accessibility standards
3. Write clear commit messages
4. Test on multiple browsers and devices
5. Ensure keyboard navigation works

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Shima Serein**

This project was created as part of a summative assignment.

---

<div align="center">

Made with ❤️ for accessibility

</div>
