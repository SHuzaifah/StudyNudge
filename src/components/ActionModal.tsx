import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (inputValue?: string) => void;
    title: string;
    description?: string;
    type: 'confirm' | 'input';
    initialValue?: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    inputPlaceholder?: string;
}

export const ActionModal: React.FC<ActionModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    type,
    initialValue = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = false,
    inputPlaceholder = ''
}) => {
    const [inputValue, setInputValue] = useState(initialValue);

    useEffect(() => {
        if (isOpen) {
            setInputValue(initialValue);
        }
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(inputValue);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-[20px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{title}</h3>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {description && (
                        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                            {description}
                        </p>
                    )}

                    <form onSubmit={handleSubmit}>
                        {type === 'input' && (
                            <div className="mb-6">
                                <input
                                    autoFocus
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={inputPlaceholder}
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400"
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-xl transition-colors"
                            >
                                {cancelText}
                            </button>
                            <button
                                type="submit"
                                disabled={type === 'input' && !inputValue.trim()}
                                className={`flex-1 px-4 py-2.5 text-white text-sm font-medium rounded-xl transition-all shadow-sm active:scale-[0.98] ${danger
                                        ? 'bg-red-500 hover:bg-red-600 shadow-red-500/10'
                                        : 'bg-black hover:bg-gray-800 shadow-black/10'
                                    }`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
