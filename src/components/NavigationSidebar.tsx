import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    MessageSquare,
    CheckSquare,
    BarChart2,
    Plus,
    MoreHorizontal,
    PanelLeftClose,
    LogOut,
    User,
    Edit2,
    Trash2
} from 'lucide-react';
import { ActionModal } from './ActionModal';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface NavigationSidebarProps {
    session: { user: SupabaseUser };
    isOpen: boolean;
    onToggle: () => void;
}

export function NavigationSidebar({ session, isOpen, onToggle }: NavigationSidebarProps) {
    const location = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const navItems = [
        { href: '/', label: 'Chat', icon: MessageSquare },
        { href: '/tasks', label: 'Tasks', icon: CheckSquare },
        { href: '/analytics', label: 'Analytics', icon: BarChart2 },
    ];

    // Recent Chats Logic
    const [recentChats, setRecentChats] = useState<{ id: string, title: string, start: string, end: string, conversation_id?: string }[]>([]);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    useEffect(() => {
        if (!session) return;
        fetchChatHistory();

        // Subscribe to changes
        const channel = supabase
            .channel('public:messages')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'messages', filter: `user_id=eq.${session.user.id}` },
                () => {
                    fetchChatHistory();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session]);

    const fetchChatHistory = async () => {
        const { data } = await supabase
            .from('messages')
            .select('text, created_at, conversation_id')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (!data) return;

        // Custom Titles Map
        const customTitles = session.user.user_metadata?.session_titles || {};

        const sessions: { id: string, title: string, start: string, end: string, conversation_id?: string }[] = [];
        if (data.length === 0) return;

        // Helper to finalize a session object
        const createSessionObj = (title: string, start: string, end: string, convId?: string) => {
            const lookupKey = convId || start;
            const savedTitle = customTitles[lookupKey];
            // Truncate title
            const cleanTitle = title || "New Chat";
            const displayTitle = savedTitle || (cleanTitle.substring(0, 30) + (cleanTitle.length > 30 ? '...' : ''));
            return {
                id: convId || generateId(),
                title: displayTitle,
                start,
                end,
                conversation_id: convId
            };
        };

        const convGroups: Record<string, { start: string, end: string, title: string, conversation_id: string }> = {};
        const legacyMessages: typeof data = [];

        data.forEach(msg => {
            if (msg.conversation_id) {
                if (!convGroups[msg.conversation_id]) {
                    convGroups[msg.conversation_id] = {
                        conversation_id: msg.conversation_id,
                        start: msg.created_at,
                        end: msg.created_at,
                        title: msg.text
                    };
                }
                const group = convGroups[msg.conversation_id];
                if (msg.created_at > group.end) group.end = msg.created_at;
                if (msg.created_at < group.start) group.start = msg.created_at;
                // Since data is ordered descending (newest first), the last message we process for a group is the OLDEST.
                // We want the topic to be based on the oldest message (start of convo), OR the newest?
                // Usually "New chat" title is derived from the first user message.
                // In DESC order, the LAST message encountered in this loop for a group is the FIRST message chronologically.
                group.title = msg.text;
            } else {
                legacyMessages.push(msg);
            }
        });

        Object.values(convGroups).forEach(g => {
            sessions.push(createSessionObj(g.title, g.start, g.end, g.conversation_id));
        });

        // Process Legacy (Time-based grouping)
        if (legacyMessages.length > 0) {
            let currentSession = {
                title: legacyMessages[0].text,
                start: legacyMessages[0].created_at,
                end: legacyMessages[0].created_at
            };

            for (let i = 0; i < legacyMessages.length; i++) {
                const msg = legacyMessages[i];
                const nextMsg = legacyMessages[i + 1];

                currentSession.start = msg.created_at;

                if (nextMsg) {
                    const timeDiff = new Date(msg.created_at).getTime() - new Date(nextMsg.created_at).getTime();
                    // 2 hours gap = new session start
                    if (timeDiff > 2 * 60 * 60 * 1000) {
                        sessions.push(createSessionObj(currentSession.title, currentSession.start, currentSession.end));
                        currentSession = {
                            title: nextMsg.text,
                            start: nextMsg.created_at,
                            end: nextMsg.created_at
                        };
                    }
                } else {
                    sessions.push(createSessionObj(currentSession.title, currentSession.start, currentSession.end));
                }
            }
        }

        // Sort by End time DESC (most active first)
        sessions.sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime());

        setRecentChats(sessions);
    };

    // Modal State
    const [targetChat, setTargetChat] = useState<typeof recentChats[0] | null>(null);
    const [modalAction, setModalAction] = useState<'rename' | 'delete' | null>(null);

    const openRenameModal = (chat: typeof recentChats[0]) => {
        setTargetChat(chat);
        setModalAction('rename');
    };

    const openDeleteModal = (chat: typeof recentChats[0]) => {
        setTargetChat(chat);
        setModalAction('delete');
    };

    const handleModalConfirm = async (inputValue?: string) => {
        if (!targetChat || !modalAction) return;

        if (modalAction === 'delete') {
            let query = supabase.from('messages').delete().eq('user_id', session.user.id);

            if (targetChat.conversation_id) {
                query = query.eq('conversation_id', targetChat.conversation_id);
            } else {
                query = query.gte('created_at', targetChat.start).lte('created_at', targetChat.end).is('conversation_id', null);
            }

            const { error } = await query;

            if (error) {
                console.error('Error deleting chat:', error);
                alert('Failed to delete chat. Please ensure database policies allow deletion.');
            } else {
                fetchChatHistory();
                setActiveMenuId(null);
                const params = new URLSearchParams(window.location.search);
                if (targetChat.conversation_id && params.get('chatId') === targetChat.conversation_id) {
                    window.location.href = '/?new=true';
                } else if (!targetChat.conversation_id && params.get('start') === targetChat.start) {
                    window.location.href = '/?new=true';
                }
            }
        }

        if (modalAction === 'rename' && inputValue && inputValue.trim()) {
            const newTitle = inputValue.trim();
            const lookupKey = targetChat.conversation_id || targetChat.start;
            const currentTitles = session.user.user_metadata?.session_titles || {};
            const updatedTitles = { ...currentTitles, [lookupKey]: newTitle };

            const { error } = await supabase.auth.updateUser({
                data: { session_titles: updatedTitles }
            });

            if (!error) {
                // Manually update
                session.user.user_metadata = { ...session.user.user_metadata, session_titles: updatedTitles };
                fetchChatHistory();
                setActiveMenuId(null);
            }
        }

        setModalAction(null);
        setTargetChat(null);
    };

    const generateId = () => Math.random().toString(36).substr(2, 9);

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed md:relative z-50 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out w-[280px]",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-[280px]"
                )}
            >
                {/* Header */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100">
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-lg shadow-black/20 group-hover:scale-105 transition-transform duration-200">
                            <span className="text-lg text-white font-bold">S</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight text-gray-900">Study Nudge</span>
                    </Link>
                    <button
                        onClick={onToggle}
                        className="p-2 text-gray-400 hover:text-black md:hidden"
                    >
                        <PanelLeftClose className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col p-3 gap-6 overflow-y-auto">
                    {/* New Chat Button */}
                    <Link
                        to="/?new=true"
                        className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors group"
                    >
                        <div className="p-1 bg-white rounded-md border border-gray-200 group-hover:border-gray-300">
                            <Plus className="w-4 h-4 text-gray-600" />
                        </div>
                        New chat
                    </Link>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-0.5">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => window.innerWidth < 768 && onToggle()}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                    location.pathname === item.href
                                        ? "bg-gray-100 text-black font-semibold"
                                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                )}
                            >
                                <item.icon className={cn("w-4 h-4", location.pathname === item.href ? "stroke-[2.5]" : "stroke-[2]")} />
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Recents */}
                    <div className="flex flex-col gap-1">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">Recents</h3>
                        {recentChats.map((chat, i) => (
                            <div key={i} className="group relative flex items-center justify-between hover:bg-gray-50 rounded-lg transition-colors">
                                <Link
                                    to={chat.conversation_id ? `/?chatId=${chat.conversation_id}` : `/?start=${encodeURIComponent(chat.start)}&end=${encodeURIComponent(chat.end)}`}
                                    onClick={() => window.innerWidth < 768 && onToggle()}
                                    className="flex-1 px-3 py-2 text-sm text-gray-600 hover:text-black truncate"
                                    title={chat.title}
                                >
                                    {chat.title}
                                </Link>
                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMenuId(chat.id === activeMenuId ? null : chat.id); }}
                                    className={cn("p-2 mr-1 rounded-md hover:bg-gray-200 transition-all", activeMenuId === chat.id ? "opacity-100 bg-gray-200" : "opacity-0 group-hover:opacity-100")}
                                >
                                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                </button>

                                {activeMenuId === chat.id && (
                                    <div className="absolute right-0 top-full mt-1 w-36 bg-[#1e1e1e] border border-gray-700/50 rounded-lg shadow-xl z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                                        <button
                                            onClick={() => openRenameModal(chat)}
                                            className="w-full text-left px-3 py-2.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-2 border-b border-white/5"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                            Rename
                                        </button>
                                        <button
                                            onClick={() => openDeleteModal(chat)}
                                            className="w-full text-left px-3 py-2.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* User Profile Section */}
                <div className="p-3 border-t border-gray-100">
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                                {session?.user?.user_metadata?.avatar_url ? (
                                    <img src={session?.user?.user_metadata?.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-sm font-bold text-gray-600">
                                        {session?.user?.email?.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 text-left overflow-hidden">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {session?.user?.user_metadata?.full_name || 'Student'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">Free Plan</p>
                            </div>
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>

                        {/* Profile Dropdown */}
                        {isProfileOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsProfileOpen(false)}
                                />
                                <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Signed in as</p>
                                        <p className="text-xs text-gray-900 truncate font-medium">{session?.user?.email}</p>
                                    </div>
                                    <div className="p-1">
                                        <Link
                                            to="/profile"
                                            onClick={() => setIsProfileOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
                                        >
                                            <User className="w-4 h-4" />
                                            Settings
                                        </Link>
                                        <button
                                            onClick={() => supabase.auth.signOut()}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </aside>

            <ActionModal
                isOpen={!!modalAction}
                onClose={() => { setModalAction(null); setTargetChat(null); }}
                onConfirm={handleModalConfirm}
                type={modalAction === 'rename' ? 'input' : 'confirm'}
                title={modalAction === 'rename' ? 'Rename Chat' : 'Delete Chat'}
                description={modalAction === 'delete' ? 'Are you sure you want to delete this chat history? This action cannot be undone.' : undefined}
                initialValue={modalAction === 'rename' && targetChat ? targetChat.title : ''}
                danger={modalAction === 'delete'}
                confirmText={modalAction === 'delete' ? 'Delete' : 'Save'}
                inputPlaceholder="Enter new chat name..."
            />
        </>
    );
}
