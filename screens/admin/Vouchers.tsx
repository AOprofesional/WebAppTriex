
import React, { useState } from 'react';

// Mock Data
const mockVouchers = [
    { id: 1, name: 'Voucher Hotel Hilton', type: 'hotel', trip: 'Viaje a Bariloche', passenger: 'Camila Silva', status: 'aprobado', uploadDate: '15 Oct 2024' },
    { id: 2, name: 'Seguro de Viaje', type: 'documento', trip: 'Viaje a Bariloche', passenger: 'Juan Pérez', status: 'pendiente', uploadDate: '14 Oct 2024' },
    { id: 3, name: 'Pasaporte', type: 'documento', trip: 'Egresados 2024 - Cancún', passenger: 'María González', status: 'pendiente', uploadDate: '13 Oct 2024' },
    { id: 4, name: 'Voucher Vuelo', type: 'vuelo', trip: 'Viaje Corporativo Miami', passenger: null, status: 'aprobado', uploadDate: '12 Oct 2024' },
    { id: 5, name: 'Ficha Médica', type: 'documento', trip: 'Viaje a Bariloche', passenger: 'Carlos Rodríguez', status: 'pendiente', uploadDate: '11 Oct 2024' },
];

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const styles: Record<string, string> = {
        aprobado: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        pendiente: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        rechazado: 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${styles[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

const TypeIcon: React.FC<{ type: string }> = ({ type }) => {
    const icons: Record<string, { icon: string; bg: string }> = {
        hotel: { icon: 'hotel', bg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
        vuelo: { icon: 'flight', bg: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
        documento: { icon: 'description', bg: 'bg-primary/10 text-primary' },
    };

    const config = icons[type] || icons.documento;

    return (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bg}`}>
            <span className="material-symbols-outlined">{config.icon}</span>
        </div>
    );
};

export const AdminVouchers: React.FC = () => {
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredVouchers = mockVouchers.filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.trip.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xl">search</span>
                        <input
                            type="text"
                            placeholder="Buscar vouchers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                    >
                        <option value="all">Todos</option>
                        <option value="pendiente">Pendientes</option>
                        <option value="aprobado">Aprobados</option>
                    </select>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90">
                    <span className="material-symbols-outlined text-xl">upload_file</span>
                    Cargar Archivo
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                    <p className="text-2xl font-bold text-zinc-800 dark:text-white">{mockVouchers.length}</p>
                    <p className="text-sm text-zinc-500">Total archivos</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                    <p className="text-2xl font-bold text-amber-600">{mockVouchers.filter(v => v.status === 'pendiente').length}</p>
                    <p className="text-sm text-amber-600">Pendientes</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <p className="text-2xl font-bold text-green-600">{mockVouchers.filter(v => v.status === 'aprobado').length}</p>
                    <p className="text-sm text-green-600">Aprobados</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                            <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Archivo</th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Viaje</th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Pasajero</th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Fecha</th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Estado</th>
                            <th className="text-right px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                        {filteredVouchers.map((voucher) => (
                            <tr key={voucher.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <TypeIcon type={voucher.type} />
                                        <span className="text-sm font-semibold text-zinc-800 dark:text-white">{voucher.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">{voucher.trip}</td>
                                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">{voucher.passenger || '—'}</td>
                                <td className="px-6 py-4 text-sm text-zinc-500">{voucher.uploadDate}</td>
                                <td className="px-6 py-4"><StatusBadge status={voucher.status} /></td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="p-2 text-zinc-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Aprobar">
                                            <span className="material-symbols-outlined text-lg">check_circle</span>
                                        </button>
                                        <button className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Ver">
                                            <span className="material-symbols-outlined text-lg">visibility</span>
                                        </button>
                                        <button className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Rechazar">
                                            <span className="material-symbols-outlined text-lg">cancel</span>
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
