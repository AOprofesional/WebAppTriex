import React from 'react';

interface ContactCoordinatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    coordinatorPhone?: string | null;
    coordinatorEmail?: string | null;
}

export const ContactCoordinatorModal: React.FC<ContactCoordinatorModalProps> = ({
    isOpen,
    onClose,
    coordinatorPhone,
    coordinatorEmail
}) => {
    if (!isOpen) return null;

    const handleWhatsApp = () => {
        // Opens WhatsApp with a pre-filled message
        const phone = coordinatorPhone?.replace(/\D/g, '') || '5491123456789'; // Fallback or strict cleanup
        window.open(`https://wa.me/${phone}?text=Hola,%20necesito%20ayuda`, '_blank');
        onClose();
    };

    const handleEmail = () => {
        // Opens default email client
        const email = coordinatorEmail || 'agente@triex.com';
        window.location.href = `mailto:${email}?subject=Consulta%20general`;
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-triex-grey dark:text-white">
                            Contactar agente de ventas
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                        >
                            <span className="material-symbols-outlined text-zinc-500">close</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-zinc-600 dark:text-zinc-300 text-sm">
                        ¿Cómo preferís comunicarte con tu agente de ventas?
                    </p>

                    {/* WhatsApp Option */}
                    <button
                        onClick={handleWhatsApp}
                        className="w-full p-5 bg-[#25D366] hover:bg-[#20BA59] text-white rounded-2xl font-bold transition-all active:scale-95 flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-bold">WhatsApp</p>
                            <p className="text-xs text-white/80">Para consultas urgentes</p>
                        </div>
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>

                    {/* Email Option */}
                    <button
                        onClick={handleEmail}
                        className="w-full p-5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-2xl font-bold transition-all active:scale-95 flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl text-zinc-600 dark:text-zinc-300">mail</span>
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-bold">Email</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Para consultas generales</p>
                        </div>
                        <span className="material-symbols-outlined text-zinc-400">chevron_right</span>
                    </button>
                </div>

                {/* Footer */}
                <div className="p-6 pt-0">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-2xl font-bold transition-transform active:scale-95"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};
