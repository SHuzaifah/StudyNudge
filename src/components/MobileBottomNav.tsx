import { Link, useLocation } from 'react-router-dom';
import { Home, CheckSquare, BarChart2, User } from 'lucide-react';
import { cn } from '../lib/utils';

export function MobileBottomNav() {
    const location = useLocation();

    const items = [
        { href: '/', label: 'Home', icon: Home },
        { href: '/tasks', label: 'Tasks', icon: CheckSquare },
        { href: '/analytics', label: 'Analytics', icon: BarChart2 },
        { href: '/profile', label: 'You', icon: User },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 pb-safe z-50 shadow-[0_-1px_10px_rgba(0,0,0,0.02)]">
            <div className="flex justify-around items-center h-14">
                {items.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className="flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform"
                        >
                            <item.icon
                                className={cn(
                                    "w-6 h-6 transition-all duration-200",
                                    isActive ? "text-black fill-black" : "text-gray-500 stroke-[1.5]"
                                )}
                            />
                            <span
                                className={cn(
                                    "text-[10px] font-medium transition-colors",
                                    isActive ? "text-black" : "text-gray-500"
                                )}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
