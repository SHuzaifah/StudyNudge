import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

interface AuthPageProps {
    onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                // Sign In
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                // Sign Up
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert("Account created! Check your email to confirm."); // Simple feedback for now
                setError(null);
            }
            if (isLogin) {
                // For sign up, we don't necessarily onSuccess yet if email confirmation is needed,
                // but existing logic calls onSuccess immediately. Keeping as is for now,
                // assuming auto-confirm or just proceeding.
                onSuccess();
            } else {
                // Warn user to check email if needed, or if Supabase is set to auto-confirm, onSuccess works.
                // For now, let's allow onSuccess to invoke parent logic.
                onSuccess();
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    // Check for errors in the URL hash (returned by Supabase 302 redirect)
    React.useEffect(() => {
        const hash = window.location.hash;
        if (hash && hash.includes('error_description')) {
            const params = new URLSearchParams(hash.substring(1)); // remove #
            const errorDescription = params.get('error_description');
            if (errorDescription) {
                // Decode + to space if needed, though URLSearchParams usually handles it
                setError(errorDescription.replace(/\+/g, ' '));
                // Clean up the URL
                window.history.replaceState(null, '', window.location.pathname);
            }
        }
    }, []);

    return (
        <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
            <div className="bg-white rounded-[24px] shadow-2xl shadow-black/5 w-full max-w-md overflow-hidden flex flex-col border border-gray-100">

                {/* Header */}
                <div className="bg-black p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 via-black to-black"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/10">
                            <span className="text-3xl">🚀</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Study Nudge</h2>
                        <p className="text-gray-400 text-sm mt-1">Your AI Accountability Partner</p>
                    </div>
                </div>

                {/* Form */}
                <div className="p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 text-center tracking-tight">
                        {isLogin ? 'Welcome Back!' : 'Create Account'}
                    </h3>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:bg-gray-50 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400 bg-white text-gray-900"
                                    placeholder="you@student.edu"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:bg-gray-50 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400 bg-white text-gray-900"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-black hover:bg-gray-800 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-black/5 active:scale-[0.98]"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Sign Up'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-3 bg-white text-gray-400 font-medium">Or continue with</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => supabase.auth.signInWithOAuth({
                            provider: 'google',
                            options: {
                                redirectTo: 'https://study-nudge.vercel.app/'
                            }
                        })}
                        className="w-full py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Google
                    </button>

                    <div className="mt-8 text-center text-sm text-gray-500">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-black font-semibold hover:underline"
                        >
                            {isLogin ? "Sign Up" : "Log In"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
