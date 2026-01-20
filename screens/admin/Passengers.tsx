
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const styles: Record<string, string> = {
        activo: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        pendiente: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        inactivo: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
    };

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${styles[status] || styles.activo}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

// Mock Data
const mockPassengers = [
    { id: 1, name: 'Camila Silva', email: 'camila@email.com', type: 'Egresado', trips: 2, points: 1250, status: 'activo' },
    { id: 2, name: 'Juan Pérez', email: 'juan@email.com', type: 'Adulto', trips: 1, points: 800, status: 'activo' },
    { id: 3, name: 'María González', email: 'maria@email.com', type: 'Egresado', trips: 3, points: 2100, status: 'activo' },
    { id: 4, name: 'Carlos Rodríguez', email: 'carlos@email.com', type: 'Corporativo', trips: 1, points: 500, status: 'pendiente' },
    { id: 5, name: 'Ana Martínez', email: 'ana@email.com', type: 'Egresado', trips: 0, points: 0, status: 'inactivo' },
    { id: 6, name: 'Diego López', email: 'diego@email.com', type: 'Adulto', trips: 2, points: 1500, status: 'activo' },
    { id: 7, name: 'Laura Fernández', email: 'laura@email.com', type: 'Egresado', trips: 1, points: 650, status: 'activo' },
    { id: 8, name: 'Pablo García', email: 'pablo@email.com', type: 'Corporativo', trips: 0, points: 0, status: 'pendiente' },
];

export const AdminPassengers: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const filteredPassengers = mockPassengers.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || p.type.toLowerCase() === filterType.toLowerCase();
        return matchesSearch && matchesType;
    });

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
                        <option value="egresado">Egresado</option>
                        <option value="adulto">Adulto</option>
                        <option value="corporativo">Corporativo</option>
                    </select>
                </div>

                {/* Add Button */}
                <button
                    onClick={() => navigate('/admin/passengers/new')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shrink-0"
                >
                    <span className="material-symbols-outlined text-xl">person_add</span>
                    Nuevo Pasajero
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                                <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pasajero</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tipo</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Viajes</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Puntos</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Estado</th>
                                <th className="text-right px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                            {filteredPassengers.map((passenger) => (
                                <tr key={passenger.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                {passenger.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-zinc-800 dark:text-white">{passenger.name}</p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400">{passenger.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-zinc-600 dark:text-zinc-300">{passenger.type}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-zinc-800 dark:text-white">{passenger.trips}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-zinc-800 dark:text-white">{passenger.points.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={passenger.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 text-zinc-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" title="Ver puntos">
                                                <span className="material-symbols-outlined text-lg">stars</span>
                                            </button>
                                            <button className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Asociar a viaje">
                                                <span className="material-symbols-outlined text-lg">flight_takeoff</span>
                                            </button>
                                            <button className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors" title="Editar">
                                                <span className="material-symbols-outlined text-lg">edit</span>
                                            </button>
                                            <button className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Mostrando {filteredPassengers.length} de {mockPassengers.length} pasajeros
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-50" disabled>
                            Anterior
                        </button>
                        <button className="px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-lg">1</button>
                        <button className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">2</button>
                        <button className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
