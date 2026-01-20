
import React, { useState } from 'react';

// Mock Data
const mockPoints = [
    { id: 1, passenger: 'Camila Silva', email: 'camila@email.com', points: 1250, origin: 'Viaje a Bariloche', expiration: '15 Oct 2025', status: 'active' },
    { id: 2, passenger: 'Juan Pérez', email: 'juan@email.com', points: 800, origin: 'Referido', expiration: '20 Nov 2025', status: 'active' },
    { id: 3, passenger: 'María González', email: 'maria@email.com', points: 2100, origin: 'Múltiples viajes', expiration: '01 Dic 2025', status: 'active' },
    { id: 4, passenger: 'Carlos Rodríguez', email: 'carlos@email.com', points: 500, origin: 'Evento especial', expiration: '10 Sep 2024', status: 'expiring' },
    { id: 5, passenger: 'Diego López', email: 'diego@email.com', points: 1500, origin: 'Viajes corporativos', expiration: '25 Dic 2025', status: 'active' },
];

export const AdminPoints: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAssignModal, setShowAssignModal] = useState(false);

    const totalPoints = mockPoints.reduce((acc, p) => acc + p.points, 0);
    const expiringCount = mockPoints.filter(p => p.status === 'expiring').length;

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-2xl">stars</span>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-zinc-800 dark:text-white">{totalPoints.toLocaleString()}</p>
                            <p className="text-sm text-zinc-500">Puntos totales activos</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <span className="material-symbols-outlined text-2xl">group</span>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-zinc-800 dark:text-white">{mockPoints.length}</p>
                            <p className="text-sm text-zinc-500">Pasajeros con puntos</p>
                        </div>
                    </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                            <span className="material-symbols-outlined text-2xl">schedule</span>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-amber-600">{expiringCount}</p>
                            <p className="text-sm text-amber-600">Por vencer este mes</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xl">search</span>
                    <input
                        type="text"
                        placeholder="Buscar pasajero..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90"
                >
                    <span className="material-symbols-outlined text-xl">add_circle</span>
                    Asignar Puntos
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                            <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Pasajero</th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Puntos</th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Origen</th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Vencimiento</th>
                            <th className="text-right px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                        {mockPoints.filter(p => p.passenger.toLowerCase().includes(searchTerm.toLowerCase())).map((point) => (
                            <tr key={point.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                            {point.passenger.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-800 dark:text-white">{point.passenger}</p>
                                            <p className="text-xs text-zinc-500">{point.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-lg font-bold text-primary">{point.points.toLocaleString()}</span>
                                    <span className="text-xs text-zinc-400 ml-1">pts</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">{point.origin}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-sm ${point.status === 'expiring' ? 'text-amber-600 font-semibold' : 'text-zinc-500'}`}>
                                        {point.expiration}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="p-2 text-zinc-400 hover:text-primary hover:bg-primary/5 rounded-lg" title="Agregar puntos">
                                            <span className="material-symbols-outlined text-lg">add_circle</span>
                                        </button>
                                        <button className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg" title="Historial">
                                            <span className="material-symbols-outlined text-lg">history</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
