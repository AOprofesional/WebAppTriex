import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrips } from '../../hooks/useTrips';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../components/ConfirmDialog';
import { TripStatusBadge } from '../../components/TripStatusBadge';
import { calculateTripStatus } from '../../utils/dateUtils';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export const AdminTrips: React.FC = () => {
    const navigate = useNavigate();
    const { trips, loading, error, fetchTrips, archiveTrip, restoreTrip, deleteTrip } = useTrips();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatusCommercial, setFilterStatusCommercial] = useState('all');
    const [filterStatusOperational, setFilterStatusOperational] = useState('all');
    const [filterBrandSub, setFilterBrandSub] = useState('all');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const [filterStatus, setFilterStatus] = useState<'active' | 'archived'>('active');

    const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
        return (localStorage.getItem('adminTripsViewMode') as 'list' | 'grid') || 'grid';
    });

    const toggleViewMode = (mode: 'list' | 'grid') => {
        setViewMode(mode);
        localStorage.setItem('adminTripsViewMode', mode);
    };



    // Apply filters whenever they change
    useEffect(() => {
        const filters: any = {};

        if (searchTerm) filters.searchTerm = searchTerm;
        if (filterStatusCommercial !== 'all') filters.statusCommercial = filterStatusCommercial;
        if (filterStatusOperational !== 'all') filters.statusOperational = filterStatusOperational;
        if (filterBrandSub !== 'all') filters.brandSub = filterBrandSub;
        if (filterStartDate) filters.startDate = filterStartDate;
        if (filterEndDate) filters.endDate = filterEndDate;

        // Add Status filter
        filters.status = filterStatus;

        fetchTrips(Object.keys(filters).length > 0 ? filters : { status: filterStatus });
    }, [searchTerm, filterStatusCommercial, filterStatusOperational, filterBrandSub, filterStartDate, filterEndDate, filterStatus, fetchTrips]);

    const { confirm } = useConfirm();

    const handleArchive = async (id: string, tripName: string) => {
        const confirmed = await confirm({
            title: 'Archivar Viaje',
            message: `¿Archivar el viaje "${tripName}"?\n\nEl viaje no se eliminará, solo se moverá a la lista de archivados.`,
            confirmText: 'Archivar',
            confirmVariant: 'primary'
        });

        if (!confirmed) return;

        const { error } = await archiveTrip(id);
        if (error) {
            toast.error('Error al archivar viaje: ' + error);
        } else {
            toast.success('Viaje archivado exitosamente');
        }
    };

    const handleRestore = async (id: string, tripName: string) => {
        const confirmed = await confirm({
            title: 'Restaurar Viaje',
            message: `¿Restaurar el viaje "${tripName}"?\n\nVolverá a aparecer en la lista principal.`,
            confirmText: 'Restaurar',
            confirmVariant: 'success'
        });

        if (!confirmed) return;

        const { error } = await restoreTrip(id);
        if (error) {
            toast.error('Error al restaurar viaje: ' + error);
        } else {
            toast.success('Viaje restaurado exitosamente');
        }
    };

    const handleDelete = async (id: string, tripName: string) => {
        const confirmed = await confirm({
            title: '⚠ Eliminar Permanentemente',
            message: `¿ELIMINAR PERMANENTEMENTE "${tripName}"?\n\nEsta acción NO SE PUEDE DESHACER. Se borrarán todos los datos asociados (pasajeros, documentos, vouchers, etc).\n\nPara confirmar, escribe el nombre del viaje exactamente: "${tripName}"`,
            confirmText: 'Eliminar Permanentemente',
            confirmVariant: 'danger'
        });

        if (!confirmed) return;

        const { error } = await deleteTrip(id);
        if (error) {
            toast.error('Error al eliminar viaje: ' + error);
        } else {
            toast.success('Viaje eliminado permanentemente');
        }
    };




    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Get unique brand_subs for filter
    const uniqueBrands = Array.from(new Set(trips.map(t => t.brand_sub).filter(Boolean)));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-triex-grey dark:text-white">Viajes</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Gestión completa de viajes y asignación de pasajeros
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                        <button
                            onClick={() => toggleViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm text-primary' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                            title="Vista de lista"
                        >
                            <span className="material-symbols-outlined text-xl">table_rows</span>
                        </button>
                        <button
                            onClick={() => toggleViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm text-primary' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                            title="Vista de tarjetas"
                        >
                            <span className="material-symbols-outlined text-xl">grid_view</span>
                        </button>
                    </div>
                    <button
                        onClick={() => navigate('/admin/trips/new')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shrink-0"
                    >
                        <span className="material-symbols-outlined text-xl">add</span>
                        Nuevo Viaje
                    </button>
                </div>
            </div>

            {/* Status Operational Tabs (Top Filter) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-0">
                <div className="flex gap-6 overflow-x-auto pb-0">
                    <button
                        onClick={() => setFilterStatusOperational('all')}
                        className={`pb-4 text-sm font-semibold transition-all relative ${filterStatusOperational === 'all'
                            ? 'text-primary'
                            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                            }`}
                    >
                        Todos
                        {filterStatusOperational === 'all' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
                        )}
                    </button>
                    <button
                        onClick={() => setFilterStatusOperational('PREVIO')}
                        className={`pb-4 text-sm font-semibold transition-all relative ${filterStatusOperational === 'PREVIO'
                            ? 'text-primary'
                            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                            }`}
                    >
                        Previo
                        {filterStatusOperational === 'PREVIO' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
                        )}
                    </button>
                    <button
                        onClick={() => setFilterStatusOperational('EN_CURSO')}
                        className={`pb-4 text-sm font-semibold transition-all relative ${filterStatusOperational === 'EN_CURSO'
                            ? 'text-primary'
                            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                            }`}
                    >
                        En curso
                        {filterStatusOperational === 'EN_CURSO' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
                        )}
                    </button>
                    <button
                        onClick={() => setFilterStatusOperational('FINALIZADO')}
                        className={`pb-4 text-sm font-semibold transition-all relative ${filterStatusOperational === 'FINALIZADO'
                            ? 'text-primary'
                            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                            }`}
                    >
                        Finalizado
                        {filterStatusOperational === 'FINALIZADO' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
                        )}
                    </button>
                </div>

                {/* Active/Archived Toggle */}
                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg mb-2 sm:mb-0">
                    <button
                        onClick={() => setFilterStatus('active')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterStatus === 'active'
                            ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        Activos
                    </button>
                    <button
                        onClick={() => setFilterStatus('archived')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterStatus === 'archived'
                            ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        Archivados
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="relative lg:col-span-2">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xl">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, código o destino..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    {/* Status Commercial */}
                    <select
                        value={filterStatusCommercial}
                        onChange={(e) => setFilterStatusCommercial(e.target.value)}
                        className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="ABIERTO">Abierto</option>
                        <option value="COMPLETO">Completo</option>
                        <option value="CERRADO">Cerrado</option>
                    </select>

                    {/* Brand/Submarca */}
                    <select
                        value={filterBrandSub}
                        onChange={(e) => setFilterBrandSub(e.target.value)}
                        className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                        <option value="all">Todas las submarcas</option>
                        {uniqueBrands.map(brand => (
                            <option key={brand} value={brand!}>{brand}</option>
                        ))}
                    </select>

                    {/* Clear Filters */}
                    {(searchTerm || filterStatusCommercial !== 'all' || filterStatusOperational !== 'all' || filterBrandSub !== 'all' || filterStartDate || filterEndDate) && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterStatusCommercial('all');
                                setFilterStatusOperational('all');
                                setFilterBrandSub('all');
                                setFilterStartDate('');
                                setFilterEndDate('');
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">filter_alt_off</span>
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* Content (Table or Grid) */}
            <div className={viewMode === 'list' ? "bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden" : ""}>
                {loading ? (
                    <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="mt-4 text-sm text-zinc-500">Cargando viajes...</p>
                    </div>
                ) : error ? (
                    <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-red-200 dark:border-red-900/50">
                        <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-3xl text-red-500">error</span>
                        </div>
                        <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">
                            Error al cargar viajes
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-md mx-auto">
                            {error}
                        </p>
                        <button
                            onClick={() => fetchTrips()}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-semibold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-all border border-red-200 dark:border-red-800"
                        >
                            <span className="material-symbols-outlined text-xl">refresh</span>
                            Reintentar
                        </button>
                    </div>
                ) : trips.length === 0 ? (
                    <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <div className="w-16 h-16 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-3xl text-zinc-400">flight_takeoff</span>
                        </div>
                        <h3 className="text-lg font-bold text-triex-grey dark:text-white mb-2">
                            No hay viajes
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                            {searchTerm || filterStatusCommercial !== 'all' || filterStatusOperational !== 'all' || filterBrandSub !== 'all'
                                ? 'No se encontraron viajes con los filtros aplicados'
                                : 'Comienza creando tu primer viaje'}
                        </p>
                        {!searchTerm && filterStatusCommercial === 'all' && filterStatusOperational === 'all' && filterBrandSub === 'all' && (
                            <button
                                onClick={() => navigate('/admin/trips/new')}
                                className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all"
                            >
                                <span className="material-symbols-outlined text-xl">add</span>
                                Crear primer viaje
                            </button>
                        )}
                    </div>
                ) : viewMode === 'list' ? (
                    // List View (Table)
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Nombre
                                    </th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Código
                                    </th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Destino
                                    </th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Inicio
                                    </th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Fin
                                    </th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Estado Op.
                                    </th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Estado Com.
                                    </th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Submarca
                                    </th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Pasajeros
                                    </th>
                                    <th className="text-right px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {trips.map((trip: any) => (
                                    <tr
                                        key={trip.id}
                                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                    <span className="material-symbols-outlined text-xl">flight_takeoff</span>
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-triex-grey dark:text-white text-sm">
                                                        {trip.name}
                                                    </div>
                                                    {trip.next_step_override_enabled && (
                                                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-md text-xs font-medium">
                                                            <span className="material-symbols-outlined text-sm">edit_note</span>
                                                            Override
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-zinc-600 dark:text-zinc-400 font-mono">
                                                {trip.internal_code || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                                {trip.destination}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                                {formatDate(trip.start_date)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                                {formatDate(trip.end_date)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <TripStatusBadge status={calculateTripStatus(trip.start_date, trip.end_date)} size="sm" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${trip.status_commercial === 'CON_CUPO'
                                                ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                : trip.status_commercial === 'SIN_CUPO'
                                                    ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                                }`}>
                                                {trip.status_commercial || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                                {trip.brand_sub || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-bold">
                                                {trip.trip_passengers?.[0]?.count || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {filterStatus === 'archived' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleRestore(trip.id, trip.name)}
                                                            className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 rounded-lg transition-colors"
                                                            title="Restaurar"
                                                        >
                                                            <span className="material-symbols-outlined text-xl">restore_from_trash</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(trip.id, trip.name)}
                                                            className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                                                            title="Eliminar permanentemente"
                                                        >
                                                            <span className="material-symbols-outlined text-xl">delete_forever</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => navigate(`/admin/trips/${trip.id}`)}
                                                            className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <span className="material-symbols-outlined text-xl">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleArchive(trip.id, trip.name)}
                                                            className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                                                            title="Archivar"
                                                        >
                                                            <span className="material-symbols-outlined text-xl">archive</span>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    // Grid View (Cards)
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {trips.map((trip: any) => (
                            <div
                                key={trip.id}
                                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group p-6"
                            >
                                {/* Header: Icon & Status */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center text-orange-500 shadow-sm">
                                        <span className="material-symbols-outlined text-2xl">flight_takeoff</span>
                                    </div>
                                    <TripStatusBadge status={calculateTripStatus(trip.start_date, trip.end_date)} size="sm" />
                                </div>

                                {/* Title & Location */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-triex-grey dark:text-white mb-1 line-clamp-1" title={trip.name}>
                                        {trip.name}
                                    </h3>
                                    <div className="flex items-center gap-1 text-sm text-zinc-400">
                                        <span className="material-symbols-outlined text-base">location_on</span>
                                        <span className="line-clamp-1">{trip.destination}</span>
                                    </div>
                                </div>

                                {/* Details List */}
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-400">Fechas</span>
                                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                            {formatDate(trip.start_date)} - {formatDate(trip.end_date).split(' ').slice(0, 2).join(' ')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-400">Pasajeros</span>
                                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                            {trip.trip_passengers?.[0]?.count || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-400">Submarca</span>
                                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                            {trip.brand_sub || 'General'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-400">Estado</span>
                                        <span className={`font-semibold ${trip.status_commercial === 'CON_CUPO'
                                            ? 'text-green-500'
                                            : trip.status_commercial === 'SIN_CUPO'
                                                ? 'text-orange-500'
                                                : 'text-zinc-500'
                                            }`}>
                                            {trip.status_commercial?.replace('_', ' ') || '-'}
                                        </span>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-zinc-100 dark:bg-zinc-800 w-full mb-4"></div>

                                {/* Footer & Actions */}
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => navigate(`/admin/trips/${trip.id}`)}
                                        className="text-orange-500 font-bold text-sm hover:text-orange-600 transition-colors"
                                    >
                                        Ver detalle
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {filterStatus === 'archived' ? (
                                            <>
                                                <button
                                                    onClick={() => handleRestore(trip.id, trip.name)}
                                                    className="p-1.5 text-zinc-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                                                    title="Restaurar"
                                                >
                                                    <span className="material-symbols-outlined text-xl">restore_from_trash</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(trip.id, trip.name)}
                                                    className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors"
                                                    title="Eliminar permanentemente"
                                                >
                                                    <span className="material-symbols-outlined text-xl">delete_forever</span>
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => navigate(`/admin/trips/${trip.id}`)}
                                                    className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                                                    title="Editar"
                                                >
                                                    <span className="material-symbols-outlined text-xl">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleArchive(trip.id, trip.name)}
                                                    className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                                                    title="Archivar"
                                                >
                                                    <span className="material-symbols-outlined text-xl">archive</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Stats Footer */}
            {
                !loading && trips.length > 0 && (
                    <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 px-2">
                        <span>
                            Mostrando <strong className="text-triex-grey dark:text-white">{trips.length}</strong> viaje{trips.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs">
                            Última actualización: {new Date().toLocaleTimeString('es-AR')}
                        </span>
                    </div>
                )
            }
        </div >
    );
};
