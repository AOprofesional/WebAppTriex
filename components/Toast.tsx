import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        (type: ToastType, title: string, message?: string, duration = 3000) => {
            const id = `toast-${Date.now()}-${Math.random()}`;
            const newToast: Toast = { id, type, title, message, duration };

            setToasts((prev) => [...prev, newToast]);

            if (duration > 0) {
                setTimeout(() => removeToast(id), duration);
            }
        },
        [removeToast]
    );

    const success = useCallback(
        (title: string, message?: string) => showToast('success', title, message),
        [showToast]
    );

    const error = useCallback(
        (title: string, message?: string) => showToast('error', title, message, 5000),
        [showToast]
    );

    const warning = useCallback(
        (title: string, message?: string) => showToast('warning', title, message, 4000),
        [showToast]
    );

    const info = useCallback(
        (title: string, message?: string) => showToast('info', title, message),
        [showToast]
    );

    const getToastStyles = (type: ToastType) => {
        const baseStyles = 'border-l-4 shadow-lg';
        switch (type) {
            case 'success':
                return `${baseStyles} bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-200`;
            case 'error':
                return `${baseStyles} bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-200`;
            case 'warning':
                return `${baseStyles} bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-800 dark:text-yellow-200`;
            case 'info':
                return `${baseStyles} bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-800 dark:text-blue-200`;
        }
    };

    const getIconByType = (type: ToastType) => {
        switch (type) {
            case 'success':
                return 'check_circle';
            case 'error':
                return 'error';
            case 'warning':
                return 'warning';
            case 'info':
                return 'info';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-md">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`${getToastStyles(toast.type)} rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-right duration-300`}
                    >
                        <span className="material-symbols-outlined text-2xl flex-shrink-0 mt-0.5">
                            {getIconByType(toast.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm">{toast.title}</h4>
                            {toast.message && (
                                <p className="text-xs mt-1 opacity-90">{toast.message}</p>
                            )}
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
