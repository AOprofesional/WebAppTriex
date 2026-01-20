
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Trip Status Badge
const TripStatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
        previo: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', label: 'Previo' },
        en_curso: { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', label: 'En Curso' },
        finalizado: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-500 dark:text-zinc-400', label: 'Finalizado' },
    };

    const style = styles[status] || styles.previo;

    return (
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${style.bg} ${style.text}`}>
            {style.label}
        </span>
    );
};

// Mock Data
const mockTrips = [
    { id: 1, name: 'Viaje a Bariloche', destination: 'Bariloche, Argentina', dates: '15 - 22 Oct 2024', status: 'en_curso', submarca: 'Triex Egresados', passengers: 45, pendingDocs: 5 },
    { id: 2, name: 'Egresados 2024 - Cancún', destination: 'Cancún, México', dates: '01 - 08 Nov 2024', status: 'previo', submarca: 'Triex Egresados', passengers: 120, pendingDocs: 23 },
    { id: 3, name: 'Viaje Corporativo Miami', destination: 'Miami, USA', dates: '10 - 15 Nov 2024', status: 'previo', submarca: 'Triex Corporate', passengers: 25, pendingDocs: 8 },
    { id: 4, name: 'Fin de Año Ushuaia', destination: 'Ushuaia, Argentina', dates: '28 Dic - 02 Ene 2025', status: 'previo', submarca: 'Triex Egresados', passengers: 60, pendingDocs: 45 },
    { id: 5, name: 'Summer Trip Brasil', destination: 'Río de Janeiro, Brasil', dates: '10 - 17 Sep 2024', status: 'finalizado', submarca: 'Triex Egresados', passengers: 80, pendingDocs: 0 },
    { id: 6, name: 'Mendoza Wine Tour', destination: 'Mendoza, Argentina', dates: '05 - 08 Ago 2024', status: 'finalizado', submarca: 'Triex Corporate', passengers: 15, pendingDocs: 0 },
];

export const AdminTrips: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const filteredTrips = mockTrips.filter(trip => {
        const matchesSearch = trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trip.destination.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || trip.status === filterStatus;
        return matchesSearch && matchesStatus;
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
                            placeholder="Buscar viajes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    {/* Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="previo">Previo</option>
                        <option value="en_curso">En Curso</option>
                        <option value="finalizado">Finalizado</option>
                    </select>
                </div>

                {/* Add Button */}
                <button
                    onClick={() => navigate('/admin/trips/new')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shrink-0"
                >
                    <span className="material-symbols-outlined text-xl">add</span>
                    Nuevo Viaje
                </button>
            </div>

            {/* Trips Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTrips.map((trip) => (
                    <div
                        key={trip.id}
                        onClick={() => navigate(`/admin/trips/${trip.id}`)}
                        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                    >
                        {/* Card Header */}
                        <div className="p-5 border-b border-zinc-50 dark:border-zinc-800">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">flight_takeoff</span>
                                </div>
                                <TripStatusBadge status={trip.status} />
                            </div>
                            <h3 className="text-base font-bold text-zinc-800 dark:text-white group-hover:text-primary transition-colors">
                                {trip.name}
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">location_on</span>
                                {trip.destination}
                            </p>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500 dark:text-zinc-400">Fechas</span>
                                <span className="font-medium text-zinc-800 dark:text-white">{trip.dates}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500 dark:text-zinc-400">Pasajeros</span>
                                <span className="font-medium text-zinc-800 dark:text-white">{trip.passengers}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500 dark:text-zinc-400">Submarca</span>
                                <span className="font-medium text-zinc-800 dark:text-white">{trip.submarca}</span>
                            </div>
                            {trip.pendingDocs > 0 && (
                                <div className="flex items-center justify-between text-sm pt-2 border-t border-zinc-50 dark:border-zinc-800">
                                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">pending_actions</span>
                                        Docs pendientes
                                    </span>
                                    <span className="font-bold text-amber-600 dark:text-amber-400">{trip.pendingDocs}</span>
                                </div>
                            )}
                        </div>

                        {/* Card Footer */}
                        <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between">
                            <button className="text-sm text-primary font-semibold hover:underline">
                                Ver detalle
                            </button>
                            <div className="flex items-center gap-1">
                                <button className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                                    <span className="material-symbols-outlined text-lg">more_vert</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredTrips.length === 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-12 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
                        <span className="material-symbols-outlined text-3xl">search_off</span>
                    </div>
                    <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-2">No se encontraron viajes</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Intenta con otros filtros o crea un nuevo viaje</p>
                </div>
            )}
        </div>
    );
};
