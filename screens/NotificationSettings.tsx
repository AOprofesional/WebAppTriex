import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePassenger } from '../hooks/usePassenger';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { PageLoading } from '../components/PageLoading';
import { useToast } from '../components/Toast';

export const NotificationSettings: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { passenger, loading, updateNotificationPreferences } = usePassenger();
    const { sendTestNotification } = usePushNotifications();
    const [saving, setSaving] = useState(false);

    const handleTestNotification = async () => {
        const success = await sendTestNotification();
        if (success) toast.success('Notificación enviada');
    };

    const [preferences, setPreferences] = useState({
        push: true,
        email: true,
        categories: {
            trip_updates: true,
            document_reminders: true,
            payments: true,
            marketing: false,
        },
    });

    useEffect(() => {
        if (passenger?.notification_preferences) {
            setPreferences(passenger.notification_preferences);
        }
    }, [passenger]);

    const handleToggle = (key: string, value: boolean) => {
        if (key.includes('.')) {
            const [parent, child] = key.split('.');
            setPreferences((prev) => ({
                ...prev,
                [parent]: {
                    ...(prev as any)[parent],
                    [child]: value,
                },
            }));
        } else {
            setPreferences((prev) => ({
                ...prev,
                [key]: value,
            }));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateNotificationPreferences(preferences);
            alert('Preferencias guardadas correctamente');
            navigate('/profile');
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <PageLoading message="Cargando configuración..." />;
    }

    return (
        <div className="min-h-screen bg-triex-bg dark:bg-zinc-950 pb-20">
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between bg-white dark:bg-zinc-950 sticky top-0 z-50 border-b border-zinc-100 dark:border-zinc-800">
                <button
                    onClick={() => navigate(-1)}
                    disabled={saving}
                    className="p-1 -ml-1 text-zinc-800 dark:text-zinc-200"
                >
                    <span className="material-symbols-outlined text-[28px]">chevron_left</span>
                </button>
                <h1 className="text-lg font-bold text-zinc-800 dark:text-white">
                    Notificaciones
                </h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="text-primary font-bold text-[15px] disabled:opacity-50"
                >
                    {saving ? 'Guardando...' : 'Guardar'}
                </button>
            </div>

            {/* Content */}
            <div className="px-5 py-6 space-y-6">
                {/* General Notifications */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                        <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                            General
                        </h2>
                    </div>

                    {/* Push Notifications */}
                    <div className="flex items-center justify-between p-5 border-b border-zinc-50 dark:border-zinc-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">
                                    notifications_active
                                </span>
                            </div>
                            <div>
                                <p className="font-bold text-zinc-800 dark:text-white">
                                    Notificaciones Push
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Alertas en tu dispositivo
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle('push', !preferences.push)}
                            className={`w-12 h-6 rounded-full transition-all duration-300 relative ${preferences.push ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-700'
                                }`}
                        >
                            <div
                                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${preferences.push ? 'translate-x-6 shadow-md' : ''
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Email Notifications */}
                    <div className="flex items-center justify-between p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-xl">
                                    mail
                                </span>
                            </div>
                            <div>
                                <p className="font-bold text-zinc-800 dark:text-white">
                                    Notificaciones por Email
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Recibir emails informativos
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle('email', !preferences.email)}
                            className={`w-12 h-6 rounded-full transition-all duration-300 relative ${preferences.email ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-700'
                                }`}
                        >
                            <div
                                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${preferences.email ? 'translate-x-6 shadow-md' : ''
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Test Notification Button */}
                    <div className="flex items-center justify-between p-5 border-t border-zinc-50 dark:border-zinc-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-xl">
                                    send_to_mobile
                                </span>
                            </div>
                            <div>
                                <p className="font-bold text-zinc-800 dark:text-white">
                                    Probar Notificaciones
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Envía una notificación de prueba a este dispositivo
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleTestNotification}
                            className="text-sm font-semibold text-primary hover:underline px-2"
                        >
                            Enviar
                        </button>
                    </div>
                </div>

                {/* Category Preferences */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                        <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                            Tipo de Notificaciones
                        </h2>
                    </div>

                    {/* Trip Updates */}
                    <div className="flex items-center justify-between p-5 border-b border-zinc-50 dark:border-zinc-800/50">
                        <div className="flex-1">
                            <p className="font-bold text-zinc-800 dark:text-white">
                                Actualizaciones de Viajes
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Cambios en itinerarios, fechas, etc.
                            </p>
                        </div>
                        <button
                            onClick={() =>
                                handleToggle('categories.trip_updates', !preferences.categories.trip_updates)
                            }
                            className={`w-12 h-6 rounded-full transition-all duration-300 relative ${preferences.categories.trip_updates ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-700'
                                }`}
                        >
                            <div
                                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${preferences.categories.trip_updates ? 'translate-x-6 shadow-md' : ''
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Document Reminders */}
                    <div className="flex items-center justify-between p-5 border-b border-zinc-50 dark:border-zinc-800/50">
                        <div className="flex-1">
                            <p className="font-bold text-zinc-800 dark:text-white">
                                Recordatorios de Documentación
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Documentos pendientes, vencimientos
                            </p>
                        </div>
                        <button
                            onClick={() =>
                                handleToggle(
                                    'categories.document_reminders',
                                    !preferences.categories.document_reminders
                                )
                            }
                            className={`w-12 h-6 rounded-full transition-all duration-300 relative ${preferences.categories.document_reminders
                                ? 'bg-primary'
                                : 'bg-zinc-200 dark:bg-zinc-700'
                                }`}
                        >
                            <div
                                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${preferences.categories.document_reminders ? 'translate-x-6 shadow-md' : ''
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Payments */}
                    <div className="flex items-center justify-between p-5 border-b border-zinc-50 dark:border-zinc-800/50">
                        <div className="flex-1">
                            <p className="font-bold text-zinc-800 dark:text-white">
                                Confirmaciones de Pago
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Recibos, facturación, pagos
                            </p>
                        </div>
                        <button
                            onClick={() =>
                                handleToggle('categories.payments', !preferences.categories.payments)
                            }
                            className={`w-12 h-6 rounded-full transition-all duration-300 relative ${preferences.categories.payments ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-700'
                                }`}
                        >
                            <div
                                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${preferences.categories.payments ? 'translate-x-6 shadow-md' : ''
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Marketing */}
                    <div className="flex items-center justify-between p-5">
                        <div className="flex-1">
                            <p className="font-bold text-zinc-800 dark:text-white">
                                Promociones y Novedades
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Ofertas, nuevos destinos, noticias
                            </p>
                        </div>
                        <button
                            onClick={() =>
                                handleToggle('categories.marketing', !preferences.categories.marketing)
                            }
                            className={`w-12 h-6 rounded-full transition-all duration-300 relative ${preferences.categories.marketing ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-700'
                                }`}
                        >
                            <div
                                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${preferences.categories.marketing ? 'translate-x-6 shadow-md' : ''
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
