
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Stat Card Component
const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: string;
    trend?: { value: string; positive: boolean };
    color?: string;
}> = ({ title, value, icon, trend, color = 'primary' }) => {
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
                    <p className="text-3xl font-bold text-zinc-800 dark:text-white mt-2">{value}</p>
                    {trend && (
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

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();

    // Mock data
    const stats = [
        { title: 'Viajes Activos', value: 12, icon: 'flight_takeoff', color: 'primary' },
        { title: 'Próximos Viajes', value: 8, icon: 'calendar_month', color: 'blue' },
        { title: 'Docs Pendientes', value: 23, icon: 'pending_actions', color: 'amber' },
        { title: 'Puntos Acreditados', value: '4.5K', icon: 'stars', color: 'purple', trend: { value: '+12% este mes', positive: true } },
    ];

    const recentActivity = [
        { title: 'Documento aprobado', description: 'Seguro de viaje - María González', time: 'Hace 5 min', icon: 'check_circle', iconBg: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
        { title: 'Nuevo pasajero', description: 'Juan Pérez agregado a Viaje Bariloche', time: 'Hace 15 min', icon: 'person_add', iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
        { title: 'Voucher cargado', description: 'Hotel Hilton - Viaje Buenos Aires', time: 'Hace 1 hora', icon: 'upload_file', iconBg: 'bg-primary/10 text-primary' },
        { title: 'Puntos asignados', description: '+500 pts a Carlos Rodríguez', time: 'Hace 2 horas', icon: 'stars', iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    ];

    const upcomingTrips = [
        { id: 1, name: 'Viaje a Bariloche', destination: 'Bariloche, Argentina', date: '15 - 22 Oct', passengers: 45, status: 'confirmado' },
        { id: 2, name: 'Egresados 2024', destination: 'Cancún, México', date: '01 - 08 Nov', passengers: 120, status: 'en_proceso' },
        { id: 3, name: 'Viaje Corporativo', destination: 'Miami, USA', date: '10 - 15 Nov', passengers: 25, status: 'confirmado' },
    ];

    return (
        <div className="space-y-8">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
                <QuickAction label="Crear viaje" icon="add" onClick={() => navigate('/admin/trips/new')} />
                <QuickAction label="Crear pasajero" icon="person_add" onClick={() => navigate('/admin/passengers/new')} />
                <QuickAction label="Cargar voucher" icon="upload_file" onClick={() => navigate('/admin/vouchers/new')} />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <StatCard key={i} {...stat} />
                ))}
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
                        {upcomingTrips.map((trip) => (
                            <div key={trip.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
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
                                    <p className="text-sm font-medium text-zinc-800 dark:text-white">{trip.date}</p>
                                    <p className="text-xs text-zinc-400">{trip.passengers} pasajeros</p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${trip.status === 'confirmado'
                                        ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>
                                    {trip.status === 'confirmado' ? 'Confirmado' : 'En proceso'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                        <h2 className="text-base font-bold text-zinc-800 dark:text-white">Actividad Reciente</h2>
                    </div>
                    <div className="px-6">
                        {recentActivity.map((activity, i) => (
                            <ActivityItem key={i} {...activity} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Pending Documents Alert */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <span className="material-symbols-outlined text-2xl">warning</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-200">23 documentos pendientes de revisión</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Revisar antes de las próximas salidas</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/admin/vouchers?status=pending')}
                    className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors"
                >
                    Revisar ahora
                </button>
            </div>
        </div>
    );
};
