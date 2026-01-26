
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePassengers } from '../../hooks/usePassengers';
import { CreatePassengerModal } from '../../components/CreatePassengerModal';


// Status Badge Component
const StatusBadge: React.FC<{ isRecurrent: boolean | null }> = ({ isRecurrent }) => {
    if (isRecurrent) {
        return (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                Recurrente
            </span>
        );
    }
    return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            Nuevo
        </span>
    );
};

export const AdminPassengers: React.FC = () => {
    const navigate = useNavigate();
    const { passengers, loading, error, deletePassenger } = usePassengers();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);


    const filteredPassengers = passengers.filter(p => {
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
            p.passenger_email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || p.type_code?.toLowerCase() === filterType.toLowerCase();
        return matchesSearch && matchesType;
    });

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`¿Estás seguro de eliminar a ${name}?`)) {
            const { error } = await deletePassenger(id);
            if (error) {
                alert(`Error al eliminar: ${error}`);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                    <p className="mt-4 text-zinc-600 dark:text-zinc-400">Cargando pasajeros...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-red-500">error</span>
                    <div>
                        <h3 className="font-bold text-red-800 dark:text-red-300">Error al cargar pasajeros</h3>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xl">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar pasajeros..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    {/* Filter */}
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                        <option value="all">Todos los tipos</option>
                        <option value="regular">Regular</option>
                        <option value="vip">VIP</option>
                        <option value="corporate">Corporativo</option>
                        <option value="other">Otro</option>
                    </select>
                </div>

                {/* Add Button */}
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shrink-0"
                >
                    <span className="material-symbols-outlined text-xl">person_add</span>
                    Nuevo Pasajero
                </button>

            </div>

            {/* Empty State */}
            {filteredPassengers.length === 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-12 text-center">
                    <span className="material-symbols-outlined text-6xl text-zinc-300 dark:text-zinc-700 mb-4 block">
                        person_off
                    </span>
                    <h3 className="font-bold text-lg text-zinc-800 dark:text-white mb-2">
                        {searchTerm || filterType !== 'all' ? 'No se encontraron pasajeros' : 'No hay pasajeros registrados'}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {searchTerm || filterType !== 'all'
                            ? 'Intenta con otros términos de búsqueda'
                            : 'Comienza agregando tu primer pasajero'}
                    </p>
                </div>
            )}

            {/* Table */}
            {filteredPassengers.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pasajero</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tipo</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Teléfono</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Documento</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Estado</th>
                                    <th className="text-right px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                                {filteredPassengers.map((passenger) => {
                                    const initials = `${passenger.first_name[0]}${passenger.last_name[0]}`;
                                    const fullName = `${passenger.first_name} ${passenger.last_name}`;

                                    return (
                                        <tr key={passenger.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-zinc-800 dark:text-white">{fullName}</p>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{passenger.passenger_email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-zinc-600 dark:text-zinc-300">
                                                    {passenger.type_name || 'Sin tipo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-zinc-600 dark:text-zinc-300">
                                                    {passenger.phone || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-zinc-600 dark:text-zinc-300">
                                                    {passenger.document_number ? `${passenger.document_type} ${passenger.document_number}` : '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge isRecurrent={passenger.is_recurrent} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                                                        title="Ver detalles"
                                                        onClick={() => alert(`Ver detalles de ${fullName} - Próximamente`)}
                                                    >
                                                        <span className="material-symbols-outlined text-lg">visibility</span>
                                                    </button>
                                                    <button
                                                        className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                                                        title="Editar"
                                                        onClick={() => alert(`Editar ${fullName} - Próximamente`)}
                                                    >
                                                        <span className="material-symbols-outlined text-lg">edit</span>
                                                    </button>
                                                    <button
                                                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                        onClick={() => handleDelete(passenger.id, fullName)}
                                                    >
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Mostrando {filteredPassengers.length} de {passengers.length} pasajeros
                        </p>
                    </div>
                </div>
            )}

            {/* Create Passenger Modal */}
            <CreatePassengerModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
};
