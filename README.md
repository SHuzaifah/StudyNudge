# Study Nudge 🎓🚀
![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Status](https://img.shields.io/badge/status-active-success.svg)

**Study Nudge** is an AI-powered academic productivity companion designed to help students stay organized, motivated, and on track. It combines intelligent chat personas with robust task management and analytics.

![App Screenshot](./public/vite.svg) (*Replace with actual screenshot*)

## ✨ Key Features

- **🤖 AI Personas**: Chat with different AI personalities (e.g., "Big Bro", "Study Buddy") powered by Google Gemini 1.5 Flash.
- **✅ Task Management**: Create, organize, and track your study tasks with priorities and deadlines.
- **📊 Analytics**: View your task completion rates and productivity trends.
- **👤 User Profiles**: Customize your experience, set daily check-in times, and manage preferences.
- **🔒 Secure**: Built with Supabase for authentication and database management (RLS policies enabled).

## 🛠️ Tech Stack

- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **Backend/DB**: [Supabase](https://supabase.com/) (Auth, PostgreSQL, Realtime)
- **AI Model**: [Google Gemini API](https://ai.google.dev/)

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites
- Node.js (v18+)
- npm or yarn
- A Supabase account and project
- A Google Cloud project with Gemini API enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/study-nudge.git
   cd study-nudge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
    Create a `.env` file in the root directory and add your keys:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_GEMINI_API_KEY=your_gemini_api_key
    ```

4. **Database Migration**
    Run the SQL scripts located in `supabase/migrations` in your Supabase SQL Editor to set up the tables and policies.

5. **Run the App**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
