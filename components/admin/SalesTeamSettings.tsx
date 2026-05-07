import React, { useState, useRef } from 'react';
import { useSalesTeam, SalesTeamMember, SalesTeamInsert } from '../../hooks/useSalesTeam';
import { useConfirm } from '../../components/ConfirmDialog';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export const SalesTeamSettings: React.FC = () => {
    const { team, loading, addMember, updateMember, deleteMember } = useSalesTeam();
    const { confirm } = useConfirm();
    
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState<Partial<SalesTeamInsert>>({});
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleEdit = (member: SalesTeamMember) => {
        setFormData(member);
        setIsEditing(member.id);
        setIsAdding(false);
    };

    const handleAdd = () => {
        setFormData({ name: '', role: 'Ventas', phone: '', email: '', image_url: '', order_index: team.length + 1 });
        setIsAdding(true);
        setIsEditing(null);
    };

    const handleCancel = () => {
        setIsEditing(null);
        setIsAdding(false);
        setFormData({});
    };

    const handleSave = async () => {
        if (!formData.name || !formData.role) {
            toast.error('Nombre y Puesto son obligatorios');
            return;
        }

        if (isAdding) {
            const success = await addMember(formData as SalesTeamInsert);
            if (success) handleCancel();
        } else if (isEditing) {
            const success = await updateMember(isEditing, formData);
            if (success) handleCancel();
        }
    };

    const handleDelete = async (member: SalesTeamMember) => {
        const confirmResult = await confirm({
            title: 'Eliminar Miembro',
            message: `¿Estás seguro que deseas eliminar a ${member.name} del equipo?`,
            confirmText: 'Eliminar',
            confirmVariant: 'danger'
        });

        if (confirmResult.confirmed) {
            await deleteMember(member.id);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingImage(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const filePath = `Equipo/${fileName}`;

            // Upload to triex-public bucket
            const { error: uploadError } = await supabase.storage
                .from('triex-public')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('triex-public')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, image_url: publicUrl }));
            toast.success('Imagen subida correctamente');
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Error al subir la imagen');
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 flex justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
                <div>
                    <h2 className="text-base font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">groups</span>
                        Equipo Triex
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Configuración del equipo visible en la sección de contacto</p>
                </div>
                {!isAdding && !isEditing && (
                    <button
                        onClick={handleAdd}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Agregar
                    </button>
                )}
            </div>

            <div className="p-6">
                {(isAdding || isEditing) ? (
                    <div className="space-y-4 bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <h3 className="font-bold text-zinc-900 dark:text-white mb-4">
                            {isAdding ? 'Agregar Miembro' : 'Editar Miembro'}
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2 flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden shrink-0">
                                    {formData.image_url ? (
                                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                            <span className="material-symbols-outlined">person</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">Foto (opcional)</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingImage}
                                            className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                                        >
                                            <span className="material-symbols-outlined text-sm">upload</span>
                                            {uploadingImage ? 'Subiendo...' : 'Subir Imagen'}
                                        </button>
                                        <span className="text-xs text-zinc-400">o ingresá la URL abajo</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.image_url || ''}
                                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full mt-2 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">Nombre Completo *</label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">Puesto *</label>
                                <input
                                    type="text"
                                    value={formData.role || ''}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">Teléfono (WhatsApp)</label>
                                <input
                                    type="text"
                                    value={formData.phone || ''}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="549261..."
                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">Email (opcional)</label>
                                <input
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="correo@triex.com"
                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-700">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-bold hover:bg-zinc-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {team.map((member) => (
                            <div key={member.id} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 flex items-center gap-4 border border-zinc-100 dark:border-zinc-700/50">
                                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                                    {member.image_url ? (
                                        <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-400">
                                            <span className="material-symbols-outlined text-sm">person</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-zinc-900 dark:text-white text-sm truncate">{member.name}</h4>
                                    <p className="text-xs text-primary font-semibold">{member.role}</p>
                                    <div className="flex gap-2 mt-1">
                                        {member.phone && <span className="text-[10px] text-zinc-500 flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px]">call</span> {member.phone}</span>}
                                        {member.email && <span className="text-[10px] text-zinc-500 flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px]">mail</span> {member.email}</span>}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 shrink-0">
                                    <button
                                        onClick={() => handleEdit(member)}
                                        className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 shadow-sm border border-zinc-100 dark:border-zinc-700 hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(member)}
                                        className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 shadow-sm border border-zinc-100 dark:border-zinc-700 hover:text-red-500 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {team.length === 0 && (
                            <div className="col-span-full py-8 text-center text-zinc-500">
                                No hay miembros en el equipo.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
