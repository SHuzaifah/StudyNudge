import { useState } from 'react';
import { TaskList } from './TaskList';
import { TaskCreationModal } from './TaskCreationModal';
import { type Task, type Persona } from '../types';
import { Zap, UserCircle, Plus } from 'lucide-react';

interface SidebarProps {
    tasks: Task[];
    onToggleTask: (taskId: string) => void;
    onDeleteTask: (taskId: string) => void;
    onCreateTask?: (task: Partial<Task>) => void;
    focusScore: number;
    currentPersona: Persona;
    onChangePersona: () => void;
    hideTaskList?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
    tasks,
    onToggleTask,
    onDeleteTask,
    onCreateTask,
    focusScore,
    currentPersona,
    onChangePersona,
    hideTaskList
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="hidden md:flex w-80 h-full flex-col gap-6 py-4 pr-6">
            {/* Persona Card */}
            <div className="relative group rounded-[20px] p-[1px] bg-gradient-to-b from-gray-200 to-white hover:from-gray-300 hover:to-gray-100 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="bg-white rounded-[19px] p-5 flex items-center gap-4 relative overflow-hidden">
                    <div className="relative">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-gray-100">
                            <span>{currentPersona.avatar}</span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-success border-[2.5px] border-white rounded-full"></div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-[15px] truncate leading-tight group-hover:text-black transition-colors">
                            {currentPersona.name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            {currentPersona.description}
                        </p>
                    </div>

                    <button
                        onClick={onChangePersona}
                        className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-black hover:bg-gray-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Switch Persona"
                    >
                        <UserCircle className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Stats / Info Card */}
            <div className="relative rounded-[24px] overflow-hidden shadow-lg shadow-black/5 group bg-black text-white">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px]"></div>

                <div className="relative p-6">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                            <Zap className="w-5 h-5 text-yellow-400 fill-current" />
                        </div>
                        <span className="text-[10px] uppercase tracking-wider font-bold bg-white/10 px-2 py-1 rounded-lg backdrop-blur-md border border-white/5 text-gray-300">
                            Daily Focus
                        </span>
                    </div>

                    <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-5xl font-bold tracking-tight title-font tabular-nums">
                            {focusScore}
                        </span>
                        <span className="text-lg font-medium text-gray-500">/100</span>
                    </div>

                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden mt-4 backdrop-blur-sm border border-white/5">
                        <div
                            className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all duration-1000 ease-out"
                            style={{ width: `${focusScore}%` }}
                        ></div>
                    </div>

                    <p className="text-sm font-medium text-gray-400 mt-4 leading-normal flex items-center gap-2">
                        {focusScore > 80 ? (
                            <>
                                <span className="text-lg">🔥</span>
                                <span>You're crushing it!</span>
                            </>
                        ) : (
                            <>
                                <span className="text-lg">💪</span>
                                <span>Let's lock in now.</span>
                            </>
                        )}
                    </p>
                </div>
            </div>

            {/* Task List Section */}
            {!hideTaskList && (
                <div className="flex-1 flex flex-col min-h-0 bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                            Your Tasks
                        </h3>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto p-2">
                        <TaskList tasks={tasks} onToggleTask={onToggleTask} onDeleteTask={onDeleteTask} />
                    </div>
                </div>
            )}

            {/* Modal */}
            {!hideTaskList && (
                <TaskCreationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={(task) => {
                        onCreateTask?.(task);
                        setIsModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};
