import { useEffect, useState } from 'react';
import { BarChart, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function AnalyticsPage() {
    const [stats, setStats] = useState({
        totalTasks: 0,
        completedTasks: 0,
        focusScore: 0,
        streak: 0
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch profile stats
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        // Fetch task stats
        const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id);

        if (tasks) {
            const total = tasks.length;
            const completed = tasks.filter((t: any) => t.completed).length;

            setStats({
                totalTasks: total,
                completedTasks: completed,
                focusScore: profile?.focus_score || 0,
                streak: profile?.current_streak || 0
            });
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 h-full overflow-y-auto">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analytics & Insights</h1>
                <p className="text-gray-500">Track your productivity and growth over time.</p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard
                    icon={<Activity className="text-black" />}
                    label="Focus Score"
                    value={`${stats.focusScore}%`}
                    trend="+5% vs last week"
                />
                <StatCard
                    icon={<BarChart className="text-black" />}
                    label="Tasks Completed"
                    value={`${stats.completedTasks}`}
                    trend={`${stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}% completion rate`}
                />
            </div>

            {/* Placeholder for Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-200 h-80 flex flex-col items-center justify-center bg-gray-50/50">
                    <BarChart className="w-10 h-10 text-gray-200 mb-3" />
                    <p className="text-gray-400 font-medium">Weekly Activity Chart (Coming Soon)</p>
                </div>
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-200 h-80 flex flex-col items-center justify-center bg-gray-50/50">
                    <Activity className="w-10 h-10 text-gray-200 mb-3" />
                    <p className="text-gray-400 font-medium">Task Category Breakdown (Coming Soon)</p>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, trend }: any) {
    return (
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-200 space-y-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    {icon}
                </div>
                <span className="text-sm font-medium text-gray-500">{label}</span>
            </div>
            <div>
                <div className="text-2xl font-bold text-gray-900 tracking-tight">{value}</div>
                <div className="text-xs text-gray-400 font-medium mt-1">{trend}</div>
            </div>
        </div>
    );
}
