import React, { useState, useEffect } from 'react';
import { useAdminVouchers } from '../../hooks/useAdminVouchers';
import { useTrips } from '../../hooks/useTrips';
import { VoucherFormModal } from '../../components/modals/VoucherFormModal';
import { VoucherViewModal } from '../../components/modals/VoucherViewModal';

export const AdminVouchers: React.FC = () => {
    const { vouchers, voucherTypes, loading, fetchVoucherTypes, fetchAllVouchers, archiveVoucher } = useAdminVouchers();
    const { trips } = useTrips();

    const [filters, setFilters] = useState({
        search: '',
        typeId: '',
        format: '',
        tripId: '',
        status: 'active',
    });

    const [formModalOpen, setFormModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters]);

    const loadData = async () => {
        await fetchVoucherTypes();
        await fetchAllVouchers();
    };

    const applyFilters = () => {
        const filterParams: any = {};
        if (filters.typeId) filterParams.typeId = filters.typeId;
        if (filters.format) filterParams.format = filters.format;
        if (filters.tripId) filterParams.tripId = filters.tripId;
        if (filters.status) filterParams.status = filters.status;

        fetchAllVouchers(filterParams);
    };

    const filteredVouchers = vouchers.filter(v => {
        if (!filters.search) return true;
        const searchLower = filters.search.toLowerCase();
        return (
            v.title.toLowerCase().includes(searchLower) ||
            v.trips?.name.toLowerCase().includes(searchLower) ||
            v.passengers?.first_name.toLowerCase().includes(searchLower) ||
            v.passengers?.last_name.toLowerCase().includes(searchLower)
        );
    });

    const handleView = (voucher: any) => {
        setSelectedVoucher(voucher);
        setViewModalOpen(true);
    };

    const handleEdit = (voucher: any) => {
        setSelectedVoucher(voucher);
        setViewModalOpen(false);
        setFormModalOpen(true);
    };

    const handleArchive = async (voucher: any) => {
        if (!confirm(`¿Archivar el voucher "${voucher.title}"?`)) return;

        const { error } = await archiveVoucher(voucher.id);
        if (error) {
            alert('Error al archivar: ' + error);
        } else {
            setViewModalOpen(false);
        }
    };

    const getFormatIcon = (format: string) => {
        const icons: Record<string, { icon: string; color: string }> = {
            pdf: { icon: 'picture_as_pdf', color: 'text-red-600' },
            image: { icon: 'image', color: 'text-blue-600' },
            link: { icon: 'link', color: 'text-purple-600' },
        };
        return icons[format] || icons.pdf;
    };

    const getTypeIcon = (typeName: string | undefined) => {
        const typeMap: Record<string, { icon: string; bg: string }> = {
            'Hotel': { icon: 'hotel', bg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
            'Transporte': { icon: 'directions_bus', bg: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
            'Actividad': { icon: 'local_activity', bg: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
            'Asistencia': { icon: 'health_and_safety', bg: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
            'Evento': { icon: 'event', bg: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' },
            'Experiencia': { icon: 'star', bg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
        };

        return typeMap[typeName || ''] || { icon: 'description', bg: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' };
    };

    const stats = {
        total: vouchers.length,
        pdf: vouchers.filter(v => v.format === 'pdf').length,
        images: vouchers.filter(v => v.format === 'image').length,
        links: vouchers.filter(v => v.format === 'link').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-triex-grey dark:text-white">Vouchers</h1>
                    <p className="text-sm text-zinc-500 mt-1">Gestiona todos los vouchers de viajes</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedVoucher(null);
                        setFormModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all"
                >
                    <span className="material-symbols-outlined text-xl">add</span>
                    Nuevo Voucher
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Search */}
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xl">search</span>
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    {/* Type Filter */}
                    <select
                        value={filters.typeId}
                        onChange={(e) => setFilters({ ...filters, typeId: e.target.value })}
                        className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="">Todos los tipos</option>
                        {voucherTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                    </select>

                    {/* Format Filter */}
                    <select
                        value={filters.format}
                        onChange={(e) => setFilters({ ...filters, format: e.target.value })}
                        className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="">Todos los formatos</option>
                        <option value="pdf">PDF</option>
                        <option value="image">Imagen</option>
                        <option value="link">Link</option>
                    </select>

                    {/* Trip Filter */}
                    <select
                        value={filters.tripId}
                        onChange={(e) => setFilters({ ...filters, tripId: e.target.value })}
                        className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="">Todos los viajes</option>
                        {trips.map((trip: any) => (
                            <option key={trip.id} value={trip.id}>{trip.name}</option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="active">Activos</option>
                        <option value="archived">Archivados</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl text-primary">folder_open</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-triex-grey dark:text-white">{stats.total}</p>
                            <p className="text-xs text-zinc-500">Total vouchers</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl text-red-600">picture_as_pdf</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-triex-grey dark:text-white">{stats.pdf}</p>
                            <p className="text-xs text-zinc-500">PDFs</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl text-blue-600">image</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-triex-grey dark:text-white">{stats.images}</p>
                            <p className="text-xs text-zinc-500">Imágenes</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl text-purple-600">link</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-triex-grey dark:text-white">{stats.links}</p>
                            <p className="text-xs text-zinc-500">Enlaces</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            )}

            {/* Table */}
            {!loading && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Voucher</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Formato</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Viaje</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Pasajero</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Proveedor</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Fecha Servicio</th>
                                    <th className="text-right px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                                {filteredVouchers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-sm text-zinc-500">
                                            No se encontraron vouchers
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVouchers.map((voucher) => {
                                        const typeIcon = getTypeIcon(voucher.voucher_types?.name);
                                        const formatIcon = getFormatIcon(voucher.format);

                                        return (
                                            <tr key={voucher.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeIcon.bg}`}>
                                                            <span className="material-symbols-outlined text-lg">{typeIcon.icon}</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-triex-grey dark:text-white">{voucher.title}</p>
                                                            <p className="text-xs text-zinc-500">{voucher.voucher_types?.name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`material-symbols-outlined text-lg ${formatIcon.color}`}>{formatIcon.icon}</span>
                                                        <span className="text-sm text-zinc-600 dark:text-zinc-300 capitalize">
                                                            {voucher.format === 'image' ? 'Imagen' : voucher.format === 'link' ? 'Enlace' : 'PDF'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {voucher.trips ? (
                                                        <div>
                                                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{voucher.trips.name}</p>
                                                            <p className="text-xs text-zinc-500">{voucher.trips.destination}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-zinc-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                                                    {voucher.passengers ? `${voucher.passengers.first_name} ${voucher.passengers.last_name}` : 'Todos'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                                                    {voucher.provider_name || '—'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-zinc-500">
                                                    {voucher.service_date ? new Date(voucher.service_date).toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleView(voucher)}
                                                            className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                            title="Ver"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">visibility</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(voucher)}
                                                            className="p-2 text-zinc-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                                                            title="Editar"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleArchive(voucher)}
                                                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                            title="Archivar"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">archive</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals */}
            <VoucherFormModal
                isOpen={formModalOpen}
                onClose={() => setFormModalOpen(false)}
                voucher={selectedVoucher}
                onSuccess={loadData}
            />

            <VoucherViewModal
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                voucher={selectedVoucher}
                onEdit={() => handleEdit(selectedVoucher)}
                onArchive={() => handleArchive(selectedVoucher)}
            />
        </div>
    );
};
