import { useState } from 'react';
import { PanelLeft } from 'lucide-react';
import { type ReactNode } from 'react';
import { NavigationSidebar } from './NavigationSidebar';

interface LayoutProps {
    children: ReactNode;
    session: any;
}

export function Layout({ children, session }: LayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="h-[100dvh] flex bg-gray-50 font-sans transition-colors overflow-hidden">
            {/* Left Sidebar Navigation */}
            <NavigationSidebar
                session={session}
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                {/* Mobile Header (Only visible on small screens) */}
                <header className="md:hidden h-14 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-40 flex items-center justify-between px-4">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-gray-500 hover:text-black rounded-lg transition-colors"
                    >
                        <PanelLeft className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-gray-900">Study Nudge</span>
                    <div className="w-8" /> {/* Spacer to center title */}
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
