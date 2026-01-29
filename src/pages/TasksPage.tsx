import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ActionModal } from '../components/ActionModal';
import { TaskList } from '../components/TaskList';
import { TaskCreationModal } from '../components/TaskCreationModal';
import { type Task } from '../types';
import { Plus, CheckSquare } from 'lucide-react';

export function TasksPage({ session }: { session: any }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (session) {
            fetchTasks();
        }
    }, [session]);

    const fetchTasks = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: true });

        if (data) {
            const formattedTasks: Task[] = data.map(t => ({
                id: t.id,
                title: t.title,
                description: t.description,
                completed: t.completed,
                priority: t.priority,
                dueDate: new Date(t.due_date),
                category: t.category,
                categoryColor: t.category_color,
                isRecurring: t.is_recurring,
                recurringInterval: t.recurring_interval,
                subtasks: t.subtasks
            }));
            setTasks(formattedTasks);
        }
        if (error) console.error("Error fetching tasks", error);
        setIsLoading(false);
    };

    const handleCreateTask = async (task: Partial<Task>) => {
        if (!session) return;

        // Optimistic update
        const tempId = Math.random().toString(36).substr(2, 9);
        const newTask = {
            id: tempId,
            title: task.title!,
            dueDate: task.dueDate!,
            priority: task.priority!,
            completed: false,
            category: task.category,
            categoryColor: task.categoryColor,
            isRecurring: task.isRecurring,
            recurringInterval: task.recurringInterval,
            subtasks: task.subtasks
        } as Task;

        setTasks(prev => [...prev, newTask]);

        // DB Insert
        try {
            const { data, error } = await supabase.from('tasks').insert({
                user_id: session.user.id,
                title: task.title,
                description: task.description,
                priority: task.priority,
                due_date: task.dueDate!.toISOString(),
                category: task.category,
                category_color: task.categoryColor,
                is_recurring: task.isRecurring,
                recurring_interval: task.recurringInterval,
                subtasks: task.subtasks,
                completed: false
            }).select().single();

            if (error) throw error;

            if (data) {
                // Update temp ID with real ID
                setTasks(prev => prev.map(t => t.id === tempId ? { ...t, id: data.id } : t));

                // Notify AI context by adding a message to history
                // This ensures the AI knows about the task in the next conversation turn
                await supabase.from('messages').insert({
                    user_id: session.user.id,
                    text: `I just added a new task: "${task.title}" (Priority: ${task.priority}, Due: ${task.dueDate?.toLocaleDateString()}). Remind me about it!`,
                    sender: 'user',
                    type: 'text'
                });
            }
        } catch (error: any) {
            console.error("Error creating task with full details:", error);

            // Fallback: Try inserting just the core fields (in case schema is outdated)
            try {
                const { data: fallbackData, error: fallbackError } = await supabase.from('tasks').insert({
                    user_id: session.user.id,
                    title: task.title,
                    priority: task.priority,
                    due_date: task.dueDate!.toISOString(),
                    completed: false
                }).select().single();

                if (fallbackError) throw fallbackError;

                if (fallbackData) {
                    setTasks(prev => prev.map(t => t.id === tempId ? { ...t, id: fallbackData.id } : t));
                    alert("Task saved, but some details (category, subtasks) could not be stored. Please update your database schema.");
                }
            } catch (finalError) {
                console.error("Critical error creating task:", finalError);
                alert("Failed to save task. Please check your connection.");
                // Remove the optimistic update since it failed
                setTasks(prev => prev.filter(t => t.id !== tempId));
            }
        }
    };

    const handleToggleTask = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const newStatus = !task.completed;
        const newTasks = tasks.map(t => t.id === taskId ? { ...t, completed: newStatus } : t);
        setTasks(newTasks);

        await supabase.from('tasks').update({ completed: newStatus }).eq('id', taskId);
    };

    // Task Deletion Logic
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

    const handleDeleteTask = (taskId: string) => {
        setTaskToDelete(taskId);
    };

    const executeDeleteTask = async () => {
        if (!taskToDelete) return;

        const taskId = taskToDelete;

        // Optimistic UI update
        const newTasks = tasks.filter(t => t.id !== taskId);
        setTasks(newTasks);
        setTaskToDelete(null);

        try {
            const { error } = await supabase.from('tasks').delete().eq('id', taskId);
            if (error) throw error;
        } catch (error) {
            console.error("Error deleting task:", error);
            alert("Failed to delete task.");
            // Revert on error could be added here ideally
            fetchTasks();
        }
    };

    return (
        <div className="flex bg-gray-50 h-full overflow-hidden transition-colors">
            <div className="w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col h-full gap-6">

                <div className="flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 tracking-tight">
                            <div className="p-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                                <CheckSquare className="w-6 h-6 text-black" />
                            </div>
                            Task Management
                        </h1>
                        <p className="text-gray-500 text-sm mt-1 ml-14">Organize your study goals and daily routines.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-gray-800 text-white font-medium rounded-xl shadow-lg shadow-black/5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Task
                    </button>
                </div>

                <div className="flex-1 min-h-0 bg-white rounded-[24px] shadow-sm border border-gray-200 overflow-hidden transition-colors p-1">
                    {/* Reuse TaskList component, but maybe we want a grid view later? For now, stick to the list. */}
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-gray-400">Loading tasks...</div>
                    ) : (
                        <div className="h-full overflow-y-auto custom-scrollbar p-2">
                            <TaskList
                                tasks={tasks}
                                onToggleTask={handleToggleTask}
                                onDeleteTask={handleDeleteTask}
                            />
                        </div>
                    )}
                </div>
            </div>

            <TaskCreationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateTask}
            />

            <ActionModal
                isOpen={!!taskToDelete}
                onClose={() => setTaskToDelete(null)}
                onConfirm={executeDeleteTask}
                title="Delete Task"
                description="Are you sure you want to delete this task? This action cannot be undone."
                type="confirm"
                danger={true}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
}
