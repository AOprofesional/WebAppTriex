
import React, { useState } from 'react';

export const AdminSettings: React.FC = () => {
    const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const settingsSections = [
        {
            title: 'Apariencia',
            items: [
                { label: 'Modo Oscuro', description: 'Activar tema oscuro en el panel', type: 'toggle', value: darkMode, onChange: toggleDarkMode },
            ]
        },
        {
            title: 'Notificaciones',
            items: [
                { label: 'Notificaciones por email', description: 'Recibir alertas importantes por correo', type: 'toggle', value: true },
                { label: 'Notificaciones push', description: 'Alertas en el navegador', type: 'toggle', value: false },
            ]
        },
        {
            title: 'Sistema',
            items: [
                { label: 'Zona horaria', description: 'Configurar la zona horaria del sistema', type: 'select', options: ['America/Buenos_Aires', 'America/Mexico_City', 'Europe/Madrid'] },
                { label: 'Idioma', description: 'Idioma del panel de administración', type: 'select', options: ['Español', 'English', 'Português'] },
            ]
        },
    ];

    return (
        <div className="max-w-3xl space-y-6">
            {settingsSections.map((section) => (
                <div key={section.title} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                        <h2 className="text-base font-bold text-zinc-800 dark:text-white">{section.title}</h2>
                    </div>
                    <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
                        {section.items.map((item, i) => (
                            <div key={i} className="px-6 py-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-zinc-800 dark:text-white">{item.label}</p>
                                    <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>
                                </div>
                                {item.type === 'toggle' && (
                                    <button
                                        onClick={item.onChange}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${item.value ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${item.value ? 'left-6' : 'left-1'}`}></span>
                                    </button>
                                )}
                                {item.type === 'select' && (
                                    <select className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm">
                                        {item.options?.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-6">
                <h3 className="text-base font-bold text-red-600 dark:text-red-400 mb-2">Zona de Peligro</h3>
                <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">Estas acciones son irreversibles. Proceder con precaución.</p>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white dark:bg-red-900/40 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/60">
                        Exportar datos
                    </button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">
                        Reiniciar sistema
                    </button>
                </div>
            </div>

            {/* Version Info */}
            <div className="text-center py-4">
                <p className="text-xs text-zinc-400">Triex Admin v1.0.0 • © 2024 Triex Travel</p>
            </div>
        </div>
    );
};
