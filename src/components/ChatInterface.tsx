import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Image as ImageIcon, Loader2, Search, Calendar, X } from 'lucide-react';
import { type Message, type Persona } from '../types';
import { ChatBubble } from './ChatBubble';
import { supabase } from '../lib/supabase';

interface ChatInterfaceProps {
    messages: Message[];
    onSendMessage: (text: string, imageUrl?: string) => void;
    currentPersona: Persona;
    isTyping?: boolean;
}

import imageCompression from 'browser-image-compression';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_MSGS_PER_MIN = 10;

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    messages,
    onSendMessage,
    currentPersona,
    isTyping
}) => {
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Rate Limiting
    const messageTimestamps = useRef<number[]>([]);

    // Search & History State
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [dateFilter, setDateFilter] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredMessages = messages.filter((msg) => {
        const matchesSearch = msg.text.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDate = dateFilter
            ? new Date(msg.timestamp).toDateString() === new Date(dateFilter).toDateString()
            : true;
        return matchesSearch && matchesDate;
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const checkRateLimit = () => {
        const now = Date.now();
        const recentMessages = messageTimestamps.current.filter(t => now - t < RATE_LIMIT_WINDOW);
        messageTimestamps.current = [...recentMessages, now];

        if (recentMessages.length >= MAX_MSGS_PER_MIN) {
            alert(`Rate limit exceeded. Please wait a moment before sending more messages.`);
            return false;
        }
        return true;
    };

    const handleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Voice input is not supported in this browser. Try Chrome/Edge.');
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputText((prev) => prev ? `${prev} ${transcript}` : transcript);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
            inputRef.current?.focus();
        };

        recognition.start();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Validation
        if (!ALLOWED_TYPES.includes(file.type)) {
            alert('Invalid file type. Only JPG, PNG, and PDF are allowed.');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            alert('File too large. Maximum size is 10MB.');
            return;
        }

        if (!checkRateLimit()) return;

        try {
            setIsUploading(true);
            let uploadFile = file;

            // 2. Compression (Images only)
            if (file.type.startsWith('image/')) {
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true
                };
                try {
                    uploadFile = await imageCompression(file, options);
                } catch (error) {
                    console.warn('Image compression failed, uploading original:', error);
                }
            }

            const fileExt = uploadFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('chat-images')
                .upload(filePath, uploadFile);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('chat-images')
                .getPublicUrl(filePath);

            onSendMessage('', data.publicUrl);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim()) {
            if (!checkRateLimit()) return;
            onSendMessage(inputText);
            setInputText('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50  relative transition-colors">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md px-6 py-4 border-b border-gray-200/60 shadow-sm z-30 sticky top-0 transition-all duration-300">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-center shadow-sm relative group cursor-pointer">
                            <span className="text-2xl group-hover:scale-110 transition-transform duration-200 grayscale">{currentPersona.avatar}</span>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success border-2 border-white rounded-full"></span>
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 text-[15px] leading-tight">{currentPersona.name}</h2>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">Accountability Partner</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 relative ${showSearch ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'}`}
                        title="Search History"
                    >
                        <Search className="w-5 h-5 absolute transition-all scale-100" style={{ opacity: showSearch ? 0 : 1, transform: showSearch ? 'rotate(90deg) scale(0.5)' : 'rotate(0) scale(1)' }} />
                        <X className="w-5 h-5 transition-all scale-0" style={{ opacity: showSearch ? 1 : 0, transform: showSearch ? 'rotate(0) scale(1)' : 'rotate(-90deg) scale(0.5)' }} />

                    </button>
                </div>

                {/* Search & Filter Bar */}
                {showSearch && (
                    <div className="mt-2 pt-2 border-t border-gray-200/60 flex flex-col sm:flex-row gap-2 animate-in slide-in-from-top-2 duration-200 max-w-4xl mx-auto">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search messages..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-black focus:border-black outline-none transition-all placeholder:text-gray-400"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-200 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="relative group">
                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-black focus:border-black outline-none w-full sm:w-auto text-gray-600 transition-all cursor-pointer"
                            />
                            {dateFilter && (
                                <button
                                    onClick={() => setDateFilter('')}
                                    className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-900"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                <div className="max-w-4xl mx-auto space-y-2">
                    {searchQuery || dateFilter ? (
                        filteredMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-300 opacity-60">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                                    <Search className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-sm font-medium">No messages found matching your search.</p>
                            </div>
                        ) : (
                            <div className="text-center pb-6">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-black text-white px-4 py-1.5 rounded-full border border-black shadow-sm">
                                    <Search className="w-3 h-3" />
                                    Found {filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        )
                    ) : null}

                    {filteredMessages.map((msg) => (
                        <ChatBubble
                            key={msg.id}
                            message={msg}
                            personaAvatar={currentPersona.avatar}
                        />
                    ))}

                    {isTyping && (
                        <div className="flex w-full mb-6 justify-start pl-1">
                            <div className="bg-white px-5 py-4 rounded-[20px] rounded-tl-[4px] shadow-sm border border-gray-100 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 sm:p-6 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent sticky bottom-0 z-20">
                <div className="max-w-4xl mx-auto">
                    <form
                        onSubmit={handleSubmit}
                        className="relative flex items-end gap-2 p-2 bg-white/90 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 ring-1 ring-black/5"
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,application/pdf"
                            onChange={handleImageUpload}
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="p-2.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all duration-200 group relative overflow-hidden flex-shrink-0"
                            title="Upload Image"
                        >
                            {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <ImageIcon className="w-5 h-5 transition-transform group-hover:scale-110" />}
                        </button>

                        <div className="flex-1 py-1.5">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={isListening ? "Listening..." : "Type here..."}
                                className="w-full bg-transparent border-none focus:outline-none text-[15px] text-gray-800 placeholder:text-gray-400/80 placeholder:italic font-normal h-9"
                            />
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handleVoiceInput}
                                className={`p-2.5 rounded-xl transition-all duration-200 flex-shrink-0 ${isListening
                                    ? 'text-error bg-red-50 ring-1 ring-red-200 animate-pulse'
                                    : 'text-gray-400 hover:text-black hover:bg-gray-100'
                                    }`}
                            >
                                <Mic className="w-5 h-5" />
                            </button>

                            <button
                                type="submit"
                                disabled={!inputText.trim() && !isUploading}
                                className="p-2.5 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-black disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
                            >
                                <Send className="w-5 h-5 ml-0.5" />
                            </button>
                        </div>
                    </form>
                    <div className="text-center mt-2 opacity-0 hover:opacity-100 transition-opacity duration-500">
                        <p className="text-[10px] text-gray-300 uppercase tracking-widest font-medium">Press Enter to send</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
