import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatInterface } from '../components/ChatInterface';
import { Sidebar } from '../components/Sidebar';
import { CheckInModal } from '../components/CheckInModal';
import { type Message, type Persona, type Task } from '../types';
import { llmService } from '../lib/llm';
import { supabase } from '../lib/supabase';

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

const AVAILABLE_PERSONAS: Persona[] = [
    {
        id: 'big-bro',
        name: 'Big Bro',
        description: 'Supportive, protective, hype-man',
        avatar: '🧢',
        tone: 'friendly'
    },
    {
        id: 'future-self',
        name: 'Future You',
        description: 'Wise, regret-averse, ambitious',
        avatar: '🔮',
        tone: 'firm'
    }
];

interface DashboardProps {
    session: any;
}

export function Dashboard({ session }: DashboardProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [showCheckIn, setShowCheckIn] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const lastRequestId = useRef(0);
    const currentChatId = useRef<string | null>(null);

    // Settings & State
    const [currentPersona, setCurrentPersona] = useState<Persona>(AVAILABLE_PERSONAS[0]);
    const [focusScore, setFocusScore] = useState(0);

    const calculateFocusScore = (taskList: Task[]) => {
        const totalTasks = taskList.length;
        if (totalTasks === 0) return 0;

        const completedTasks = taskList.filter(t => t.completed).length;
        return Math.round((completedTasks / totalTasks) * 100);
    };

    useEffect(() => {
        if (session) {
            const requestId = ++lastRequestId.current;
            loadUserData(requestId);

            // Only show check-in if it's a new session/first load? For now, yes.
            const hasCheckedIn = sessionStorage.getItem('hasCheckedIn');
            if (!hasCheckedIn) {
                setShowCheckIn(true);
                sessionStorage.setItem('hasCheckedIn', 'true');
            }
        }
    }, [session, searchParams]);

    const loadUserData = async (requestId: number) => {
        // Fetch Tasks
        const { data: tasksData, error: taskError } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: true });

        if (requestId !== lastRequestId.current) return;

        if (tasksData) {
            const formattedTasks: Task[] = tasksData.map(t => ({
                id: t.id,
                title: t.title,
                completed: t.completed,
                priority: t.priority,
                dueDate: new Date(t.due_date)
            }));
            setTasks(formattedTasks);
            setFocusScore(calculateFocusScore(formattedTasks));
        }

        // Fetch Messages
        const isNewChat = searchParams.get('new') === 'true';
        const paramChatId = searchParams.get('chatId');

        if (isNewChat) {
            setMessages([]);
            currentChatId.current = null;
            return;
        }

        let query = supabase
            .from('messages')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: true });

        if (paramChatId) {
            query = query.eq('conversation_id', paramChatId);
            currentChatId.current = paramChatId;
        } else {
            // Fallback: existing behavior for legacy chats (last 24h)
            if (!paramChatId) {
                const yesterday = new Date();
                yesterday.setHours(yesterday.getHours() - 24);
                query = query.gte('created_at', yesterday.toISOString());
                currentChatId.current = null;
            }
        }

        const { data: msgData, error: msgError } = await query;

        if (requestId !== lastRequestId.current) return;

        if (msgData) {
            const formattedMessages: Message[] = msgData.map(m => ({
                id: m.id,
                text: m.text,
                sender: m.sender,
                timestamp: new Date(m.created_at),
                type: m.type,
                imageUrl: m.image_url,
                conversation_id: m.conversation_id
            }));
            setMessages(formattedMessages);
        }

        if (msgError || taskError) console.error("Error loading data", msgError, taskError);
    };

    const addMessageToDbAndState = async (msg: Partial<Message>) => {
        if (!session) return;

        // Ensure we have a conversation ID
        if (!currentChatId.current) {
            const newId = crypto.randomUUID();
            currentChatId.current = newId;
            // Update URL silently if possible, or just let state handle it
            setSearchParams({ chatId: newId });
        }

        const tempId = generateId();
        const newMsg: Message = {
            id: tempId,
            text: msg.text || '',
            sender: msg.sender || 'user',
            type: 'text',
            timestamp: new Date(),
            imageUrl: msg.imageUrl,
            conversation_id: currentChatId.current
        };
        setMessages(prev => [...prev, newMsg]);

        const { data } = await supabase.from('messages').insert({
            user_id: session.user.id,
            text: msg.text,
            sender: msg.sender,
            type: 'text',
            image_url: msg.imageUrl,
            conversation_id: currentChatId.current
        }).select().single();

        if (data) {
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id } : m));
        }
    };



    const handleSwitchPersona = () => {
        const nextIndex = (AVAILABLE_PERSONAS.findIndex(p => p.id === currentPersona.id) + 1) % AVAILABLE_PERSONAS.length;
        const nextPersona = AVAILABLE_PERSONAS[nextIndex];
        setCurrentPersona(nextPersona);

        const text = nextPersona.id === 'big-bro'
            ? "Yo, I'm back! Let's get this energy up! ⚡️"
            : "Hello. I am stepping in to ensure we stay on the path to success. 🛤️";

        addMessageToDbAndState({
            text,
            sender: 'persona',
            type: 'text'
        });
    };

    const processUserMessage = async (text: string, imageUrl?: string) => {
        const lowerText = text.toLowerCase();

        if (lowerText.includes('task') || lowerText.includes('todo') || lowerText.includes('remind')) {
            const title = text.replace(/^(add )?(task|todo|remind me to) /i, '').trim() || 'New Task';

            const tempId = generateId();
            const newTask: Task = {
                id: tempId,
                title: title,
                dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
                priority: 'medium',
                completed: false
            };
            setTasks(prev => [...prev, newTask]);

            if (session) {
                await supabase.from('tasks').insert({
                    user_id: session.user.id,
                    title: title,
                    priority: 'medium',
                    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
                });
            }
        }

        setIsTyping(true);
        // Include conversation history from the current session mostly? 
        // We pass the last 10 messages from current filtered view, which filters by chatId correctly.
        const response = await llmService.sendMessage(
            messages.slice(-10),
            text,
            currentPersona,
            imageUrl
        );

        setIsTyping(false);
        await addMessageToDbAndState({
            text: response.text,
            sender: 'persona',
            type: 'text'
        });
    };

    const handleSendMessage = async (text: string, imageUrl?: string) => {
        await addMessageToDbAndState({
            text,
            sender: 'user',
            type: 'text',
            imageUrl
        });

        setIsTyping(true);
        setTimeout(() => {
            processUserMessage(text, imageUrl);
        }, 800);
    };

    const handleCheckInSubmit = async (plan: string) => {
        setShowCheckIn(false);
        await addMessageToDbAndState({
            text: `My plan for today: ${plan}`,
            sender: 'user',
            type: 'text'
        });

        setIsTyping(true);
        setTimeout(async () => {
            const text = currentPersona.id === 'big-bro'
                ? "That's a solid plan! Let's lock in. 🔒 I'll check on you in a bit."
                : "A plan is nothing without execution. I will monitor your progress.";

            await addMessageToDbAndState({
                text,
                sender: 'persona',
                type: 'text'
            });
            setIsTyping(false);
        }, 1000);
    };

    // Nudge Engine
    useEffect(() => {
        if (!session) return;
        const nudgeInterval = setInterval(() => {
            const urgentTask = tasks.find(t => !t.completed && t.priority === 'high');
            if (urgentTask && Math.random() > 0.9) {
                setIsTyping(true);
                setTimeout(() => {
                    const text = currentPersona.id === 'big-bro'
                        ? `Hey, haven't forgotten about "${urgentTask.title}", right? 👀`
                        : `reminder: "${urgentTask.title}" is still pending. Procrastination is the thief of time.`;

                    addMessageToDbAndState({
                        text,
                        sender: 'persona',
                        type: 'text'
                    });
                    setIsTyping(false);
                }, 3000);
            }
        }, 30000);
        return () => clearInterval(nudgeInterval);
    }, [tasks, currentPersona, session]);

    return (
        <div className="flex justify-center bg-gray-50 h-full overflow-hidden transition-colors">
            <CheckInModal
                isOpen={showCheckIn}
                onClose={() => setShowCheckIn(false)}
                onSubmit={handleCheckInSubmit}
            />

            <div className="w-full max-w-7xl h-full flex flex-col md:flex-row md:p-6 gap-6">

                <div className="flex-1 bg-white h-full shadow-sm overflow-hidden flex flex-col md:rounded-[24px] border border-gray-200 transition-colors">
                    <ChatInterface
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        currentPersona={currentPersona}
                        isTyping={isTyping}
                    />
                </div>

                <Sidebar
                    tasks={[]} // Tasks moved to /tasks page
                    onToggleTask={() => { }}
                    onDeleteTask={() => { }}
                    focusScore={focusScore}
                    currentPersona={currentPersona}
                    onChangePersona={handleSwitchPersona}
                    hideTaskList={true}
                />

            </div>
        </div>
    );
}
