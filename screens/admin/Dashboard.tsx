
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../../hooks/useDashboardData';

// Stat Card Component
const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: string;
    trend?: { value: string; positive: boolean };
    color?: string;
    loading?: boolean;
}> = ({ title, value, icon, trend, color = 'primary', loading = false }) => {
    const colorClasses: Record<string, string> = {
        primary: 'bg-primary/10 text-primary',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
                    {loading ? (
                        <div className="h-9 w-16 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse mt-2"></div>
                    ) : (
                        <p className="text-3xl font-bold text-zinc-800 dark:text-white mt-2">{value}</p>
                    )}
                    {trend && !loading && (
                        <p className={`text-xs font-medium mt-2 ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
                            {trend.positive ? '↑' : '↓'} {trend.value}
                        </p>
                    )}
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
                    <span className="material-symbols-outlined text-2xl">{icon}</span>
                </div>
            </div>
        </div>
    );
};

// Quick Action Button
const QuickAction: React.FC<{
    label: string;
    icon: string;
    onClick: () => void;
}> = ({ label, icon, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center gap-3 px-5 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
    >
        <span className="material-symbols-outlined text-xl">{icon}</span>
        {label}
    </button>
);

// Recent Activity Item
const ActivityItem: React.FC<{
    title: string;
    description: string;
    time: string;
    icon: string;
    iconBg: string;
}> = ({ title, description, time, icon, iconBg }) => (
    <div className="flex items-start gap-4 py-4 border-b border-zinc-50 dark:border-zinc-800 last:border-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            <span className="material-symbols-outlined text-lg">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-800 dark:text-white">{title}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{description}</p>
        </div>
        <span className="text-xs text-zinc-400 shrink-0">{time}</span>
    </div>
);

import { CreatePassengerModal } from '../../components/CreatePassengerModal';
import { VoucherFormModal } from '../../components/modals/VoucherFormModal';

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [isPassengerModalOpen, setIsPassengerModalOpen] = useState(false);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

    const { stats, upcomingTrips, recentActivity, loading } = useDashboardData();

    // Format total points for display
    const formatPoints = (points: number) => {
        if (points >= 1000) {
            return `${(points / 1000).toFixed(1)}K`;
        }
        return points.toString();
    };

    // Format date range
    const formatDateRange = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const startDay = start.getDate();
        const endDay = end.getDate();
        const month = start.toLocaleDateString('es-AR', { month: 'short' });
        return `${startDay} - ${endDay} ${month}`;
    };

    return (
        <div className="space-y-8">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
                <QuickAction label="Crear viaje" icon="add" onClick={() => navigate('/admin/trips/new')} />
                <QuickAction label="Crear pasajero" icon="person_add" onClick={() => setIsPassengerModalOpen(true)} />
                <QuickAction label="Cargar voucher" icon="upload_file" onClick={() => setIsVoucherModalOpen(true)} />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Viajes En Curso"
                    value={stats.activeTrips}
                    icon="flight_takeoff"
                    color="primary"
                    loading={loading}
                />
                <StatCard
                    title="Próximos Viajes"
                    value={stats.upcomingTrips}
                    icon="calendar_month"
                    color="blue"
                    loading={loading}
                />
                <StatCard
                    title="Docs Pendientes"
                    value={stats.pendingDocuments}
                    icon="pending_actions"
                    color="amber"
                    loading={loading}
                />
                <StatCard
                    title="Puntos Acreditados"
                    value={formatPoints(stats.totalPoints)}
                    icon="stars"
                    color="purple"
                    loading={loading}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Trips */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <h2 className="text-base font-bold text-zinc-800 dark:text-white">Próximos Viajes</h2>
                        <button
                            onClick={() => navigate('/admin/trips')}
                            className="text-sm text-primary font-semibold hover:underline"
                        >
                            Ver todos
                        </button>
                    </div>
                    <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
                        {loading ? (
                            // Loading skeleton
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="px-6 py-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2 animate-pulse"></div>
                                        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/3 animate-pulse"></div>
                                    </div>
                                </div>
                            ))
                        ) : upcomingTrips.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <span className="material-symbols-outlined text-4xl text-zinc-300 dark:text-zinc-700">flight_takeoff</span>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">No hay próximos viajes programados</p>
                            </div>
                        ) : (
                            upcomingTrips.map((trip) => (
                                <div
                                    key={trip.id}
                                    onClick={() => navigate(`/admin/trips/${trip.id}`)}
                                    className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined">flight_takeoff</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-800 dark:text-white">{trip.name}</p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{trip.destination}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-zinc-800 dark:text-white">
                                            {formatDateRange(trip.start_date, trip.end_date)}
                                        </p>
                                        <p className="text-xs text-zinc-400">{trip.passenger_count} pasajeros</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                        <h2 className="text-base font-bold text-zinc-800 dark:text-white">Actividad Reciente</h2>
                    </div>
                    <div className="px-6">
                        {loading ? (
                            // Loading skeleton
                            [...Array(4)].map((_, i) => (
                                <div key={i} className="py-4 border-b border-zinc-50 dark:border-zinc-800 last:border-0">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-3/4 animate-pulse"></div>
                                            <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2 animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : recentActivity.length === 0 ? (
                            <div className="py-12 text-center">
                                <span className="material-symbols-outlined text-4xl text-zinc-300 dark:text-zinc-700">notifications</span>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">No hay actividad reciente</p>
                            </div>
                        ) : (
                            recentActivity.map((activity) => (
                                <ActivityItem key={activity.id} {...activity} />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Pending Documents Alert */}
            {stats.pendingDocuments > 0 && !loading && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <span className="material-symbols-outlined text-2xl">warning</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                                {stats.pendingDocuments} documento{stats.pendingDocuments !== 1 ? 's' : ''} pendiente{stats.pendingDocuments !== 1 ? 's' : ''} de revisión
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Revisar antes de las próximas salidas</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/admin/documents?tab=review')}
                        className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors"
                    >
                        Revisar ahora
                    </button>
                </div>
            )}

            {/* Modals */}
            <CreatePassengerModal
                isOpen={isPassengerModalOpen}
                onClose={() => setIsPassengerModalOpen(false)}
            />
            <VoucherFormModal
                isOpen={isVoucherModalOpen}
                onClose={() => setIsVoucherModalOpen(false)}
                onSuccess={() => setIsVoucherModalOpen(false)}
            />
        </div>
    );
};
