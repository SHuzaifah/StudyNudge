import React from 'react';
import { CheckCircle2, Circle, Clock, Trash2 } from 'lucide-react';
import { type Task } from '../types';
import { cn } from '../lib/utils';

interface TaskListProps {
    tasks: Task[];
    onToggleTask: (taskId: string) => void;
    onDeleteTask: (taskId: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onToggleTask, onDeleteTask }) => {
    const sortedTasks = [...tasks].sort((a, b) => {
        // Sort by completion (incomplete first), then priority (high first), then date
        if (a.completed !== b.completed) return a.completed ? 1 : -1;

        const priorityWeight = { high: 3, medium: 2, low: 1 };
        if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
            return priorityWeight[b.priority] - priorityWeight[a.priority];
        }

        return a.dueDate.getTime() - b.dueDate.getTime();
    });

    // We can remove the container wrapper since it's now wrapped in the Sidebar
    return (
        <div className="space-y-2">
            {sortedTasks.length === 0 ? (
                <div className="text-center py-10 px-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-100">
                        <CheckCircle2 className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-500">No tasks yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Tell Big Bro what you need to do!</p>
                </div>
            ) : (
                sortedTasks.map((task) => (
                    <div
                        key={task.id}
                        className={cn(
                            "group p-3 rounded-xl border transition-all duration-200 hover:shadow-sm",
                            task.completed
                                ? "bg-gray-50 border-gray-100 opacity-60"
                                : "bg-white border-gray-200 hover:border-gray-300"
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <button
                                onClick={() => onToggleTask(task.id)}
                                className="mt-0.5 flex-shrink-0 text-gray-300 hover:text-success transition-colors"
                            >
                                {task.completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-success" />
                                ) : (
                                    <Circle className="w-5 h-5 hover:stroke-[2.5]" />
                                )}
                            </button>

                            <div className="flex-1 min-w-0">
                                <h4 className={cn(
                                    "text-sm font-medium truncate transition-all",
                                    task.completed ? "text-gray-400 line-through" : "text-gray-900"
                                )}>
                                    {task.title}
                                </h4>

                                <div className="flex items-center gap-3 mt-1.5">
                                    <div className={cn(
                                        "flex items-center text-[10px] px-1.5 py-0.5 rounded-md font-medium border uppercase tracking-wide",
                                        task.priority === 'high' && "bg-red-50 text-red-500 border-red-200",
                                        task.priority === 'medium' && "bg-orange-50 text-orange-500 border-orange-200",
                                        task.priority === 'low' && "bg-gray-50 text-gray-500 border-gray-200"
                                    )}>
                                        <span className="capitalize">{task.priority}</span>
                                    </div>

                                    {task.category && (
                                        <div
                                            className="flex items-center text-[10px] px-1.5 py-0.5 rounded-md font-medium border uppercase tracking-wide"
                                            style={{
                                                borderColor: `${task.categoryColor}30` || '#e5e7eb',
                                                backgroundColor: `${task.categoryColor}10` || '#f9fafb',
                                                color: task.categoryColor || '#6b7280'
                                            }}
                                        >
                                            {task.category}
                                        </div>
                                    )}

                                    <div className="flex items-center text-xs text-gray-400">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {task.dueDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => onDeleteTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-error hover:bg-error/5 rounded-lg transition-all"
                                title="Delete task"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};
