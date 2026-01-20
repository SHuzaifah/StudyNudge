export type MessageType = 'text' | 'image' | 'voice';
export type Sender = 'user' | 'persona';

export interface Message {
    id: string;
    text: string;
    sender: Sender;
    timestamp: Date;
    type: MessageType;
    imageUrl?: string;
    quickReplies?: string[];
    conversation_id?: string;
}

export interface Persona {
    id: string;
    name: string;
    description: string;
    avatar: string; // URL or emoji for MVP
    tone: 'friendly' | 'firm' | 'bot';
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    dueDate: Date;
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
    category?: string;
    categoryColor?: string;
    isRecurring?: boolean;
    recurringInterval?: 'daily' | 'weekly' | 'monthly' | null;
    subtasks?: {
        id: string;
        title: string;
        completed: boolean;
    }[];
}

export interface UserSettings {
    name: string;
    selectedPersonaId: string;
    checkInTime: string; // "08:00"
}
