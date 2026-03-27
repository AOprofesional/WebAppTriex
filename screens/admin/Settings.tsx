import React, { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useConfirm } from '../../components/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { uploadProfilePhoto, deleteProfilePhoto } from '../../utils/profileImageUpload';
import { ProfilePhotoModal } from '../../components/ProfilePhotoModal';
import { PasswordStrengthMeter } from '../../components/PasswordStrengthMeter';
import { validatePasswordStrength } from '../../utils/passwordUtils';

export const AdminSettings: React.FC = () => {
    const { settings, saving, updateSetting } = useSettings();
    const { confirm } = useConfirm();
    const { role, user } = useAuth();
    const isOperator = role === 'operator';

    // Profile state
    const [profileName, setProfileName] = useState('');
    const [profilePhone, setProfilePhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [newPhone, setNewPhone] = useState('');
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    
    // Password state
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [updatingProfile, setUpdatingProfile] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('profiles')
                .select('full_name, avatar_url, phone')
                .eq('id', user.id)
                .single();
            if (data) {
                setProfileName(data.full_name || '');
                setNewName(data.full_name || '');
                setProfilePhone(data.phone || '');
                setNewPhone(data.phone || '');
                setAvatarUrl(data.avatar_url);
            } else if (user.user_metadata?.full_name || user.user_metadata?.name) {
                const metaName = user.user_metadata.full_name || user.user_metadata.name;
                setProfileName(metaName);
                setNewName(metaName);
                
                const metaPhone = user.user_metadata.phone;
                if (metaPhone) {
                    setProfilePhone(metaPhone);
                    setNewPhone(metaPhone);
                }
            }
        };
        fetchProfile();
    }, [user]);

    const handleSaveName = async () => {
        if (!newName.trim()) {
            toast.error('El nombre no puede estar vacío');
            return;
        }
        if (!user) return;

        setUpdatingProfile(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: newName.trim(), updated_at: new Date().toISOString() })
                .eq('id', user.id);
            if (error) throw error;
            
            // Also update user_metadata to keep it in sync
            await supabase.auth.updateUser({
                data: { full_name: newName.trim() }
            });

            setProfileName(newName.trim());
            setIsEditingName(false);
            toast.success('Nombre actualizado');
        } catch (error) {
            console.error('Error updating name:', error);
            toast.error('Error al actualizar el nombre');
        } finally {
            setUpdatingProfile(false);
        }
    };

    const handleSavePhone = async () => {
        if (!user) return;

        setUpdatingProfile(true);
        try {
            const phoneVal = newPhone.trim() || null;
            const { error } = await supabase
                .from('profiles')
                .update({ phone: phoneVal, updated_at: new Date().toISOString() })
                .eq('id', user.id);
            if (error) throw error;
            
            // Also update user_metadata to keep it in sync
            await supabase.auth.updateUser({
                data: { phone: phoneVal }
            });

            setProfilePhone(phoneVal || '');
            setIsEditingPhone(false);
            toast.success('Teléfono actualizado');
        } catch (error) {
            console.error('Error updating phone:', error);
            toast.error('Error al actualizar el teléfono');
        } finally {
            setUpdatingProfile(false);
        }
    };

    const handleUploadAvatar = async (file: File) => {
        if (!user) return;
        try {
            if (avatarUrl) {
                try {
                    await deleteProfilePhoto(avatarUrl);
                } catch (e) {
                    console.warn('Could not delete old avatar:', e);
                }
            }
            const photoUrl = await uploadProfilePhoto(user.id, file);
            const { error } = await supabase
                .from('profiles')
                .update({ avatar_url: photoUrl, updated_at: new Date().toISOString() })
                .eq('id', user.id);
            if (error) throw error;
            setAvatarUrl(photoUrl);
            toast.success('Foto de perfil actualizada');
        } catch (error: any) {
            toast.error('Error al subir la foto');
            throw error;
        }
    };

    const handleRemoveAvatar = async () => {
        if (!user || !avatarUrl) return;
        try {
            await deleteProfilePhoto(avatarUrl);
            const { error } = await supabase
                .from('profiles')
                .update({ avatar_url: null, updated_at: new Date().toISOString() })
                .eq('id', user.id);
            if (error) throw error;
            setAvatarUrl(null);
            toast.success('Foto de perfil eliminada');
        } catch (error: any) {
            toast.error('Error al eliminar la foto');
            throw error;
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword) {
            toast.error('Ingresá una nueva contraseña');
            return;
        }

        const validation = validatePasswordStrength(newPassword);
        if (!validation.isValid) {
            toast.error(validation.errors[0]);
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        setUpdatingProfile(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) throw error;

            setNewPassword('');
            setConfirmPassword('');
            setIsEditingPassword(false);
            toast.success('Contraseña actualizada correctamente');
        } catch (err: any) {
            toast.error('Error al cambiar contraseña');
        } finally {
            setUpdatingProfile(false);
        }
    };

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
        const confirmResult = await confirm({
            title: 'Exportar Datos',
            message: 'Se descargará un archivo JSON con todos los datos del sistema (viajes, pasajeros, vouchers, notificaciones, puntos y canjes). ¿Deseas continuar?',
            confirmText: 'Exportar',
            confirmVariant: 'success'
        });

        if (!confirmResult.confirmed) return;

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
        const confirmResult = await confirm({
            title: 'Reiniciar Sistema',
            message: 'Esta acción reiniciará el sistema. Todos los usuarios serán desconectados temporalmente. ¿Estás seguro?',
            confirmText: 'Reiniciar',
            confirmVariant: 'danger'
        });

        if (!confirmResult.confirmed) return;

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

    // Operators can only access the Appearance section (Dark Mode)
    const visibleSections = isOperator
        ? settingsSections.filter(s => s.title === 'Apariencia')
        : settingsSections;

    return (
        <div className="max-w-3xl space-y-6 pb-20">
            {/* Perfil Personal */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <h2 className="text-base font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">person</span>
                        Tu Perfil
                    </h2>
                </div>
                
                <div className="p-6 space-y-8">
                    {/* Header: Avatar and Name */}
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-sm overflow-hidden">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-4xl text-zinc-400">person</span>
                                )}
                            </div>
                            <button
                                onClick={() => setShowPhotoModal(true)}
                                className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-zinc-900 transition-transform active:scale-95"
                            >
                                <span className="material-symbols-outlined text-sm font-bold">edit</span>
                            </button>
                        </div>
                        
                        <div className="flex-1 w-full text-center sm:text-left space-y-2">
                            {isEditingName ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                                        placeholder="Tu nombre completo"
                                    />
                                    <button 
                                        onClick={handleSaveName}
                                        disabled={updatingProfile}
                                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                                    >
                                        Guardar
                                    </button>
                                    <button 
                                        onClick={() => { setIsEditingName(false); setNewName(profileName); }}
                                        className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-bold transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center justify-center sm:justify-start gap-2">
                                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{profileName || 'Usuario'}</h3>
                                        <button onClick={() => setIsEditingName(true)} className="text-zinc-400 hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                    </div>
                                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 mb-1">{user?.email}</p>
                                    
                                    {isEditingPhone ? (
                                        <div className="flex items-center gap-2 mt-2">
                                            <input
                                                type="tel"
                                                value={newPhone}
                                                onChange={(e) => setNewPhone(e.target.value)}
                                                className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                                                placeholder="Tu teléfono"
                                            />
                                            <button 
                                                onClick={handleSavePhone}
                                                disabled={updatingProfile}
                                                className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                            >
                                                Guardar
                                            </button>
                                            <button 
                                                onClick={() => { setIsEditingPhone(false); setNewPhone(profilePhone); }}
                                                className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 select-none">
                                            <span className="material-symbols-outlined text-zinc-400 text-sm">phone</span>
                                            <p className={`text-sm ${profilePhone ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 italic'}`}>
                                                {profilePhone || 'Sin teléfono'}
                                            </p>
                                            <button onClick={() => setIsEditingPhone(true)} className="text-zinc-400 hover:text-primary transition-colors">
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                        </div>
                                    )}
                                    <div className="inline-block mt-2 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full text-xs font-semibold uppercase tracking-wider">
                                        {role === 'operator' ? 'Operador' : 'Administrador'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Password Reset Section */}
                    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
                        {!isEditingPassword ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-zinc-800 dark:text-white">Contraseña</p>
                                    <p className="text-xs text-zinc-500 mt-1">Garantizá la seguridad de tu cuenta actualizando tu contraseña.</p>
                                </div>
                                <button 
                                    onClick={() => setIsEditingPassword(true)}
                                    className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
                                >
                                    Cambiar
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 max-w-sm">
                                <h3 className="text-sm font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-lg">lock_reset</span>
                                    Cambiar Contraseña
                                </h3>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">Nueva Contraseña</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary text-zinc-900 dark:text-white pr-10"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPasswords(!showPasswords)}
                                            className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">{showPasswords ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                    {newPassword && <div className="mt-2"><PasswordStrengthMeter password={newPassword} /></div>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">Confirmar Contraseña</label>
                                    <input
                                        type={showPasswords ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary text-zinc-900 dark:text-white"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button 
                                        onClick={handleChangePassword}
                                        disabled={updatingProfile}
                                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                                    >
                                        Cambiar
                                    </button>
                                    <button 
                                        onClick={() => { setIsEditingPassword(false); setNewPassword(''); setConfirmPassword(''); }}
                                        className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-bold transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {visibleSections.map((section) => (
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

            {/* Danger Zone — admin only */}
            {!isOperator && (<div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-6">
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
            )}

            {/* Version Info */}
            <div className="text-center py-4">
                <p className="text-xs text-zinc-400">Triex Admin v1.0.0 • © 2024 Triex Travel</p>
            </div>

            {/* Profile Photo Modal */}
            <ProfilePhotoModal
                isOpen={showPhotoModal}
                onClose={() => setShowPhotoModal(false)}
                currentPhotoUrl={avatarUrl}
                onUpload={handleUploadAvatar}
                onRemove={avatarUrl ? handleRemoveAvatar : undefined}
            />
        </div>
    );
};
