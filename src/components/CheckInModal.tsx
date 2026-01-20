import React, { useState } from 'react';
import { X, Sun, Upload, Mic } from 'lucide-react';

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (plan: string) => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [plan, setPlan] = useState('');

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning! ☀️";
        if (hour < 18) return "Good Afternoon! 🌤️";
        return "Good Evening! 🌙";
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (plan.trim()) {
            onSubmit(plan);
            setPlan('');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col border border-gray-100">

                {/* Header */}
                <div className="bg-black p-6 text-white text-center relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sun className="w-24 h-24" />
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors z-20 cursor-pointer"
                    >
                        <X className="w-5 h-5 text-gray-400 hover:text-white" />
                    </button>

                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/10">
                            <Sun className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-1 tracking-tight">{getGreeting()}</h2>
                        <p className="text-gray-400">Let's set you up for success today.</p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                What's your main goal for today?
                            </label>
                            <textarea
                                value={plan}
                                onChange={(e) => setPlan(e.target.value)}
                                placeholder="e.g., I need to finish my Math assignment and review Chapter 3 for History..."
                                className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all resize-none text-gray-900 placeholder:text-gray-400"
                            />
                        </div>

                        <div className="flex gap-3 flex-col sm:flex-row">
                            <button
                                type="button"
                                onClick={() => alert("Schedule Upload feature coming soon!")}
                                className="flex-1 py-3 px-4 border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 hover:text-black transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                <span className="text-sm font-medium">Upload Schedule</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => alert("Voice Note feature coming soon!")}
                                className="flex-1 py-3 px-4 border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 hover:text-black transition-colors"
                            >
                                <Mic className="w-4 h-4" />
                                <span className="text-sm font-medium">Voice Note</span>
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={!plan.trim()}
                            className="w-full py-3.5 bg-black text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-black/5 mt-2 active:scale-[0.98]"
                        >
                            Start My Day 🚀
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
