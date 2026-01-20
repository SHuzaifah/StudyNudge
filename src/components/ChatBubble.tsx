import React from 'react';
import { cn } from '../lib/utils';
import { type Message } from '../types';
import { Bot } from 'lucide-react';

interface ChatBubbleProps {
    message: Message;
    personaAvatar?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, personaAvatar }) => {
    const isUser = message.sender === 'user';

    return (
        <div className={cn("flex w-full mb-3 group/message", isUser ? "justify-end" : "justify-start")}>
            <div className={cn("flex max-w-[85%] md:max-w-[75%]", isUser ? "flex-row-reverse" : "flex-row gap-3")}>

                {/* Persona Avatar (Only for Bot) */}
                {!isUser && (
                    <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200 shadow-sm">
                            {personaAvatar ? (
                                <span className="text-lg leading-none grayscale">{personaAvatar}</span>
                            ) : (
                                <Bot className="w-4 h-4 text-black" />
                            )}
                        </div>
                    </div>
                )}

                {/* Bubble */}
                <div className={cn(
                    "relative shadow-sm transition-all duration-200 min-w-[120px]",
                    message.imageUrl ? "p-1" : "px-5 py-3.5",
                    isUser
                        ? "bg-black text-white rounded-[20px] rounded-br-[4px] hover:shadow-md hover:shadow-gray-200"
                        : "bg-white text-gray-800 rounded-[20px] rounded-tl-[4px] border border-gray-200 hover:border-gray-300 hover:shadow-md"
                )}>
                    {/* Bot Accent Line */}
                    {!isUser && (
                        <div className="absolute left-0 top-4 bottom-4 w-[3px] bg-black rounded-r-full opacity-0 group-hover/message:opacity-100 transition-opacity" />
                    )}

                    {message.imageUrl && (
                        <div className={cn("overflow-hidden rounded-2xl", message.text ? "mb-3" : "mb-1")}>
                            {message.imageUrl.endsWith('.pdf') ? (
                                <a
                                    href={message.imageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group/pdf"
                                >
                                    <div className="p-2 bg-red-100 text-red-600 rounded-lg group-hover/pdf:bg-red-200 transition-colors">
                                        <svg className="w-5 h-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">Document.pdf</span>
                                        <span className="text-[10px] text-gray-500">Click to preview</span>
                                    </div>
                                </a>
                            ) : (
                                <img
                                    src={message.imageUrl}
                                    alt="Attachment"
                                    className="max-w-full object-cover max-h-64 hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                                    onClick={() => window.open(message.imageUrl, '_blank')}
                                />
                            )}
                        </div>
                    )}

                    {message.text && (
                        <p className={cn(
                            "text-[15px] leading-relaxed whitespace-pre-wrap font-normal tracking-wide",
                            message.imageUrl && "px-2 py-1",
                            isUser ? "text-gray-50" : "text-gray-700"
                        )}>
                            {message.text}
                        </p>
                    )}

                    <div className={cn(
                        "text-[10px] font-medium mt-1 select-none flex justify-end",
                        message.imageUrl ? "px-1" : "",
                        isUser ? "text-white/50" : "text-gray-400"
                    )}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()}
                    </div>
                </div>
            </div>
        </div>
    );
};
