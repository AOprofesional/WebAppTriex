
import React, { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useConfirm } from '../../components/ConfirmDialog';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export const AdminSettings: React.FC = () => {
    const { settings, saving, updateSetting } = useSettings();
    const { confirm } = useConfirm();

    const handleToggleDarkMode = async () => {
        const newValue = !settings.dark_mode;
        const { error } = await updateSetting('dark_mode', newValue);

        if (error) {
            toast.error('Error al guardar configuración');
        } else {
            toast.success(`Modo ${newValue ? 'oscuro' : 'claro'} activado`);
        }
    };

    const handleToggleEmailNotifications = async () => {
        const newValue = !settings.email_notifications;
        const { error } = await updateSetting('email_notifications', newValue);

        if (error) {
            toast.error('Error al guardar configuración');
        } else {
            toast.success(`Notificaciones por email ${newValue ? 'activadas' : 'desactivadas'}`);
        }
    };

    const handleTogglePushNotifications = async () => {
        const newValue = !settings.push_notifications;
        const { error } = await updateSetting('push_notifications', newValue);

        if (error) {
            toast.error('Error al guardar configuración');
        } else {
            toast.success(`Notificaciones push ${newValue ? 'activadas' : 'desactivadas'}`);
        }
    };

    const handleTimezoneChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = e.target.value;
        const { error } = await updateSetting('timezone', newValue);

        if (error) {
            toast.error('Error al guardar zona horaria');
        } else {
            toast.success('Zona horaria actualizada');
        }
    };

    const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = e.target.value;
        const { error } = await updateSetting('language', newValue);

        if (error) {
            toast.error('Error al guardar idioma');
        } else {
            toast.success('Idioma actualizado');
        }
    };

    const handleExportData = async () => {
        const confirmed = await confirm({
            title: 'Exportar Datos',
            message: 'Se descargará un archivo JSON con todos los datos del sistema (viajes, pasajeros, vouchers, notificaciones, puntos y canjes). ¿Deseas continuar?',
            confirmText: 'Exportar',
            confirmVariant: 'success'
        });

        if (!confirmed) return;

        try {
            toast.loading('Exportando datos...', { id: 'export' });

            // Get all data from main tables
            const { data: trips } = await supabase.from('trips').select('*');
            const { data: passengers } = await supabase.from('passengers').select('*');
            const { data: vouchers } = await supabase.from('vouchers').select('*');
            const { data: notifications } = await supabase.from('notifications').select('*');
            const { data: points } = await supabase.from('orange_points_ledger').select('*');
            const { data: redemptions } = await supabase.from('redemption_requests').select('*');

            const exportData = {
                exportDate: new Date().toISOString(),
                trips,
                passengers,
                vouchers,
                notifications,
                points,
                redemptions
            };

            // Create downloadable JSON file
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `triex-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('Datos exportados correctamente', { id: 'export' });
        } catch (error) {
            console.error('Error exporting data:', error);
            toast.error('Error al exportar datos', { id: 'export' });
        }
    };

    const handleRestartSystem = async () => {
        const confirmed = await confirm({
            title: 'Reiniciar Sistema',
            message: 'Esta acción reiniciará el sistema. Todos los usuarios serán desconectados temporalmente. ¿Estás seguro?',
            confirmText: 'Reiniciar',
            confirmVariant: 'danger'
        });

        if (!confirmed) return;

        toast.error('Función no disponible en esta versión');
    };

    const settingsSections = [
        {
            title: 'Apariencia',
            items: [
                {
                    label: 'Modo Oscuro',
                    description: 'Activar tema oscuro en el panel',
                    type: 'toggle',
                    value: settings.dark_mode,
                    onChange: handleToggleDarkMode
                },
            ]
        },
        {
            title: 'Notificaciones',
            items: [
                {
                    label: 'Notificaciones por email',
                    description: 'Recibir alertas importantes por correo',
                    type: 'toggle',
                    value: settings.email_notifications,
                    onChange: handleToggleEmailNotifications
                },
                {
                    label: 'Notificaciones push',
                    description: 'Alertas en el navegador',
                    type: 'toggle',
                    value: settings.push_notifications,
                    onChange: handleTogglePushNotifications
                },
            ]
        },
        {
            title: 'Sistema',
            items: [
                {
                    label: 'Zona horaria',
                    description: 'Configurar la zona horaria del sistema',
                    type: 'select',
                    value: settings.timezone,
                    options: ['America/Buenos_Aires', 'America/Mexico_City', 'Europe/Madrid', 'America/Sao_Paulo', 'America/Santiago'],
                    onChange: handleTimezoneChange
                },
                {
                    label: 'Idioma',
                    description: 'Idioma del panel de administración',
                    type: 'select',
                    value: settings.language,
                    options: ['Español', 'English', 'Português'],
                    onChange: handleLanguageChange
                },
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
                                        disabled={saving}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${item.value ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'
                                            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${item.value ? 'left-6' : 'left-1'}`}></span>
                                    </button>
                                )}
                                {item.type === 'select' && (
                                    <select
                                        value={item.value}
                                        onChange={item.onChange}
                                        disabled={saving}
                                        className={`px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white ${saving ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                    >
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
                    <button
                        onClick={handleExportData}
                        className="px-4 py-2 bg-white dark:bg-red-900/40 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
                    >
                        Exportar datos
                    </button>
                    <button
                        onClick={handleRestartSystem}
                        className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
                    >
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
