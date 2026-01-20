import { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Plus, Trash2, Calendar, Tag, Repeat, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { type Task } from '../types';

interface TaskCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (task: Partial<Task>) => void;
}

// Simple color palette for categories
const CATEGORY_COLORS = [
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
];

export function TaskCreationModal({ isOpen, onClose, onSubmit }: TaskCreationModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [dueTime, setDueTime] = useState<string>('23:59');

    // New Features State
    const [category, setCategory] = useState('');
    const [categoryColor, setCategoryColor] = useState(CATEGORY_COLORS[5].value);
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringInterval, setRecurringInterval] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: false }[]>([]);
    const [newSubtask, setNewSubtask] = useState('');

    // Voice
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (!isOpen) {
            // Reset form
            setTitle('');
            setDescription('');
            setCategory('');
            setSubtasks([]);
            setIsRecurring(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setTitle(prev => prev ? `${prev} ${transcript}` : transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = () => setIsListening(false);
            recognitionRef.current.onend = () => setIsListening(false);
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleAddSubtask = () => {
        if (!newSubtask.trim()) return;
        setSubtasks([...subtasks, { id: Math.random().toString(36).substr(2, 9), title: newSubtask, completed: false }]);
        setNewSubtask('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const fullDate = new Date(`${dueDate}T${dueTime}`);

        onSubmit({
            title,
            description,
            priority,
            dueDate: fullDate,
            category: category || 'General',
            categoryColor,
            isRecurring,
            recurringInterval: isRecurring ? recurringInterval : null,
            subtasks,
            completed: false
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border border-gray-100">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">New Task</h2>
                            <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Title & Voice */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">What needs to be done?</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter task title..."
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400"
                                    required
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={toggleListening}
                                    className={cn(
                                        "p-3 rounded-xl border transition-all duration-200",
                                        isListening
                                            ? "bg-red-50 border-red-200 text-red-500 animate-pulse"
                                            : "hover:bg-gray-100 border-gray-200 text-gray-400 hover:text-black bg-gray-50"
                                    )}
                                    title="Voice Input"
                                >
                                    {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5 tracking-wide">
                                    <Calendar className="w-3.5 h-3.5" /> Due Date
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-black outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5 tracking-wide">
                                    <Clock className="w-3.5 h-3.5" /> Time
                                </label>
                                <input
                                    type="time"
                                    value={dueTime}
                                    onChange={(e) => setDueTime(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-black outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Priority & Category */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</label>
                                <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                                    {['low', 'medium', 'high'].map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPriority(p as any)}
                                            className={cn(
                                                "flex-1 py-1.5 text-xs font-medium rounded-md capitalise transition-all",
                                                priority === p ? "bg-white text-black shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"
                                            )}
                                        >
                                            {p.charAt(0).toUpperCase() + p.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5 tracking-wide">
                                    <Tag className="w-3.5 h-3.5" /> Category
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="relative group">
                                        <div
                                            className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer shadow-sm flex items-center justify-center transition-transform active:scale-95"
                                            style={{ backgroundColor: categoryColor }}
                                        />
                                        <div className="absolute top-12 left-0 bg-white p-3 rounded-xl shadow-xl border border-gray-100 grid grid-cols-4 gap-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-10 w-40">
                                            {CATEGORY_COLORS.map(c => (
                                                <button
                                                    key={c.value}
                                                    type="button"
                                                    className="w-6 h-6 rounded-full hover:scale-110 transition-transform ring-1 ring-black/5"
                                                    style={{ backgroundColor: c.value }}
                                                    onClick={() => setCategoryColor(c.value)}
                                                    title={c.name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="e.g. Study"
                                        className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:bg-white focus:border-black transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Recurring */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg transition-colors", isRecurring ? "bg-black text-white" : "bg-white text-gray-400 border border-gray-200")}>
                                    <Repeat className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Recurring Task</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {isRecurring && (
                                    <select
                                        value={recurringInterval}
                                        onChange={(e) => setRecurringInterval(e.target.value as any)}
                                        className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-black transition-all"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setIsRecurring(!isRecurring)}
                                    className={cn(
                                        "w-11 h-6 rounded-full transition-colors relative",
                                        isRecurring ? "bg-black" : "bg-gray-200"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm",
                                        isRecurring ? "left-6" : "left-1"
                                    )} />
                                </button>
                            </div>
                        </div>

                        {/* Subtasks */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-700">Subtasks / Steps</label>
                            <div className="space-y-2">
                                {subtasks.map((sub) => (
                                    <div key={sub.id} className="flex items-center gap-3 text-sm group bg-white p-2 rounded-lg border border-gray-100">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 ml-1" />
                                        <span className="flex-1 text-gray-700">{sub.title}</span>
                                        <button
                                            type="button"
                                            onClick={() => setSubtasks(subtasks.filter(s => s.id !== sub.id))}
                                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newSubtask}
                                        onChange={(e) => setNewSubtask(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                                        placeholder="Add a step..."
                                        className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:bg-white focus:border-black transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddSubtask}
                                        className="p-2.5 bg-gray-100 hover:bg-black hover:text-white rounded-lg text-gray-500 transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full py-3.5 bg-black hover:bg-gray-800 text-white font-semibold rounded-xl shadow-lg shadow-black/5 transition-all active:scale-[0.98]"
                            >
                                Create Task
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
