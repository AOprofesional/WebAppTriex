import React, { createContext, useContext, useState, useCallback } from 'react';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'danger' | 'primary' | 'success';
    showInput?: boolean;
    inputPlaceholder?: string;
    defaultValue?: string;
}

interface ConfirmResult {
    confirmed: boolean;
    value?: string;
}

interface ConfirmDialogContextType {
    confirm: (options: ConfirmOptions) => Promise<ConfirmResult>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export const useConfirm = () => {
    const context = useContext(ConfirmDialogContext);
    if (!context) {
        throw new Error('useConfirm must be used within ConfirmDialogProvider');
    }
    return context;
};

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [resolvePromise, setResolvePromise] = useState<((value: ConfirmResult) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmOptions): Promise<ConfirmResult> => {
        setOptions(opts);
        setInputValue(opts.defaultValue || '');
        setIsOpen(true);

        return new Promise<ConfirmResult>((resolve) => {
            setResolvePromise(() => resolve);
        });
    }, []);

    const handleConfirm = () => {
        if (resolvePromise) {
            resolvePromise({ confirmed: true, value: inputValue });
        }
        setIsOpen(false);
    };

    const handleCancel = () => {
        if (resolvePromise) {
            resolvePromise({ confirmed: false });
        }
        setIsOpen(false);
    };

    const getButtonStyles = (variant: string) => {
        switch (variant) {
            case 'danger':
                return 'bg-red-600 hover:bg-red-700 text-white';
            case 'success':
                return 'bg-green-600 hover:bg-green-700 text-white';
            default:
                return 'bg-orange-600 hover:bg-orange-700 text-white';
        }
    };

    return (
        <ConfirmDialogContext.Provider value={{ confirm }}>
            {children}

            {/* Confirm Dialog Modal */}
            {isOpen && options && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                            <h3 className="text-xl font-bold text-zinc-800 dark:text-white">
                                {options.title}
                            </h3>
                        </div>

                        <div className="p-6">
                            <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-line mb-4">
                                {options.message}
                            </p>
                            {options.showInput && (
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={options.inputPlaceholder}
                                    className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    autoFocus
                                />
                            )}
                        </div>

                        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex gap-3 justify-end">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                {options.cancelText || 'Cancelar'}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${getButtonStyles(
                                    options.confirmVariant || 'primary'
                                )}`}
                            >
                                {options.confirmText || 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmDialogContext.Provider>
    );
};
